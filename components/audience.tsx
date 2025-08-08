'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Plus, Upload, Trash2, Pencil, TagIcon, X, Save } from 'lucide-react'
import Papa from 'papaparse'
import type { Contact, ContactList } from '@/lib/types'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

export default function Audience() {
  const { state, actions } = useAppStore()
  const [newList, setNewList] = useState({ name: '', description: '' })
  const [selectedListId, setSelectedListId] = useState<string | null>(state.lists[0]?.id ?? null)

  const currentList = useMemo(
    () => state.lists.find(l => l.id === selectedListId) ?? null,
    [state.lists, selectedListId]
  )

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-1 space-y-4">
        <Card className="border-slate-800 bg-slate-900">
          <CardHeader>
            <CardTitle>Lists</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              {state.lists.map(l => (
                <button
                  key={l.id}
                  onClick={() => setSelectedListId(l.id)}
                  className={cn(
                    'w-full rounded border px-3 py-2 text-left text-sm',
                    selectedListId === l.id ? 'border-emerald-800 bg-emerald-950 text-emerald-200' : 'border-slate-800 hover:bg-slate-800 text-slate-100'
                  )}
                >
                  <div className="font-medium">{l.name}</div>
                  <div className="text-xs text-slate-400">{l.contacts.length} contacts</div>
                </button>
              ))}
              {state.lists.length === 0 && (
                <div className="text-sm text-slate-400">No lists yet. Create one below.</div>
              )}
            </div>
            <Separator className="bg-slate-800" />
            <div className="space-y-2">
              <Label className="text-slate-300">New List</Label>
              <Input
                placeholder="List name"
                value={newList.name}
                onChange={(e) => setNewList(s => ({ ...s, name: e.target.value }))}
                className="bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-500"
              />
              <Input
                placeholder="Description (optional)"
                value={newList.description}
                onChange={(e) => setNewList(s => ({ ...s, description: e.target.value }))}
                className="bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-500"
              />
              <Button
                onClick={() => {
                  if (!newList.name.trim()) return
                  actions.addList({ name: newList.name.trim(), description: newList.description.trim() || undefined })
                  setNewList({ name: '', description: '' })
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add List
              </Button>
            </div>
          </CardContent>
        </Card>

        <TagsPanel />
      </div>

      <div className="lg:col-span-2 space-y-4">
        <ContactsPanel currentList={currentList} />
      </div>
    </div>
  )
}

function TagsPanel() {
  const { state, actions } = useAppStore()
  const [tagName, setTagName] = useState('')

  return (
    <Card className="border-slate-800 bg-slate-900">
      <CardHeader>
        <CardTitle>Tags</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {state.tags.map(t => (
            <Badge key={t.id} variant="outline" className="flex items-center gap-2 border-slate-700 text-slate-200">
              <TagIcon className="h-3 w-3" />
              {t.name}
              <button onClick={() => actions.deleteTag(t.id)} className="ml-1 rounded p-0.5 hover:bg-slate-800">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {state.tags.length === 0 && <div className="text-sm text-slate-400">No tags yet.</div>}
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="New tag name"
            value={tagName}
            onChange={(e) => setTagName(e.target.value)}
            className="bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-500"
          />
          <Button
            variant="secondary"
            onClick={() => {
              if (!tagName.trim()) return
              actions.addTag(tagName.trim())
              setTagName('')
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function ContactsPanel({ currentList }: { currentList: ContactList | null }) {
  const { state, actions } = useAppStore()
  const [showImport, setShowImport] = useState(false)
  const [editing, setEditing] = useState<Contact | null>(null)
  const [newContact, setNewContact] = useState<{ email: string; firstName?: string; lastName?: string; tags: string[]; vars?: Record<string, string> }>({ email: '', firstName: '', lastName: '', tags: [], vars: {} })

  if (!currentList) {
    return (
      <Card className="border-slate-800 bg-slate-900">
        <CardHeader>
          <CardTitle>Contacts</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-400">Select or create a list to manage contacts.</CardContent>
      </Card>
    )
  }

  const toggleTag = (tid: string) => {
    setNewContact(s => {
      const exists = s.tags.includes(tid)
      return { ...s, tags: exists ? s.tags.filter(t => t !== tid) : [...s, tid] }
    })
  }

  return (
    <>
      <Card className="border-slate-800 bg-slate-900">
        <CardHeader>
          <CardTitle>
            {currentList.name}
            <span className="ml-2 text-sm font-normal text-slate-400">({currentList.contacts.length} contacts)</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => setShowImport(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Import CSV
            </Button>
          </div>

          <Separator className="bg-slate-800" />

          <div className="grid gap-3 md:grid-cols-2">
            <Input
              placeholder="Email"
              value={newContact.email}
              onChange={(e) => setNewContact(s => ({ ...s, email: e.target.value }))}
              className="bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-500"
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="First name"
                value={newContact.firstName}
                onChange={(e) => setNewContact(s => ({ ...s, firstName: e.target.value }))}
                className="bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-500"
              />
              <Input
                placeholder="Last name"
                value={newContact.lastName}
                onChange={(e) => setNewContact(s => ({ ...s, lastName: e.target.value }))}
                className="bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-500"
              />
            </div>
            <div className="col-span-full">
              <div className="mb-1 text-xs text-slate-400">Tags</div>
              <div className="flex flex-wrap gap-2">
                {state.tags.map(t => {
                  const checked = newContact.tags.includes(t.id)
                  return (
                    <label key={t.id} className={cn('flex cursor-pointer items-center gap-2 rounded border px-2 py-1 text-xs',
                      checked ? 'border-emerald-800 bg-emerald-950 text-emerald-200' : 'border-slate-800 hover:bg-slate-800 text-slate-100'
                    )}>
                      <input type="checkbox" className="hidden" checked={checked} onChange={() => toggleTag(t.id)} />
                      <span>{t.name}</span>
                    </label>
                  )
                })}
                {state.tags.length === 0 && <div className="text-xs text-slate-400">No tags yet.</div>}
              </div>
            </div>
            <div className="col-span-full">
              <Button
                onClick={() => {
                  if (!newContact.email.trim()) return
                  actions.addContacts(currentList.id, [{
                    email: newContact.email.trim(),
                    firstName: newContact.firstName?.trim() || undefined,
                    lastName: newContact.lastName?.trim() || undefined,
                    tags: newContact.tags,
                    vars: newContact.vars && Object.keys(newContact.vars).length ? newContact.vars : undefined,
                  }])
                  setNewContact({ email: '', firstName: '', lastName: '', tags: [], vars: {} })
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Contact
              </Button>
            </div>
          </div>

          <Separator className="bg-slate-800" />

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-slate-300">
                <tr className="border-b border-slate-800">
                  <th className="py-2 pr-4">Email</th>
                  <th className="py-2 pr-4">First</th>
                  <th className="py-2 pr-4">Last</th>
                  <th className="py-2 pr-4">Tags</th>
                  <th className="py-2 pr-4">Vars</th>
                  <th className="py-2 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentList.contacts.map(ct => (
                  <tr key={ct.id} className="border-b border-slate-900">
                    <td className="py-3 pr-4">{ct.email}</td>
                    <td className="py-3 pr-4">{ct.firstName ?? '-'}</td>
                    <td className="py-3 pr-4">{ct.lastName ?? '-'}</td>
                    <td className="py-3 pr-4">
                      <div className="flex flex-wrap gap-1">
                        {ct.tags.map(tid => {
                          const tag = state.tags.find(t => t.id === tid)
                          return <Badge key={tid} variant="outline" className="border-slate-700 text-slate-200">{tag?.name ?? 'Tag'}</Badge>
                        })}
                        {ct.tags.length === 0 && <span className="text-slate-400">-</span>}
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      {ct.vars && Object.keys(ct.vars).length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(ct.vars).slice(0, 3).map(([k, v]) => (
                            <Badge key={k} variant="outline" className="border-slate-700 text-slate-200">{k}: {v || '-'}</Badge>
                          ))}
                          {Object.keys(ct.vars).length > 3 && (
                            <span className="text-xs text-slate-400">+{Object.keys(ct.vars).length - 3} more</span>
                          )}
                        </div>
                      ) : <span className="text-slate-400">-</span>}
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex gap-2">
                        <Button size="sm" variant="secondary" onClick={() => setEditing(ct)}>
                          <Pencil className="mr-1 h-3 w-3" /> Edit
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => actions.deleteContact(currentList.id, ct.id)}>
                          <Trash2 className="mr-1 h-3 w-3" /> Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {currentList.contacts.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400">No contacts in this list.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <ImportDialog open={showImport} onOpenChange={setShowImport} listId={currentList.id} />
      {editing && (
        <EditContactDialog contact={editing} listId={currentList.id} onClose={() => setEditing(null)} />
      )}
    </>
  )
}

function ImportDialog({ open, onOpenChange, listId }: { open: boolean; onOpenChange: (v: boolean) => void; listId: string }) {
  const { actions } = useAppStore()
  const fileRef = useRef<HTMLInputElement | null>(null)
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<Record<string, string>[]>([])
  const [mapping, setMapping] = useState<{ email?: string; firstName?: string; lastName?: string; tags?: string }>({})
  const [varMappings, setVarMappings] = useState<{ header: string; include: boolean; key: string }[]>([])
  const [error, setError] = useState<string | null>(null)

  const reset = () => {
    setHeaders([])
    setRows([])
    setMapping({})
    setVarMappings([])
    setError(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  const toVarKey = (s: string) =>
    s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')

  const onFile = (file: File) => {
    setError(null)
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const data = res.data as any[]
        if (data.length === 0) {
          setError('No rows found.')
          return
        }
        const hdrs = Object.keys(data[0])
        setHeaders(hdrs)
        setRows(data as Record<string, string>[])
        // initialize var mappings for all headers; we'll filter when rendering
        setVarMappings(hdrs.map(h => ({ header: h, include: true, key: toVarKey(h) })))
      },
      error: (e) => setError(e.message),
    })
  }

  // Keep var mappings in sync when user maps a header to a standard field
  const excluded = new Set([mapping.email, mapping.firstName, mapping.lastName, mapping.tags].filter(Boolean) as string[])

  const importNow = () => {
    if (!mapping.email) {
      setError('Please map the "email" column.')
      return
    }
    // Build contacts with variables
    const contacts = rows.map(r => {
      const base = {
        email: r[mapping.email!]?.trim() ?? '',
        firstName: mapping.firstName ? (r[mapping.firstName]?.trim() ?? undefined) : undefined,
        lastName: mapping.lastName ? (r[mapping.lastName]?.trim() ?? undefined) : undefined,
        tags: mapping.tags ? (r[mapping.tags]?.split(',').map(s => s.trim()).filter(Boolean) ?? []) : [],
      }
      // collect variables for included columns (excluding mapped standard fields)
      const vars: Record<string, string> = {}
      for (const vm of varMappings) {
        if (!vm.include) continue
        if (excluded.has(vm.header)) continue
        const v = r[vm.header]
        if (v != null && String(v).trim() !== '') {
          vars[vm.key] = String(v).trim()
        }
      }
      return { ...base, vars: Object.keys(vars).length ? vars : undefined }
    }).filter(c => !!c.email)

    actions.addContacts(listId, contacts)
    onOpenChange(false)
    reset()
  }

  // Ensure unique variable keys (avoid collisions)
  useEffect(() => {
    const seen = new Set<string>()
    setVarMappings(prev =>
      prev.map(vm => {
        let key = vm.key
        if (!key) key = toVarKey(vm.header)
        let candidate = key
        let i = 2
        while (seen.has(candidate)) {
          candidate = `${key}_${i++}`
        }
        seen.add(candidate)
        return { ...vm, key: candidate }
      })
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [headers])

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) reset() }}>
      <DialogContent className="sm:max-w-3xl border-slate-800 bg-slate-900 text-slate-100">
        <DialogHeader>
          <DialogTitle>Import Contacts from CSV</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) onFile(f)
            }}
            className="w-full text-sm file:mr-4 file:rounded file:border-0 file:bg-slate-800 file:px-3 file:py-2 file:text-slate-200"
          />
          {headers.length > 0 && (
            <div className="space-y-5">
              <div className="grid gap-3 md:grid-cols-2">
                <ColumnMap label="Email" headers={headers} value={mapping.email} onChange={(v) => setMapping(m => ({ ...m, email: v }))} required />
                <ColumnMap label="First name" headers={headers} value={mapping.firstName} onChange={(v) => setMapping(m => ({ ...m, firstName: v }))} />
                <ColumnMap label="Last name" headers={headers} value={mapping.lastName} onChange={(v) => setMapping(m => ({ ...m, lastName: v }))} />
                <ColumnMap label="Tags (comma-separated)" headers={headers} value={mapping.tags} onChange={(v) => setMapping(m => ({ ...m, tags: v }))} />
              </div>

              <div className="rounded border border-slate-800">
                <div className="border-b border-slate-800 p-2 text-sm text-slate-300">
                  Variables mapping (optional)
                  <div className="mt-1 text-xs text-slate-400">Any included column will be imported as a per-contact variable and usable in templates with {'{{yourVariable}}'}.</div>
                </div>
                <div className="max-h-[260px] overflow-auto p-2">
                  <table className="w-full text-sm">
                    <thead className="text-left text-slate-300">
                      <tr className="border-b border-slate-800">
                        <th className="py-2 pr-2">Include</th>
                        <th className="py-2 pr-2">CSV Header</th>
                        <th className="py-2 pr-2">Variable Key</th>
                        <th className="py-2 pr-2">Example</th>
                      </tr>
                    </thead>
                    <tbody>
                      {varMappings
                        .filter(vm => !excluded.has(vm.header))
                        .map((vm, idx) => (
                        <tr key={vm.header} className="border-b border-slate-900">
                          <td className="py-2 pr-2">
                            <input
                              type="checkbox"
                              checked={vm.include}
                              onChange={(e) => {
                                const include = e.target.checked
                                setVarMappings(vs => vs.map((v, i) => i === idx ? { ...v, include } : v))
                              }}
                            />
                          </td>
                          <td className="py-2 pr-2">{vm.header}</td>
                          <td className="py-2 pr-2">
                            <Input
                              value={vm.key}
                              onChange={(e) => {
                                const key = e.target.value.trim()
                                setVarMappings(vs => vs.map((v, i) => i === idx ? { ...v, key } : v))
                              }}
                              className="h-8 w-40 bg-slate-950 text-slate-100"
                            />
                          </td>
                          <td className="py-2 pr-2 text-slate-400">{rows[0]?.[vm.header] ?? '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded border border-slate-800 bg-slate-950 p-3 text-xs text-slate-400">
                Preview: {Math.min(5, rows.length)} of {rows.length} rows
              </div>
            </div>
          )}
          {error && <div className="rounded border border-rose-800 bg-rose-950 p-2 text-sm text-rose-200">{error}</div>}
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={importNow} disabled={headers.length === 0}>
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ColumnMap({ label, headers, value, onChange, required }: { label: string; headers: string[]; value?: string; onChange: (v?: string) => void; required?: boolean }) {
  return (
    <div className="space-y-1">
      <Label className="text-slate-300">{label} {required && <span className="text-rose-400">*</span>}</Label>
      <select
        className="w-full rounded border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || undefined)}
      >
        <option className="bg-slate-900" value="">- Not Mapped -</option>
        {headers.map(h => <option className="bg-slate-900" key={h} value={h}>{h}</option>)}
      </select>
    </div>
  )
}

function EditContactDialog({ contact, listId, onClose }: { contact: Contact; listId: string; onClose: () => void }) {
  const { state, actions } = useAppStore()
  const [draft, setDraft] = useState({
    email: contact.email,
    firstName: contact.firstName ?? '',
    lastName: contact.lastName ?? '',
    tags: [...contact.tags],
    vars: { ...(contact.vars ?? {}) } as Record<string, string>,
  })

  const toggle = (tid: string) => {
    setDraft(s => {
      const present = s.tags.includes(tid)
      return { ...s, tags: present ? s.tags.filter(t => t !== tid) : [...s, tid] }
    })
  }

  const addVar = () => {
    const key = 'key'
    let i = 1
    let k = key
    while (draft.vars[k] !== undefined) {
      k = `${key}_${i++}`
    }
    setDraft(s => ({ ...s, vars: { ...s.vars, [k]: '' } }))
  }

  const removeVar = (k: string) => {
    setDraft(s => {
      const nv = { ...s.vars }
      delete nv[k]
      return { ...s, vars: nv }
    })
  }

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="sm:max-w-2xl border-slate-800 bg-slate-900 text-slate-100">
        <DialogHeader>
          <DialogTitle>Edit Contact</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input className="bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-500 col-span-2" value={draft.email} onChange={(e) => setDraft(s => ({ ...s, email: e.target.value }))} placeholder="Email" />
            <Input className="bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-500" value={draft.firstName} onChange={(e) => setDraft(s => ({ ...s, firstName: e.target.value }))} placeholder="First name" />
            <Input className="bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-500" value={draft.lastName} onChange={(e) => setDraft(s => ({ ...s, lastName: e.target.value }))} placeholder="Last name" />
          </div>

          <div>
            <div className="mb-1 text-xs text-slate-400">Tags</div>
            <div className="flex flex-wrap gap-2">
              {state.tags.map(t => {
                const checked = draft.tags.includes(t.id)
                return (
                  <label key={t.id} className={cn('flex cursor-pointer items-center gap-2 rounded border px-2 py-1 text-xs',
                    checked ? 'border-emerald-800 bg-emerald-950 text-emerald-200' : 'border-slate-800 hover:bg-slate-800 text-slate-100'
                  )}>
                    <input type="checkbox" className="hidden" checked={checked} onChange={() => toggle(t.id)} />
                    <span>{t.name}</span>
                  </label>
                )
              })}
              {state.tags.length === 0 && <div className="text-xs text-slate-400">No tags yet.</div>}
            </div>
          </div>

          <div className="rounded border border-slate-800">
            <div className="border-b border-slate-800 p-2 text-sm text-slate-300">Variables</div>
            <div className="p-3 space-y-2">
              {Object.keys(draft.vars).length === 0 && (
                <div className="text-sm text-slate-400">No variables. Add key/value pairs to personalize templates (e.g., company, plan, city).</div>
              )}
              {Object.entries(draft.vars).map(([k, v]) => (
                <div key={k} className="grid grid-cols-[1fr_1fr_auto] items-center gap-2">
                  <Input
                    value={k}
                    onChange={(e) => {
                      const newKey = e.target.value.trim()
                      setDraft(s => {
                        const nv = { ...s.vars }
                        delete nv[k]
                        nv[newKey] = v
                        return { ...s, vars: nv }
                      })
                    }}
                    className="bg-slate-950 border-slate-800 text-slate-100"
                    placeholder="key (e.g., company)"
                  />
                  <Input
                    value={v}
                    onChange={(e) => setDraft(s => ({ ...s, vars: { ...s.vars, [k]: e.target.value } }))}
                    className="bg-slate-950 border-slate-800 text-slate-100"
                    placeholder="value"
                  />
                  <Button variant="destructive" size="sm" onClick={() => removeVar(k)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              <div>
                <Button variant="secondary" size="sm" onClick={addVar}>
                  <Plus className="mr-2 h-3 w-3" />
                  Add variable
                </Button>
              </div>
              <div className="text-xs text-slate-400">Use variables in templates like {'{{company}}'} or {'{{plan}}'}.</div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={() => {
            actions.updateContact(listId, contact.id, (c) => ({
              ...c,
              email: draft.email.trim(),
              firstName: draft.firstName.trim() || undefined,
              lastName: draft.lastName.trim() || undefined,
              tags: draft.tags,
              vars: Object.fromEntries(Object.entries(draft.vars).filter(([k]) => k.trim() !== '')),
            }))
            onClose()
          }}>
            <Save className="mr-2 h-4 w-4" />
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
