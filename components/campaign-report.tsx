'use client'

import { useMemo } from 'react'
import { useAppStore } from '@/lib/store'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'

export default function CampaignReport({ id, onClose }: { id: string; onClose: () => void }) {
  const { state } = useAppStore()
  const campaign = state.campaigns.find(c => c.id === id)

  const series = useMemo(() => campaign?.timeseries48h ?? [], [campaign])
  const maxY = Math.max(1, ...series.map(p => Math.max(p.opens, p.clicks)))
  const w = 560, h = 180, pad = 24
  const xStep = series.length > 1 ? (w - pad * 2) / (series.length - 1) : 0
  const yScale = (v: number) => h - pad - (v / maxY) * (h - pad * 2)
  const linePath = (key: 'opens' | 'clicks') =>
    series.map((p, i) => `${i === 0 ? 'M' : 'L'} ${pad + i * xStep} ${yScale(p[key])}`).join(' ')

  if (!campaign) return null

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-4xl border-slate-800 bg-slate-900">
        <DialogHeader>
          <DialogTitle>Campaign Report — {campaign.name}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-4">
          <Info label="Status" value={campaign.status} />
          <Info label="Recipients" value={`${campaign.recipientsCount ?? 0}`} />
          <Info label="Open Rate" value={pct(campaign.metrics.opens, campaign.recipientsCount)} />
          <Info label="Click Rate" value={pct(campaign.metrics.clicks, campaign.recipientsCount)} />
        </div>

        <div className="rounded border border-slate-800">
          <div className="border-b border-slate-800 p-2 text-sm text-slate-300">Opens and Clicks (first 48h)</div>
          <div className="overflow-x-auto p-3">
            <svg width={w} height={h} className="bg-slate-950 rounded">
              <g>
                <line x1={pad} x2={pad} y1={pad} y2={h - pad} stroke="#334155" />
                <line x1={pad} x2={w - pad} y1={h - pad} y2={h - pad} stroke="#334155" />
              </g>
              <path d={linePath('opens')} stroke="#34d399" fill="none" strokeWidth="2" />
              <path d={linePath('clicks')} stroke="#60a5fa" fill="none" strokeWidth="2" />
              {/* Legend */}
              <g transform={`translate(${w - pad - 160}, ${pad})`}>
                <rect x={0} y={-10} width={160} height={24} fill="#0b1220" opacity="0.6" rx={4} />
                <circle cx={16} cy={2} r={4} fill="#34d399" />
                <text x={28} y={6} fontSize="12" fill="#e2e8f0">Opens</text>
                <circle cx={88} cy={2} r={4} fill="#60a5fa" />
                <text x={100} y={6} fontSize="12" fill="#e2e8f0">Clicks</text>
              </g>
            </svg>
            <div className="mt-2 text-xs text-slate-400">Tracking is disabled in client-only mode. Metrics will remain 0 until a server tracker is added.</div>
          </div>
        </div>

        <div className="rounded border border-slate-800">
          <div className="border-b border-slate-800 p-2 text-sm text-slate-300">Links</div>
          <div className="overflow-x-auto p-2">
            <table className="w-full text-sm">
              <thead className="text-left text-slate-300">
                <tr className="border-b border-slate-800">
                  <th className="py-2 pr-4">URL</th>
                  <th className="py-2 pr-4">Clicks</th>
                </tr>
              </thead>
              <tbody>
                {campaign.links.map(l => (
                  <tr key={l.url} className="border-b border-slate-900">
                    <td className="py-2 pr-4">
                      <a href={l.url} target="_blank" rel="noreferrer" className="text-emerald-300 underline underline-offset-2 hover:text-emerald-200">
                        {l.url}
                      </a>
                    </td>
                    <td className="py-2 pr-4">{l.clicks}</td>
                  </tr>
                ))}
                {campaign.links.length === 0 && (
                  <tr>
                    <td colSpan={2} className="py-4 text-center text-slate-400">No links detected in the email.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
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

function pct(n?: number, denom?: number) {
  if (!denom || denom === 0 || !n) return '0%'
  return `${Math.round((n / denom) * 100)}%`
}
