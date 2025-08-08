'use client'

import { useMemo, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import TemplateEditor from './template-editor'
import { Send, Mail, User, Globe, MessageSquare } from 'lucide-react'
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
  const [fromName, setFromName] = useState('Your Name')
  const [fromEmail, setFromEmail] = useState(() => 
    typeof window !== 'undefined' ? localStorage.getItem('defaultSenderEmail') || 'noreply@agents.community-enriched.com' : 'noreply@agents.community-enriched.com'
  )
  const [mode, setMode] = useState<'simple' | 'rich'>('simple')
  const [simpleMessage, setSimpleMessage] = useState('')
  const [html, setHtml] = useState('<h2>Hello!</h2>\n<p>Write your message here...</p>\n<p>Best regards,<br>Your Name</p>')
  const [sending, setSending] = useState(false)

  const recipients = useMemo(() => parseRecipients(to), [to])
  const canSend = recipients.length > 0 && subject.trim() && fromName.trim() && fromEmail.trim() && 
    (mode === 'simple' ? simpleMessage.trim() : html.trim()) && !sending

  const onSend = async () => {
    if (sending) return
    
    setSending(true)
    try {
      const emailHtml = mode === 'simple' 
        ? `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px;">
            <p>Hello,</p>
            <div style="white-space: pre-wrap; margin: 20px 0;">${simpleMessage.replace(/\n/g, '<br>')}</div>
            <p>Best regards,<br><strong>${fromName}</strong></p>
          </div>`
        : html

      await actions.sendAdhocNow({
        subject: subject.trim(),
        fromName: fromName.trim(),
        fromEmail: fromEmail.trim(),
        html: emailHtml,
        to: recipients.map(e => ({ email: e })),
      })
      
      // Reset message fields but keep sender info
      setTo('')
      setSubject('')
      setSimpleMessage('')
      setHtml('<h2>Hello!</h2>\n<p>Write your message here...</p>\n<p>Best regards,<br>Your Name</p>')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-3 text-3xl font-bold text-slate-100">
          <Mail className="h-8 w-8 text-blue-400" />
          Send Email
        </div>
        <p className="text-slate-400">Compose and send emails instantly</p>
      </div>

      <Card className="border-slate-700 bg-slate-900 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-750">
          <CardTitle className="flex items-center gap-2 text-slate-100">
            <MessageSquare className="h-5 w-5" />
            New Email
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          
          {/* Sender Information */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-slate-200 font-medium flex items-center gap-2">
                <User className="h-4 w-4" />
                Your Name
              </Label>
              <Input
                placeholder="Enter your name"
                value={fromName}
                onChange={(e) => setFromName(e.target.value)}
                className="bg-slate-950 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500/20"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-200 font-medium flex items-center gap-2">
                <Globe className="h-4 w-4" />
                From Email
              </Label>
              <Input
                type="email"
                placeholder="your-email@agents.community-enriched.com"
                value={fromEmail}
                onChange={(e) => setFromEmail(e.target.value)}
                className="bg-slate-950 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <Separator className="bg-slate-700" />

          {/* Email Details */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-200 font-medium flex items-center gap-2">
                <Mail className="h-4 w-4" />
                To (Recipients)
              </Label>
              <Textarea
                placeholder="Enter email addresses (one per line or separated by commas)&#10;example: john@example.com, jane@example.com"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="bg-slate-950 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500/20 min-h-[80px] resize-none"
              />
              {recipients.length > 0 && (
                <div className="text-sm text-green-400 font-medium">
                  ✓ {recipients.length} valid recipient{recipients.length !== 1 ? 's' : ''} found
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-slate-200 font-medium">Subject</Label>
              <Input
                placeholder="Email subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="bg-slate-950 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <Separator className="bg-slate-700" />

          {/* Message Composer */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-slate-200 font-medium">Message</Label>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={mode === 'simple' ? 'default' : 'ghost'}
                  onClick={() => setMode('simple')}
                  className={mode === 'simple' ? 'bg-blue-600 hover:bg-blue-700' : 'text-slate-400 hover:text-slate-200'}
                >
                  Simple
                </Button>
                <Button
                  size="sm"
                  variant={mode === 'rich' ? 'default' : 'ghost'}
                  onClick={() => setMode('rich')}
                  className={mode === 'rich' ? 'bg-blue-600 hover:bg-blue-700' : 'text-slate-400 hover:text-slate-200'}
                >
                  Rich HTML
                </Button>
              </div>
            </div>

            {mode === 'simple' ? (
              <div className="space-y-2">
                <Textarea
                  placeholder="Type your message here...&#10;&#10;This will be automatically formatted as a professional email."
                  value={simpleMessage}
                  onChange={(e) => setSimpleMessage(e.target.value)}
                  className="bg-slate-950 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500/20 min-h-[200px]"
                />
                <p className="text-xs text-slate-400">
                  Your message will be automatically formatted with a greeting and signature.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <TemplateEditor value={html} onChange={setHtml} />
                <p className="text-xs text-slate-400">
                  Use HTML for advanced formatting, links, and styling.
                </p>
              </div>
            )}
          </div>

          {/* Send Button */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-700">
            <div className="text-sm text-slate-400">
              {!state.settings.resendApiKey ? (
                <span className="text-amber-400">⚠ Please configure your API key in Settings</span>
              ) : sending ? (
                <span className="text-blue-400">🚀 Sending emails...</span>
              ) : recipients.length > 0 ? (
                <span>Ready to send to {recipients.length} recipient{recipients.length !== 1 ? 's' : ''}</span>
              ) : (
                <span>Enter recipient email addresses to continue</span>
              )}
            </div>
            
            <Button
              onClick={onSend}
              disabled={!canSend || !state.settings.resendApiKey || sending}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2 font-medium disabled:opacity-50"
            >
              {sending ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Email
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
