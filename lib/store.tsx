'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { type AppActions, type AppState, type Store, type Tag, type ContactList, type Contact, type Campaign, type Template, type ID } from './types'
import { loadState, saveState, uid } from './storage'
import { listResendDomains, sendWithResend } from './resend'
import toast from 'react-hot-toast'

const initial: AppState = {
  settings: {
    resendApiKey: 're_4gKvrfLK_8PP2RNNUMkF79MEf1HWQ7AZh' // Pre-populate for testing
  },
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
      try {
        setState(s => ({ ...s, settings: { ...s.settings, resendApiKey: key } }))
        if (key) {
          toast.success('API key saved successfully')
        } else {
          toast.success('API key removed')
        }
      } catch (error) {
        toast.error('Failed to save API key')
        throw error
      }
    },
    refreshDomains: async () => {
      const key = state.settings.resendApiKey
      if (!key) {
        toast.error('No API key configured')
        return
      }
      try {
        const out = await listResendDomains(key)
        const domains = out.data.map(d => ({ id: d.id, name: d.name, status: d.status }))
        setState(s => ({ ...s, settings: { ...s.settings, cachedDomains: domains } }))
        toast.success(`Loaded ${domains.length} domains`)
      } catch (error) {
        toast.error('Failed to load domains')
        console.error('Domain refresh error:', error)
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
      try {
        const list: ContactList = { id: uid('list'), name, description, contacts: [], createdAt: Date.now(), updatedAt: Date.now() }
        setState(s => ({ ...s, lists: [...s.lists, list] }))
        toast.success(`List "${name}" created successfully`)
        return list.id
      } catch (error) {
        toast.error('Failed to create list')
        throw error
      }
    },
    updateList: (id, updater) => {
      setState(s => ({
        ...s,
        lists: s.lists.map(l => (l.id === id ? { ...updater(l), updatedAt: Date.now() } : l)),
      }))
    },
    deleteList: (id) => {
      try {
        const list = state.lists.find(l => l.id === id)
        setState(s => ({ ...s, lists: s.lists.filter(l => l.id !== id) }))
        toast.success(`List "${list?.name || 'Unknown'}" deleted`)
      } catch (error) {
        toast.error('Failed to delete list')
        throw error
      }
    },
    addContacts: (listId, contacts) => {
      try {
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
        toast.success(`Added ${contacts.length} contact${contacts.length === 1 ? '' : 's'}`)
      } catch (error) {
        toast.error('Failed to add contacts')
        throw error
      }
    },
    updateContact: (listId, contactId, updater) => {
      try {
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
        toast.success('Contact updated successfully')
      } catch (error) {
        toast.error('Failed to update contact')
        throw error
      }
    },
    deleteContact: (listId, contactId) => {
      try {
        const list = state.lists.find(l => l.id === listId)
        const contact = list?.contacts.find(c => c.id === contactId)
        setState(s => ({
          ...s,
          lists: s.lists.map(l => (l.id === listId ? { ...l, contacts: l.contacts.filter(c => c.id !== contactId), updatedAt: Date.now() } : l))
        }))
        toast.success(`Deleted contact ${contact?.email || 'Unknown'}`)
      } catch (error) {
        toast.error('Failed to delete contact')
        throw error
      }
    },
    addTemplate: (name, html) => {
      try {
        const t: Template = { id: uid('tpl'), name, html, createdAt: Date.now(), updatedAt: Date.now() }
        setState(s => ({ ...s, templates: [...s.templates, t] }))
        toast.success(`Template "${name}" created`)
      } catch (error) {
        toast.error('Failed to create template')
        throw error
      }
    },
    updateTemplate: (id, name, html) => {
      try {
        setState(s => ({
          ...s,
          templates: s.templates.map(t => (t.id === id ? { ...t, name, html, updatedAt: Date.now() } : t))
        }))
        toast.success(`Template "${name}" updated`)
      } catch (error) {
        toast.error('Failed to update template')
        throw error
      }
    },
    deleteTemplate: (id) => {
      try {
        const template = state.templates.find(t => t.id === id)
        setState(s => ({ ...s, templates: s.templates.filter(t => t.id !== id) }))
        toast.success(`Template "${template?.name || 'Unknown'}" deleted`)
      } catch (error) {
        toast.error('Failed to delete template')
        throw error
      }
    },
    addCampaign: (c) => {
      try {
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
        toast.success(`Campaign "${c.name}" created`)
        return id
      } catch (error) {
        toast.error('Failed to create campaign')
        throw error
      }
    },
    updateCampaign: (id, updater) => {
      setState(s => ({ ...s, campaigns: s.campaigns.map(c => (c.id === id ? { ...updater(c), updatedAt: Date.now() } : c)) }))
    },
    sendCampaignNow: async (id) => {
      const campaign = state.campaigns.find(c => c.id === id)
      if (!campaign) {
        toast.error('Campaign not found')
        return
      }
      const key = state.settings.resendApiKey
      if (!key) {
        setState(s => ({
          ...s,
          campaigns: s.campaigns.map(c => c.id === id ? { ...c, status: 'Failed', updatedAt: Date.now() } : c)
        }))
        toast.error('No API key configured')
        return
      }
      
      try {
        // Compile recipients
        const { recipients, count } = collectRecipients(state.lists, state.tags, campaign.audience.listIds, campaign.audience.tags)
        
        if (count === 0) {
          toast.error('No recipients found for this campaign')
          return
        }
        
        const htmlSource = campaign.html ?? state.templates.find(t => t.id === campaign.templateId)?.html ?? ''
        const uniqueLinks = Array.from(new Set(extractLinks(htmlSource)))
        
        setState(s => ({
          ...s,
          campaigns: s.campaigns.map(c => c.id === id ? { ...c, status: 'Sending', recipientsCount: count, links: uniqueLinks.map(u => ({ url: u, clicks: 0 })) } : c)
        }))

        toast.success(`Sending campaign to ${count} recipients...`)

        let successCount = 0
        let errorCount = 0

        for (const r of recipients) {
          const personalized = applyPersonalization(htmlSource, r)
          try {
            await sendWithResend(key, {
              from: `${campaign.fromName} <${campaign.fromEmail}>`,
              to: r.email,
              subject: campaign.subject,
              html: personalized,
            })
            successCount++
            await wait(150)
          } catch (error) {
            errorCount++
            console.error(`Failed to send to ${r.email}:`, error)
          }
        }

        const points = genSeries48h()
        setState(s => ({
          ...s,
          campaigns: s.campaigns.map(c => c.id === id ? { ...c, status: 'Sent', timeseries48h: points, updatedAt: Date.now() } : c)
        }))

        if (errorCount === 0) {
          toast.success(`Campaign sent successfully to all ${successCount} recipients`)
        } else {
          toast.error(`Campaign partially sent: ${successCount} success, ${errorCount} failed`)
        }
      } catch (error) {
        setState(s => ({
          ...s,
          campaigns: s.campaigns.map(c => c.id === id ? { ...c, status: 'Failed', updatedAt: Date.now() } : c)
        }))
        toast.error('Campaign failed to send')
        console.error('Campaign send error:', error)
      }
    },
    scheduleCampaign: (id, when) => {
      setState(s => ({
        ...s,
        campaigns: s.campaigns.map(c => (c.id === id ? { ...c, status: 'Scheduled', scheduledAt: when, updatedAt: Date.now() } : c))
      }))
    },
    sendAdhocNow: async ({ subject, fromName, fromEmail, html, to }) => {
      const key = state.settings.resendApiKey
      if (!key) {
        toast.error('Please configure your Resend API key in Settings first')
        return
      }

      if (to.length === 0) {
        toast.error('Please enter at least one recipient email address')
        return
      }

      const loadingToast = toast.loading(`Sending email to ${to.length} recipient${to.length > 1 ? 's' : ''}...`)
      
      let successCount = 0
      let errorCount = 0
      const errors: string[] = []

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
          successCount++
          await wait(120)
        } catch (error) {
          errorCount++
          const errorMsg = error instanceof Error ? error.message : 'Unknown error'
          errors.push(`${r.email}: ${errorMsg}`)
          console.error(`Failed to send to ${r.email}:`, error)
        }
      }

      // Dismiss loading toast and show results
      toast.dismiss(loadingToast)
      
      if (successCount > 0 && errorCount === 0) {
        toast.success(`✅ Successfully sent ${successCount} email${successCount > 1 ? 's' : ''}!`)
      } else if (successCount > 0 && errorCount > 0) {
        toast.success(`⚠️ Sent ${successCount} emails, ${errorCount} failed`, { duration: 5000 })
        toast.error(`Failed recipients: ${errors.slice(0, 2).join(', ')}${errors.length > 2 ? '...' : ''}`, { duration: 6000 })
      } else {
        toast.error(`❌ Failed to send emails: ${errors.slice(0, 3).join(', ')}${errors.length > 3 ? '...' : ''}`, { duration: 8000 })
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
