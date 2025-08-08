'use client'

import { useMemo, useState } from 'react'
import { useAppStore } from '@/lib/store'
import type { ID } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import TemplateEditor from './template-editor'
import { CalendarClock, Send, CheckCircle2 } from 'lucide-react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { openCampaignReport } from '@/lib/report-ui'

export default function Campaigns() {
  const { state } = useAppStore()
  return (
    <div className="space-y-6">
      <CampaignWizard />
      <Card className="border-slate-800 bg-slate-900">
        <CardHeader>
          <CardTitle>Recent Campaigns</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-slate-300">
                <tr className="border-b border-slate-800">
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Recipients</th>
                  <th className="py-2 pr-4">Subject</th>
                </tr>
              </thead>
              <tbody>
                {state.campaigns.map(c => (
                  <tr key={c.id} className="border-b border-slate-900">
                    <td className="py-3 pr-4">
                      <button className="text-emerald-300 underline underline-offset-2 hover:text-emerald-200" onClick={() => openCampaignReport(c.id)}>
                        {c.name}
                      </button>
                    </td>
                    <td className="py-3 pr-4">
                      <Badge variant="outline" className="border-slate-700 text-slate-200">{c.status}</Badge>
                    </td>
                    <td className="py-3 pr-4">{c.recipientsCount ?? '-'}</td>
                    <td className="py-3 pr-4">{c.subject}</td>
                  </tr>
                ))}
                {state.campaigns.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-400">No campaigns yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function CampaignWizard() {
  const { state, actions } = useAppStore()

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [name, setName] = useState('')
  const [subject, setSubject] = useState('')
  const [fromName, setFromName] = useState('')
  const [fromEmail, setFromEmail] = useState(() => 
    typeof window !== 'undefined' ? localStorage.getItem('defaultSenderEmail') || 'noreply@agents.community-enriched.com' : 'noreply@agents.community-enriched.com'
  )

  const [selectedLists, setSelectedLists] = useState<ID[]>([])
  const [selectedTags, setSelectedTags] = useState<ID[]>([])
  const { recipientsCount } = useMemo(() => {
    const selected = state.lists.filter(l => selectedLists.includes(l.id)).flatMap(l => l.contacts)
    const filtered = selectedTags.length > 0 ? selected.filter(c => selectedTags.every(t => c.tags.includes(t))) : selected
    const seen = new Set<string>()
    const unique = filtered.filter(c => {
      if (seen.has(c.email)) return false
      seen.add(c.email)
      return true
    })
    return { recipientsCount: unique.length }
  }, [state.lists, selectedLists, selectedTags])

  const [mode, setMode] = useState<'template' | 'scratch'>('template')
  const [templateId, setTemplateId] = useState<string | undefined>(state.templates[0]?.id)
  const [html, setHtml] = useState('<h1>Hello {{firstName}}</h1>\n<p>Write your message...</p>')

  const [sending, setSending] = useState(false)
  const [openSchedule, setOpenSchedule] = useState(false)
  const [scheduleAt, setScheduleAt] = useState<string>('')

  const canNext1 = name.trim() && subject.trim() && fromName.trim() && fromEmail.trim()
  const canNext2 = recipientsCount > 0
  const canNext3 = (mode === 'template' && !!templateId) || (mode === 'scratch' && html.trim())

  const createDraft = () => {
    const id = actions.addCampaign({
      name: name.trim(),
      subject: subject.trim(),
      fromName: fromName.trim(),
      fromEmail: fromEmail.trim(),
      audience: { listIds: selectedLists, tags: selectedTags },
      templateId: mode === 'template' ? templateId : undefined,
      html: mode === 'scratch' ? html : undefined,
      status: 'Draft',
    })
    return id
  }

  const sendNow = async () => {
    setSending(true)
    const id = createDraft()
    await actions.sendCampaignNow(id)
    setSending(false)
    setStep(4)
    openCampaignReport(id)
    resetAll()
  }

  const scheduleLater = () => {
    const id = createDraft()
    const when = new Date(scheduleAt).getTime()
    actions.scheduleCampaign(id, when)
    setOpenSchedule(false)
    resetAll()
  }

  const resetAll = () => {
    setStep(1)
    setName(''); setSubject(''); setFromName('')
    setFromEmail(typeof window !== 'undefined' ? localStorage.getItem('defaultSenderEmail') || 'noreply@agents.community-enriched.com' : 'noreply@agents.community-enriched.com')
    setSelectedLists([]); setSelectedTags([])
    setMode('template'); setTemplateId(state.templates[0]?.id); setHtml('<h1>Hello {{firstName}}</h1>\n<p>Write your message...</p>')
  }

  return (
    <Card className="border-slate-800 bg-slate-900">
      <CardHeader>
        <CardTitle>New Campaign</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 md:grid-cols-4">
          <StepBadge n={1} label="Setup" active={step === 1} done={step > 1} onClick={() => setStep(1)} />
          <StepBadge n={2} label="Audience" active={step === 2} done={step > 2} onClick={() => setStep(2)} />
          <StepBadge n={3} label="Design" active={step === 3} done={step > 3} onClick={() => setStep(3)} />
          <StepBadge n={4} label="Review & Send" active={step === 4} done={false} onClick={() => setStep(4)} />
        </div>
        <Separator className="bg-slate-800" />

        {step === 1 && (
          <div className="grid gap-3 md:grid-cols-2">
            <Input className="bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-500" placeholder="Campaign name" value={name} onChange={(e) => setName(e.target.value)} />
            <Input className="bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-500" placeholder="Email subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
            <Input className="bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-500" placeholder='"From" name' value={fromName} onChange={(e) => setFromName(e.target.value)} />
            <Input className="bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-500" placeholder='"From" email' value={fromEmail} onChange={(e) => setFromEmail(e.target.value)} />
            <div className="col-span-full flex justify-end">
              <Button disabled={!canNext1} onClick={() => setStep(2)}>Next</Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <Label className="text-slate-300">Select lists</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {state.lists.map(l => {
                  const checked = selectedLists.includes(l.id)
                  return (
                    <label key={l.id} className={`cursor-pointer rounded border px-3 py-2 text-sm ${checked ? 'border-emerald-800 bg-emerald-950 text-emerald-200' : 'border-slate-800 hover:bg-slate-800 text-slate-100'}`}>
                      <input type="checkbox" className="hidden" checked={checked} onChange={() => {
                        setSelectedLists(s => checked ? s.filter(id => id !== l.id) : [...s, l.id])
                      }} />
                      {l.name} <span className="text-xs text-slate-400">({l.contacts.length})</span>
                    </label>
                  )
                })}
                {state.lists.length === 0 && <div className="text-sm text-slate-400">No lists available.</div>}
              </div>
            </div>
            <div>
              <Label className="text-slate-300">Filter by tags (optional)</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {state.tags.map(t => {
                  const checked = selectedTags.includes(t.id)
                  return (
                    <label key={t.id} className={`cursor-pointer rounded border px-3 py-2 text-sm ${checked ? 'border-emerald-800 bg-emerald-950 text-emerald-200' : 'border-slate-800 hover:bg-slate-800 text-slate-100'}`}>
                      <input type="checkbox" className="hidden" checked={checked} onChange={() => {
                        setSelectedTags(s => checked ? s.filter(id => id !== t.id) : [...s, t.id])
                      }} />
                      {t.name}
                    </label>
                  )
                })}
                {state.tags.length === 0 && <div className="text-sm text-slate-400">No tags defined.</div>}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-300">Estimated recipients: <span className="font-semibold">{recipientsCount}</span></div>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setStep(1)}>Back</Button>
                <Button disabled={!canNext2} onClick={() => setStep(3)}>Next</Button>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input type="radio" name="mode" checked={mode === 'template'} onChange={() => setMode('template')} />
                <span>Use saved template</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="mode" checked={mode === 'scratch'} onChange={() => setMode('scratch')} />
                <span>Build from scratch</span>
              </label>
            </div>

            {mode === 'template' ? (
              <div className="space-y-2">
                <Label className="text-slate-300">Select a template</Label>
                <select
                  className="w-full rounded border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100"
                  value={templateId}
                  onChange={(e) => setTemplateId(e.target.value)}
                >
                  {state.templates.map(t => <option className="bg-slate-900" key={t.id} value={t.id}>{t.name}</option>)}
                  {state.templates.length === 0 && <option className="bg-slate-900">No templates found</option>}
                </select>
              </div>
            ) : (
              <TemplateEditor value={html} onChange={setHtml} />
            )}

            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setStep(2)}>Back</Button>
              <Button disabled={!canNext3} onClick={() => setStep(4)}>Next</Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <ReviewCard name={name} subject={subject} fromName={fromName} fromEmail={fromEmail} recipients={recipientsCount} />
            <div className="rounded border border-slate-800">
              <div className="border-b border-slate-800 p-3 text-sm text-slate-300">Preview</div>
              <div className="max-h-[320px] overflow-auto bg-slate-950 p-4 text-sm">
                <div
                  className="text-slate-100"
                  dangerouslySetInnerHTML={{
                    __html: mode === 'template'
                      ? (state.templates.find(t => t.id === templateId)?.html ?? '<em>Template not found</em>')
                      : html
                  }}
                />
              </div>
            </div>
            <div className="flex justify-between">
              <div className="text-xs text-slate-400">Note: Actual open/click tracking requires a server. This SPA won&apos;t track recipient behavior.</div>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setStep(3)}>Back</Button>
                <Button variant="outline" onClick={() => setOpenSchedule(true)}>
                  <CalendarClock className="mr-2 h-4 w-4" />
                  Schedule for later
                </Button>
                <Button onClick={sendNow} disabled={sending}>
                  {sending ? <><Send className="mr-2 h-4 w-4 animate-pulse" /> Sending...</> : <><Send className="mr-2 h-4 w-4" /> Send now</>}
                </Button>
              </div>
            </div>

            <Dialog open={openSchedule} onOpenChange={setOpenSchedule}>
              <DialogContent className="sm:max-w-md border-slate-800 bg-slate-900">
                <DialogHeader>
                  <DialogTitle>Schedule Campaign</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <Label className="text-slate-300">Send at</Label>
                  <Input
                    type="datetime-local"
                    value={scheduleAt}
                    onChange={(e) => setScheduleAt(e.target.value)}
                    className="bg-slate-950 border-slate-800 text-slate-100"
                  />
                  <div className="text-xs text-slate-400">
                    The in-app scheduler runs while this page is open.
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="secondary" onClick={() => setOpenSchedule(false)}>Cancel</Button>
                  <Button onClick={scheduleLater} disabled={!scheduleAt}>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Schedule
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function StepBadge({ n, label, active, done, onClick }: { n: number; label: string; active: boolean; done: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`flex items-center gap-2 rounded border px-3 py-2 text-sm ${active ? 'border-emerald-800 bg-emerald-950 text-emerald-200' : 'border-slate-800 text-slate-100'}`}>
      <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${done ? 'bg-emerald-600' : active ? 'bg-emerald-700' : 'bg-slate-700'}`}>
        {n}
      </span>
      <span>{label}</span>
    </button>
  )
}

function ReviewCard({ name, subject, fromName, fromEmail, recipients }: { name: string; subject: string; fromName: string; fromEmail: string; recipients: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Info label="Campaign" value={name} />
      <Info label="Subject" value={subject} />
      <Info label='From' value={`${fromName} <${fromEmail}>`} />
      <Info label="Recipients" value={`${recipients}`} />
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-slate-800 bg-slate-900 p-3">
      <div className="text-xs text-slate-400">{label}</div>
      <div className="mt-1 text-sm text-slate-100">{value}</div>
    </div>
  )
}
