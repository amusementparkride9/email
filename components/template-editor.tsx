'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Bold, Italic, Underline, LinkIcon, ImageIcon, Code, List, ListOrdered } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'

export default function TemplateEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [mode, setMode] = useState<'design' | 'html'>('design')
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (mode === 'design' && ref.current) {
      ref.current.innerHTML = value
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  const exec = (cmd: string, val?: string) => {
    document.execCommand(cmd, false, val)
    if (ref.current) onChange(ref.current.innerHTML)
  }

  const insertLink = () => {
    const url = window.prompt('Enter URL')
    if (!url) return
    exec('createLink', url)
  }

  const insertImage = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = () => {
      const file = input.files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => {
        const dataUrl = reader.result as string
        exec('insertImage', dataUrl)
      }
      reader.readAsDataURL(file)
    }
    input.click()
  }

  const insertText = (txt: string) => {
    if (!ref.current) return
    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0) return
    const range = sel.getRangeAt(0)
    range.deleteContents()
    range.insertNode(document.createTextNode(txt))
    sel.collapseToEnd()
    onChange(ref.current.innerHTML)
  }

  return (
    <div className="rounded border border-slate-800">
      <div className="flex flex-wrap items-center gap-1 p-2">
        <Button size="sm" variant="ghost" onClick={() => exec('bold')}><Bold className="h-4 w-4 text-slate-200" /></Button>
        <Button size="sm" variant="ghost" onClick={() => exec('italic')}><Italic className="h-4 w-4 text-slate-200" /></Button>
        <Button size="sm" variant="ghost" onClick={() => exec('underline')}><Underline className="h-4 w-4 text-slate-200" /></Button>
        <Separator orientation="vertical" className="mx-1 h-6 bg-slate-800" />
        <Button size="sm" variant="ghost" onClick={() => exec('insertUnorderedList')}><List className="h-4 w-4 text-slate-200" /></Button>
        <Button size="sm" variant="ghost" onClick={() => exec('insertOrderedList')}><ListOrdered className="h-4 w-4 text-slate-200" /></Button>
        <Separator orientation="vertical" className="mx-1 h-6 bg-slate-800" />
        <Button size="sm" variant="ghost" onClick={insertLink}><LinkIcon className="h-4 w-4 text-slate-200" /></Button>
        <Button size="sm" variant="ghost" onClick={insertImage}><ImageIcon className="h-4 w-4 text-slate-200" /></Button>
        <Separator orientation="vertical" className="mx-1 h-6 bg-slate-800" />
        <div className="flex items-center gap-1">
          <span className="text-xs text-slate-400">Personalize:</span>
          <Button size="sm" variant="outline" className="border-slate-700 text-slate-200" onClick={() => insertText('{{firstName}}')}>firstName</Button>
          <Button size="sm" variant="outline" className="border-slate-700 text-slate-200" onClick={() => insertText('{{lastName}}')}>lastName</Button>
          <Button size="sm" variant="outline" className="border-slate-700 text-slate-200" onClick={() => insertText('{{email}}')}>email</Button>
          <Button size="sm" variant="outline" className="border-emerald-700 text-emerald-200" onClick={() => insertText('{{company}}')}>company</Button>
          <Button size="sm" variant="outline" className="border-emerald-700 text-emerald-200" onClick={() => insertText('{{plan}}')}>plan</Button>
        </div>
        <div className="ml-auto">
          <Button size="sm" variant="secondary" onClick={() => setMode(m => (m === 'design' ? 'html' : 'design'))}>
            <Code className="mr-2 h-4 w-4" />
            {mode === 'design' ? 'HTML' : 'Design'}
          </Button>
        </div>
      </div>
      <Separator className="bg-slate-800" />
      {mode === 'design' ? (
        <div
          ref={ref}
          className="min-h-[200px] w-full bg-slate-950 p-3 text-sm text-slate-100 outline-none"
          contentEditable
          onInput={(e) => onChange((e.target as HTMLDivElement).innerHTML)}
          suppressContentEditableWarning
          role="textbox"
          aria-multiline="true"
        />
      ) : (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="min-h-[200px] w-full resize-y bg-slate-950 text-slate-100 placeholder:text-slate-500"
        />
      )}
      <div className="border-t border-slate-800 p-2 text-xs text-slate-400">
        <span className="font-medium">💡 Tip:</span> Built-in variables: <code className="bg-slate-800 px-1 rounded">{"{{firstName}}"}</code>, <code className="bg-slate-800 px-1 rounded">{"{{lastName}}"}</code>, <code className="bg-slate-800 px-1 rounded">{"{{email}}"}</code>. 
        CSV variables: <code className="bg-slate-800 px-1 rounded">{"{{company}}"}</code>, <code className="bg-slate-800 px-1 rounded">{"{{plan}}"}</code>, <code className="bg-slate-800 px-1 rounded">{"{{city}}"}</code>, etc.
      </div>
    </div>
  )
}
