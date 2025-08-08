export type ID = string

export type Settings = {
  resendApiKey?: string
  cachedDomains?: ResendDomain[]
}

export type ResendDomain = {
  id: string
  name: string
  status: 'pending' | 'verified' | 'failed' | string
}

export type Tag = {
  id: ID
  name: string
}

export type Contact = {
  id: ID
  email: string
  firstName?: string
  lastName?: string
  // New: arbitrary variables parsed from CSV (e.g., company, plan, city)
  vars?: Record<string, string>
  tags: ID[]
  createdAt: number
  updatedAt: number
}

export type ContactList = {
  id: ID
  name: string
  description?: string
  contacts: Contact[]
  createdAt: number
  updatedAt: number
}

export type Template = {
  id: ID
  name: string
  html: string
  createdAt: number
  updatedAt: number
}

export type CampaignStatus = 'Draft' | 'Scheduled' | 'Sending' | 'Sent' | 'Failed'

export type Campaign = {
  id: ID
  name: string
  subject: string
  fromName: string
  fromEmail: string
  audience: {
    listIds: ID[]
    tags: ID[]
  }
  templateId?: ID
  html?: string
  status: CampaignStatus
  scheduledAt?: number
  recipientsCount?: number
  metrics: {
    opens: number
    clicks: number
    bounces: number
    unsubscribes: number
  }
  links: { url: string; clicks: number }[]
  timeseries48h: { t: number; opens: number; clicks: number }[]
  createdAt: number
  updatedAt: number
}

export type AppState = {
  settings: Settings
  tags: Tag[]
  lists: ContactList[]
  templates: Template[]
  campaigns: Campaign[]
}

export type AppActions = {
  setResendKey: (key?: string) => void
  refreshDomains: () => Promise<void>
  addTag: (name: string) => void
  deleteTag: (id: ID) => void
  addList: (payload: { name: string; description?: string }) => void
  updateList: (id: ID, updater: (l: ContactList) => ContactList) => void
  deleteList: (id: ID) => void
  // vars is now supported on contact creation
  addContacts: (listId: ID, contacts: Omit<Contact, 'id'|'createdAt'|'updatedAt'>[]) => void
  updateContact: (listId: ID, contactId: ID, updater: (c: Contact) => Contact) => void
  deleteContact: (listId: ID, contactId: ID) => void
  addTemplate: (name: string, html: string) => void
  updateTemplate: (id: ID, name: string, html: string) => void
  deleteTemplate: (id: ID) => void
  addCampaign: (c: Omit<Campaign, 'id'|'createdAt'|'updatedAt'|'metrics'|'links'|'timeseries48h'|'status'> & Partial<Pick<Campaign, 'status'>>) => ID
  updateCampaign: (id: ID, updater: (c: Campaign) => Campaign) => void
  sendCampaignNow: (id: ID) => Promise<void>
  scheduleCampaign: (id: ID, when: number) => void
  // Ad-hoc send (Quick Compose)
  sendAdhocNow: (payload: {
    subject: string
    fromName: string
    fromEmail: string
    html: string
    to: { email: string; firstName?: string; lastName?: string; vars?: Record<string, string> }[]
  }) => Promise<void>
}

export type Store = {
  state: AppState
  actions: AppActions
}
