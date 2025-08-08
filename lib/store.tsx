'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { type AppActions, type AppState, type Store, type Tag, type ContactList, type Contact, type Campaign, type Template, type ID } from './types'
import { loadState, saveState, uid } from './storage'
import { listResendDomains, sendWithResend } from './resend'

const initial: AppState = {
  settings: {},
  tags: [],
  lists: [],
  templates: [],
  campaigns: [],
}

const Ctx = createContext<Store>({
  state: initial,
  actions: {} as any,
})

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(() => loadState<AppState>(initial))

  // Persist to localStorage
  useEffect(() => {
    saveState(state)
  }, [state])

  // In-app scheduler for "Scheduled" campaigns
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now()
      const pending = state.campaigns.filter(c => c.status === 'Scheduled' && (c.scheduledAt ?? 0) <= now)
      if (pending.length > 0) {
        pending.forEach(c => {
          actions.sendCampaignNow(c.id)
        })
      }
    }, 30_000)
    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.campaigns, state.settings.resendApiKey])

  const actions: AppActions = useMemo(() => ({
    setResendKey: (key?: string) => {
      setState(s => ({ ...s, settings: { ...s.settings, resendApiKey: key } }))
    },
    refreshDomains: async () => {
      const key = state.settings.resendApiKey
      if (!key) return
      try {
        const out = await listResendDomains(key)
        const domains = out.data.map(d => ({ id: d.id, name: d.name, status: d.status }))
        setState(s => ({ ...s, settings: { ...s.settings, cachedDomains: domains } }))
      } catch {
        // keep cached domains if any
      }
    },
    addTag: (name: string) => {
      const newTag: Tag = { id: uid('tag'), name }
      setState(s => ({ ...s, tags: [...s.tags, newTag] }))
    },
    deleteTag: (id: ID) => {
      setState(s => ({ ...s, tags: s.tags.filter(t => t.id !== id) }))
    },
    addList: ({ name, description }) => {
      const list: ContactList = { id: uid('list'), name, description, contacts: [], createdAt: Date.now(), updatedAt: Date.now() }
      setState(s => ({ ...s, lists: [...s.lists, list] }))
    },
    updateList: (id, updater) => {
      setState(s => ({
        ...s,
        lists: s.lists.map(l => (l.id === id ? { ...updater(l), updatedAt: Date.now() } : l)),
      }))
    },
    deleteList: (id) => {
      setState(s => ({ ...s, lists: s.lists.filter(l => l.id !== id) }))
    },
    addContacts: (listId, contacts) => {
      setState(s => ({
        ...s,
        lists: s.lists.map(l => {
          if (l.id !== listId) return l
          const toAdd: Contact[] = contacts.map(c => ({
            id: uid('ct'),
            email: c.email,
            firstName: c.firstName,
            lastName: c.lastName,
            vars: c.vars && Object.keys(c.vars).length > 0 ? c.vars : undefined,
            tags: c.tags ?? [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
          }))
          return { ...l, contacts: [...l.contacts, ...toAdd], updatedAt: Date.now() }
        })
      }))
    },
    updateContact: (listId, contactId, updater) => {
      setState(s => ({
        ...s,
        lists: s.lists.map(l => {
          if (l.id !== listId) return l
          return {
            ...l,
            contacts: l.contacts.map(c => (c.id === contactId ? { ...updater(c), updatedAt: Date.now() } : c)),
            updatedAt: Date.now(),
          }
        })
      }))
    },
    deleteContact: (listId, contactId) => {
      setState(s => ({
        ...s,
        lists: s.lists.map(l => (l.id === listId ? { ...l, contacts: l.contacts.filter(c => c.id !== contactId), updatedAt: Date.now() } : l))
      }))
    },
    addTemplate: (name, html) => {
      const t: Template = { id: uid('tpl'), name, html, createdAt: Date.now(), updatedAt: Date.now() }
      setState(s => ({ ...s, templates: [...s.templates, t] }))
    },
    updateTemplate: (id, name, html) => {
      setState(s => ({
        ...s,
        templates: s.templates.map(t => (t.id === id ? { ...t, name, html, updatedAt: Date.now() } : t))
      }))
    },
    deleteTemplate: (id) => {
      setState(s => ({ ...s, templates: s.templates.filter(t => t.id !== id) }))
    },
    addCampaign: (c) => {
      const id = uid('cmp')
      const base: Campaign = {
        id,
        name: c.name,
        subject: c.subject,
        fromName: c.fromName,
        fromEmail: c.fromEmail,
        audience: { ...c.audience },
        templateId: c.templateId,
        html: c.html,
        status: c.status ?? 'Draft',
        scheduledAt: c.scheduledAt,
        recipientsCount: 0,
        metrics: { opens: 0, clicks: 0, bounces: 0, unsubscribes: 0 },
        links: [],
        timeseries48h: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
      setState(s => ({ ...s, campaigns: [base, ...s.campaigns] }))
      return id
    },
    updateCampaign: (id, updater) => {
      setState(s => ({ ...s, campaigns: s.campaigns.map(c => (c.id === id ? { ...updater(c), updatedAt: Date.now() } : c)) }))
    },
    sendCampaignNow: async (id) => {
      const campaign = state.campaigns.find(c => c.id === id)
      if (!campaign) return
      const key = state.settings.resendApiKey
      if (!key) {
        setState(s => ({
          ...s,
          campaigns: s.campaigns.map(c => c.id === id ? { ...c, status: 'Failed', updatedAt: Date.now() } : c)
        }))
        return
      }
      // Compile recipients
      const { recipients, count } = collectRecipients(state.lists, state.tags, campaign.audience.listIds, campaign.audience.tags)
      const htmlSource = campaign.html ?? state.templates.find(t => t.id === campaign.templateId)?.html ?? ''
      const uniqueLinks = Array.from(new Set(extractLinks(htmlSource)))
      setState(s => ({
        ...s,
        campaigns: s.campaigns.map(c => c.id === id ? { ...c, status: 'Sending', recipientsCount: count, links: uniqueLinks.map(u => ({ url: u, clicks: 0 })) } : c)
      }))

      for (const r of recipients) {
        const personalized = applyPersonalization(htmlSource, r)
        try {
          await sendWithResend(key, {
            from: `${campaign.fromName} <${campaign.fromEmail}>`,
            to: r.email,
            subject: campaign.subject,
            html: personalized,
          })
          await wait(150)
        } catch {}
      }

      const points = genSeries48h()
      setState(s => ({
        ...s,
        campaigns: s.campaigns.map(c => c.id === id ? { ...c, status: 'Sent', timeseries48h: points, updatedAt: Date.now() } : c)
      }))
    },
    scheduleCampaign: (id, when) => {
      setState(s => ({
        ...s,
        campaigns: s.campaigns.map(c => (c.id === id ? { ...c, status: 'Scheduled', scheduledAt: when, updatedAt: Date.now() } : c))
      }))
    },
    sendAdhocNow: async ({ subject, fromName, fromEmail, html, to }) => {
      const key = state.settings.resendApiKey
      if (!key) return
      for (const r of to) {
        const body = applyPersonalization(html, {
          id: 'adhoc',
          email: r.email,
          firstName: r.firstName,
          lastName: r.lastName,
          vars: r.vars,
          tags: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
        try {
          await sendWithResend(key, {
            from: `${fromName} <${fromEmail}>`,
            to: r.email,
            subject,
            html: body,
          })
          await wait(120)
        } catch {}
      }
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [state])

  const value = useMemo<Store>(() => ({ state, actions }), [state, actions])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAppStore() {
  return useContext(Ctx)
}

function wait(ms: number) {
  return new Promise(res => setTimeout(res, ms))
}

function collectRecipients(lists: ContactList[], tags: Tag[], listIds: ID[], tagIds: ID[]) {
  const selected = lists.filter(l => listIds.includes(l.id)).flatMap(l => l.contacts)
  const filtered = tagIds.length > 0
    ? selected.filter(c => tagIds.every(tid => c.tags.includes(tid)))
    : selected
  const seen = new Set<string>()
  const recipients = filtered.filter(c => {
    if (seen.has(c.email)) return false
    seen.add(c.email)
    return true
  })
  return { recipients, count: recipients.length }
}

function applyPersonalization(html: string, contact: Contact) {
  // Built-in fields
  const builtIns: Record<string, string | undefined> = {
    firstName: contact.firstName,
    lastName: contact.lastName,
    email: contact.email,
  }
  // Prefer built-ins, else fall back to custom vars from CSV
  return html.replace(/\{\{([\w-]+)\}\}/g, (_, key) => {
    const v = builtIns[key] ?? contact.vars?.[key]
    return (v ?? '')
  })
}

function extractLinks(html: string): string[] {
  const urls: string[] = []
  const re = /href="([^"]+)"/g
  let m
  while ((m = re.exec(html)) !== null) {
    urls.push(m[1])
  }
  return urls
}

function genSeries48h() {
  const now = Date.now()
  const points: { t: number; opens: number; clicks: number }[] = []
  for (let i = 0; i <= 48; i++) {
    points.push({ t: now + i * 3600_000, opens: 0, clicks: 0 })
  }
  return points
}
