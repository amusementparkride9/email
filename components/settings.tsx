'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, RefreshCcw } from 'lucide-react'

export default function Settings() {
  const { state, actions } = useAppStore()
  const [key, setKey] = useState(state.settings.resendApiKey ?? '')

  useEffect(() => {
    setKey(state.settings.resendApiKey ?? '')
  }, [state.settings.resendApiKey])

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="border-slate-800 bg-slate-900">
        <CardHeader>
          <CardTitle>Resend API Key</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Alert variant="default" className="border-amber-800 bg-amber-950 text-amber-200">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Security note</AlertTitle>
            <AlertDescription className="text-amber-200">
              Your API key is stored in this browser&apos;s localStorage and used directly from the client. This is not recommended for production.
            </AlertDescription>
          </Alert>
          <Input
            type="password"
            placeholder="re_XXXXXXXXXXXXXXXXXXXXXXXX"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            className="bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-500"
          />
          <div className="flex gap-2">
            <Button onClick={() => actions.setResendKey(key || undefined)}>Save</Button>
            <Button variant="secondary" onClick={() => { setKey(''); actions.setResendKey(undefined) }}>Delete</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-800 bg-slate-900">
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Verified Domains</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => actions.refreshDomains()} disabled={!state.settings.resendApiKey}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            {!state.settings.resendApiKey && <div className="text-xs text-slate-400">Add API key to list domains.</div>}
          </div>
          <div className="rounded border border-slate-800">
            <div className="grid grid-cols-3 border-b border-slate-800 p-2 text-xs text-slate-300">
              <div>Name</div>
              <div>Status</div>
              <div>ID</div>
            </div>
            {(state.settings.cachedDomains ?? []).map(d => (
              <div key={d.id} className="grid grid-cols-3 border-b border-slate-900 p-2 text-sm">
                <div className="text-slate-100">{d.name}</div>
                <div className="capitalize text-slate-200">{d.status}</div>
                <div className="truncate text-slate-400">{d.id}</div>
              </div>
            ))}
            {(state.settings.cachedDomains ?? []).length === 0 && (
              <div className="p-3 text-sm text-slate-400">No domain data. Click Refresh to fetch from Resend.</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
