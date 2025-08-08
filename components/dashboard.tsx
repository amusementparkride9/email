'use client'

import { useMemo } from 'react'
import { useAppStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Clock, Send, CalendarClock, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { openCampaignReport } from '@/lib/report-ui'

export default function Dashboard() {
  const { state } = useAppStore()
  const counts = useMemo(() => {
    const total = state.campaigns.length
    const draft = state.campaigns.filter(c => c.status === 'Draft').length
    const scheduled = state.campaigns.filter(c => c.status === 'Scheduled').length
    const sent = state.campaigns.filter(c => c.status === 'Sent').length
    const sending = state.campaigns.filter(c => c.status === 'Sending').length
    return { total, draft, scheduled, sent, sending }
  }, [state.campaigns])

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Stat title="Total Campaigns" value={counts.total} icon={<Send className="h-4 w-4" />} />
        <Stat title="Drafts" value={counts.draft} icon={<Clock className="h-4 w-4" />} />
        <Stat title="Scheduled" value={counts.scheduled} icon={<CalendarClock className="h-4 w-4" />} />
        <Stat title="Sent" value={counts.sent} icon={<CheckCircle2 className="h-4 w-4" />} />
      </div>

      <Card className="border-slate-800 bg-slate-900">
        <CardHeader>
          <CardTitle>Campaigns</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-slate-300">
                <tr className="border-b border-slate-800">
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Recipients</th>
                  <th className="py-2 pr-4">Open Rate</th>
                  <th className="py-2 pr-4">Click Rate</th>
                  <th className="py-2 pr-4">Scheduled</th>
                </tr>
              </thead>
              <tbody>
                {state.campaigns.map((c) => (
                  <tr key={c.id} className="border-b border-slate-900">
                    <td className="py-3 pr-4">
                      <button className="text-emerald-300 underline underline-offset-2 hover:text-emerald-200" onClick={() => openCampaignReport(c.id)}>
                        {c.name}
                      </button>
                    </td>
                    <td className="py-3 pr-4">
                      <Badge variant="outline" className={badgeTone(c.status)}>{c.status}</Badge>
                    </td>
                    <td className="py-3 pr-4">{c.recipientsCount ?? '-'}</td>
                    <td className="py-3 pr-4">{formatPct(c.metrics.opens, c.recipientsCount)}</td>
                    <td className="py-3 pr-4">{formatPct(c.metrics.clicks, c.recipientsCount)}</td>
                    <td className="py-3 pr-4">{c.scheduledAt ? new Date(c.scheduledAt).toLocaleString() : '-'}</td>
                  </tr>
                ))}
                {state.campaigns.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400">
                      No campaigns yet. Create one in the Campaigns tab.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <Separator className="my-4 bg-slate-800" />
          <div className="text-xs text-slate-400">
            Analytics are placeholders in client-only mode. Add a server tracker later to enable opens/clicks.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function Stat({ title, value, icon }: { title: string; value: number | string; icon?: React.ReactNode }) {
  return (
    <Card className="border-slate-800 bg-slate-900">
      <CardContent className="flex items-center justify-between p-4">
        <div>
          <div className="text-sm text-slate-400">{title}</div>
          <div className="mt-1 text-2xl font-semibold">{value}</div>
        </div>
        <div className="text-slate-300">{icon}</div>
      </CardContent>
    </Card>
  )
}

function badgeTone(status: string) {
  switch (status) {
    case 'Draft': return 'border-slate-700 text-slate-200'
    case 'Scheduled': return 'border-sky-700 text-sky-300'
    case 'Sending': return 'border-amber-700 text-amber-300'
    case 'Sent': return 'border-emerald-700 text-emerald-300'
    case 'Failed': return 'border-rose-700 text-rose-300'
    default: return 'border-slate-700 text-slate-200'
  }
}

function formatPct(n?: number, denom?: number) {
  if (!denom || denom === 0 || !n) return '0%'
  return `${Math.round((n / denom) * 100)}%`
}
