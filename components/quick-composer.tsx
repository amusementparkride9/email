'use client'

import { useMemo, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import TemplateEditor from './template-editor'
import { Send } from 'lucide-react'
import type { ID } from '@/lib/types'

function parseRecipients(input: string) {
  // Accept comma/space/newline separated emails
  const parts = input.split(/[\s,;\n]+/).map(s => s.trim()).filter(Boolean)
  // Basic email check
  const emails = Array.from(new Set(parts)).filter(e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))
  return emails
}

export default function QuickComposer() {
  const { state, actions } = useAppStore()
  const [to, setTo] = useState('')
  const [subject, setSubject] = useState('')
  const [fromName, setFromName] = useState('')
  const [fromEmail, setFromEmail] = useState('')
  const [html, setHtml] = useState('<h2>Hello</h2><p>Compose your message...</p>')

  const recipients = useMemo(() => parseRecipients(to), [to])
  const canSend = recipients.length > 0 && subject.trim() && fromName.trim() && fromEmail.trim()

  const onSend = async () => {
    await actions.sendAdhocNow({
      subject: subject.trim(),
      fromName: fromName.trim(),
      fromEmail: fromEmail.trim(),
      html,
      to: recipients.map(e => ({ email: e })),
    })
    // Reset fields but keep from details
    setTo('')
    setSubject('')
  }

  return (
    <Card className="border-slate-800 bg-slate-900">
      <CardHeader>
        <CardTitle className="text-slate-100">Quick Compose</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="md:col-span-2 space-y-1">
            <Label className="text-slate-300">To (comma or newline separated emails)</Label>
            <Input
              placeholder="alice@example.com, bob@example.com"
              value={to}
              onChange={e => setTo(e.target.value)}
              className="bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-500"
            />
            <div className="text-xs text-slate-400">{recipients.length} valid recipient(s)</div>
          </div>
          <Input
            placeholder='From name'
            value={fromName}
            onChange={e => setFromName(e.target.value)}
            className="bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-500"
          />
          <Input
            placeholder='From email'
            value={fromEmail}
            onChange={e => setFromEmail(e.target.value)}
            className="bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-500"
          />
          <div className="md:col-span-2">
            <Input
              placeholder='Subject'
              value={subject}
              onChange={e => setSubject(e.target.value)}
              className="bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-500"
            />
          </div>
          <div className="md:col-span-2">
            <TemplateEditor value={html} onChange={setHtml} />
          </div>
          <div className="md:col-span-2 flex justify-end">
            <Button onClick={onSend} disabled={!canSend}>
              <Send className="mr-2 h-4 w-4 text-slate-200" />
              Send
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
