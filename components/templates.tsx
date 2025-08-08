'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Plus, Pencil, Trash2, Save } from 'lucide-react'
import TemplateEditor from './template-editor'

export default function Templates() {
  const { state, actions } = useAppStore()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [html, setHtml] = useState('<h1>Hello {{firstName}}</h1>\n<p>Welcome to {{company}}.</p>')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const startNew = () => {
    setEditingId(null)
    setName('')
    setHtml('<h1>Hello {{firstName}}</h1>\n<p>Welcome to {{company}}.</p>')
    setOpen(true)
  }

  const startEdit = (id: string) => {
    const t = state.templates.find(t => t.id === id)
    if (!t) return
    setEditingId(id)
    setName(t.name)
    setHtml(t.html)
    setOpen(true)
  }

  const save = () => {
    if (!name.trim()) return
    if (editingId) actions.updateTemplate(editingId, name.trim(), html)
    else actions.addTemplate(name.trim(), html)
    setOpen(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Template Library</h2>
        <Button onClick={startNew}>
          <Plus className="mr-2 h-4 w-4" />
          New Template
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {state.templates.map(t => (
          <Card key={t.id} className="border-slate-800 bg-slate-900">
            <CardHeader>
              <CardTitle className="truncate">{t.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="line-clamp-3 text-sm text-slate-200 template-html" dangerouslySetInnerHTML={{ __html: t.html }} />
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => startEdit(t.id)}><Pencil className="mr-1 h-3 w-3" /> Edit</Button>
                <Button size="sm" variant="destructive" onClick={() => setDeleteConfirm(t.id)}><Trash2 className="mr-1 h-3 w-3" /> Delete</Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {state.templates.length === 0 && (
          <Card className="border-slate-800 bg-slate-900">
            <CardContent className="p-6 text-sm text-slate-400">No templates yet. Create one to reuse in campaigns.</CardContent>
          </Card>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl border-slate-800 bg-slate-900 text-slate-100">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Template' : 'New Template'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Template name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-500"
            />
            <TemplateEditor value={html} onChange={setHtml} />
            <div className="text-xs text-slate-400">
              Personalization: {'{{firstName}}'}, {'{{lastName}}'}, {'{{email}}'}, and any CSV variable like {'{{company}}'}, {'{{plan}}'}, {'{{city}}'}.
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>
              <Save className="mr-2 h-4 w-4" />
              Save Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Template Confirmation */}
      {deleteConfirm && (
        <Dialog open onOpenChange={() => setDeleteConfirm(null)}>
          <DialogContent className="sm:max-w-md border-slate-800 bg-slate-900">
            <DialogHeader>
              <DialogTitle>Delete Template</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-slate-300">
                Are you sure you want to delete <strong>{state.templates.find(t => t.id === deleteConfirm)?.name}</strong>?
              </p>
              <p className="text-sm text-slate-400 mt-2">
                This action cannot be undone.
              </p>
            </div>
            <DialogFooter>
              <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
              <Button variant="destructive" onClick={() => {
                actions.deleteTemplate(deleteConfirm)
                setDeleteConfirm(null)
              }}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Template
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
