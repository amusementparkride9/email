'use client'

import { useEffect, useState } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { AppStoreProvider, useAppStore } from '@/lib/store'
import Dashboard from '@/components/dashboard'
import Audience from '@/components/audience'
import Templates from '@/components/templates'
import Campaigns from '@/components/campaigns'
import Settings from '@/components/settings'
import QuickComposer from '@/components/quick-composer'
import CampaignReport from '@/components/campaign-report'
import { openCampaignReport, onCampaignReportChange } from '@/lib/report-ui'
import { Mail, Send, Users, LayoutTemplate, LineChart, SettingsIcon } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

export default function Page() {
  return (
    <AppStoreProvider>
      <TooltipProvider delayDuration={200}>
        <Shell />
      </TooltipProvider>
    </AppStoreProvider>
  )
}

function Shell() {
  const [tab, setTab] = useHashTab('compose') // Changed default from 'dashboard' to 'compose'
  const { state, actions } = useAppStore()

  // Report modal state via lightweight pub/sub
  const [reportId, setReportId] = useState<string | null>(null)
  useEffect(() => {
    const unsub = onCampaignReportChange(setReportId)
    return unsub
  }, [])

  // Onboarding: prompt for API key on first run
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [onboardingKey, setOnboardingKey] = useState('')
  useEffect(() => {
    if (!state.settings.resendApiKey) {
      setShowOnboarding(true)
    }
  }, [state.settings.resendApiKey])

  return (
    <Tabs value={tab} onValueChange={setTab}>
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/80 backdrop-blur supports-[backdrop-filter]:bg-slate-950/60">
          <div className="mx-auto max-w-7xl px-4">
            <div className="flex h-16 items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded bg-slate-800">
                  <Mail className="h-5 w-5 text-emerald-400" />
                </div>
                <div className="text-lg font-semibold">MailForge</div>
                <span className="ml-3 rounded-full border border-slate-800 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-400">
                  Client-only SPA
                </span>
              </div>
              <div className="hidden items-center gap-1 md:flex">
                <TopNav tab={tab} onChange={setTab} />
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge />
              </div>
            </div>
          </div>
          <div className="md:hidden">
            <div className="mx-auto max-w-7xl px-4 pb-3">
              <TopNav tab={tab} onChange={setTab} />
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6">
          <TabsContent value="compose" className="mt-0">
            <QuickComposer />
          </TabsContent>
          <TabsContent value="dashboard" className="mt-0">
            <Dashboard />
          </TabsContent>
          <TabsContent value="audience" className="mt-0">
            <Audience />
          </TabsContent>
          <TabsContent value="templates" className="mt-0">
            <Templates />
          </TabsContent>
          <TabsContent value="campaigns" className="mt-0">
            <Campaigns />
          </TabsContent>
          <TabsContent value="settings" className="mt-0">
            <Settings />
          </TabsContent>
        </main>

        <footer className="border-t border-slate-800 py-6">
          <div className="mx-auto max-w-7xl px-4 text-xs text-slate-400">
            <p>
              Note: Analytics require a server-based tracker. This SPA keeps your data in localStorage and calls Resend directly.
            </p>
          </div>
        </footer>
      </div>

      {/* Detailed Campaign Report */}
      {reportId && <CampaignReport id={reportId} onClose={() => openCampaignReport(null)} />}

      {/* Onboarding: Enter Resend API Key */}
      <Dialog open={showOnboarding} onOpenChange={setShowOnboarding}>
        <DialogContent className="sm:max-w-md border-slate-800 bg-slate-900">
          <DialogHeader>
            <DialogTitle>Connect Resend</DialogTitle>
            <DialogDescription className="text-slate-300">
              Enter your Resend API key to start sending emails. The key is stored locally in this browser.
            </DialogDescription>
          </DialogHeader>
          <Input
            type="password"
            placeholder="re_XXXXXXXXXXXXXXXXXXXXXXXX"
            value={onboardingKey}
            onChange={(e) => setOnboardingKey(e.target.value)}
            className="bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-500"
          />
          <DialogFooter>
            <Button
              onClick={() => {
                actions.setResendKey(onboardingKey.trim() || undefined)
                setShowOnboarding(false)
              }}
              disabled={!onboardingKey.trim()}
            >
              Save key
            </Button>
            <Button variant="secondary" onClick={() => setShowOnboarding(false)}>
              Skip for now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Tabs>
  )
}

function TopNav({ tab, onChange }: { tab: string; onChange: (v: string) => void }) {
  const items = [
    { id: 'compose', label: 'Send Email', icon: Mail },
    { id: 'dashboard', label: 'Dashboard', icon: LineChart },
    { id: 'audience', label: 'Audience', icon: Users },
    { id: 'templates', label: 'Templates', icon: LayoutTemplate },
    { id: 'campaigns', label: 'Campaigns', icon: Send },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ]
  return (
    <TabsList className="grid w-full grid-cols-6 bg-slate-900 md:w-auto">
      {items.map((it) => (
        <TabsTrigger
          key={it.id}
          value={it.id}
          onClick={() => onChange(it.id)}
          className={cn(
            'data-[state=active]:bg-slate-800 data-[state=active]:text-white',
            tab === it.id ? 'bg-slate-800 text-white' : 'text-slate-300'
          )}
        >
          <it.icon className="mr-2 h-4 w-4" />
          {it.label}
        </TabsTrigger>
      ))}
    </TabsList>
  )
}

function StatusBadge() {
  const { state } = useAppStore()
  const hasKey = !!state.settings?.resendApiKey
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            'flex items-center gap-1 rounded-full border px-2 py-1 text-xs',
            hasKey ? 'border-emerald-900/50 bg-emerald-950 text-emerald-300' : 'border-amber-900/50 bg-amber-950 text-amber-200'
          )}
        >
          <div className={cn('h-2 w-2 rounded-full', hasKey ? 'bg-emerald-400' : 'bg-amber-400')} />
          {hasKey ? 'Resend Connected' : 'Add Resend API Key'}
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-xs">
        {hasKey ? (
          <p>Your Resend API key is stored in localStorage on this device.</p>
        ) : (
          <p>Add your Resend API key in Settings to send emails and list domains. Stored locally.</p>
        )}
      </TooltipContent>
    </Tooltip>
  )
}

/** Hash-driven tabs for deep links without server */
function useHashTab(defaultTab: string) {
  const [tab, setTab] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const h = window.location.hash.replace('#', '')
      return h || defaultTab
    }
    return defaultTab
  })
  useEffect(() => {
    const onHash = () => {
      const h = window.location.hash.replace('#', '')
      setTab(h || defaultTab)
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [defaultTab])

  const set = (v: string) => {
    if (typeof window !== 'undefined') {
      window.location.hash = v
    }
    setTab(v)
  }
  return [tab, set] as const
}
