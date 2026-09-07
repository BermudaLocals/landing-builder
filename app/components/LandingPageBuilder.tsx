"use client"
import { useState } from 'react'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import Canvas from './Canvas'
import ComponentPalette from './ComponentPalette'
import PropertyPanel from './PropertyPanel'
import TemplateGallery from './TemplateGallery'
import ExportDialog from './ExportDialog'
import { PanelLeft, PanelRight, Rocket, Smartphone, Monitor, Tablet, Sparkles } from 'lucide-react'

export type Component = {
  id: string
  type: string
  props: any
  styles: any
}

export default function LandingPageBuilder() {
  const [components, setComponents] = useState<Component[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [showLeft, setShowLeft] = useState(true)
  const [showRight, setShowRight] = useState(true)
  const [device, setDevice] = useState<'desktop'|'tablet'|'mobile'>('desktop')
  const [showTemplates, setShowTemplates] = useState(false)
  const [showExport, setShowExport] = useState(false)

  const addComponent = (type: string) => {
    const newComp: Component = {
      id: Date.now().toString(),
      type,
      props: { title: type === 'hero'? 'Build landing pages 10x faster' : 'New Section', subtitle: 'LaunchPad is better than landingsite.ai' },
      styles: { backgroundColor: '#ffffff', color: '#111827', padding: '4rem' }
    }
    setComponents([...components, newComp])
  }

  const selectedComponent = components.find(c => c.id === selected)

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="h-screen flex flex-col bg-[#0a0a0b] text-white">
        {/* Top Bar - Premium */}
        <header className="h- flex items-center justify-between px-4 border-b border-white/10 bg-[#111113]/80 backdrop-blur-xl sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
              <Rocket className="w-4 h-4" />
            </div>
            <span className="font-semibold tracking-tight">LaunchPad</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 border border-white/10">BETA</span>
          </div>

          <div className="flex items-center gap-2 p-1 rounded-full bg-white/5 border border-white/10">
            <button onClick={() => setDevice('desktop')} className={`p-1.5 rounded-full ${device==='desktop'?'bg-white text-black':''}`}><Monitor className="w-4 h-4"/></button>
            <button onClick={() => setDevice('tablet')} className={`p-1.5 rounded-full ${device==='tablet'?'bg-white text-black':''}`}><Tablet className="w-4 h-4"/></button>
            <button onClick={() => setDevice('mobile')} className={`p-1.5 rounded-full ${device==='mobile'?'bg-white text-black':''}`}><Smartphone className="w-4 h-4"/></button>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={()=>setShowTemplates(true)} className="px-3 py-1.5 text-sm rounded-full bg-white/10 hover:bg-white/15 border border-white/10 flex gap-1.5 items-center"><Sparkles className="w-3.5 h-3.5"/> Templates</button>
            <button onClick={()=>setShowExport(true)} className="px-3 py-1.5 text-sm rounded-full bg-white/10 hover:bg-white/15 border border-white/10">Export Code</button>
            <button className="px-4 py-1.5 text-sm rounded-full bg-white text-black font-medium hover:bg-zinc-200 flex gap-1.5 items-center"><Rocket className="w-3.5 h-3.5"/> Publish Site</button>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          {/* Left - Components - Premium */}
          {showLeft && (
            <aside className="w- border-r border-white/10 bg-[#121214] overflow-y-auto">
              <ComponentPalette onAddComponent={addComponent} />
            </aside>
          )}

          {/* Center - Canvas */}
          <main className="flex-1 bg-[#0e0e10] relative overflow-auto flex justify-center p-8">
            <div className={`transition-all duration-300 bg-white rounded- shadow-2xl overflow-hidden ${device==='desktop'?'w-full max-w-': device==='tablet'?'w-':'w-'}`}>
              <Canvas components={components} selectedId={selected} onSelect={setSelected} onUpdate={(id, u) => setComponents(components.map(c=>c.id===id?{...c,...u}:c))} />
            </div>
          </main>

          {/* Right - Properties - Premium */}
          {showRight && (
            <aside className="w- border-l border-white/10 bg-[#121214] overflow-y-auto">
              <PropertyPanel component={selectedComponent} onUpdateComponent={(id, updates) => setComponents(components.map(c=>c.id===id?{...c,...updates}:c))} />
            </aside>
          )}
        </div>
      </div>

      {showTemplates && <TemplateGallery onSelect={(t:any)=>{setShowTemplates(false)}} />}
      {showExport && <ExportDialog open={showExport} onOpenChange={setShowExport} html={`<!-- export -->`} />}
    </DndProvider>
  )
}
