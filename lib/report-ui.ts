type Listener = (id: string | null) => void
const listeners = new Set<Listener>()

export function openCampaignReport(id: string | null) {
  listeners.forEach((l) => l(id))
}
export function onCampaignReportChange(cb: Listener) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}
