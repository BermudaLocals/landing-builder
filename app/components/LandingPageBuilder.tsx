"use client"
import { useState } from 'react'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import Canvas from './Canvas'
import ComponentPalette from './ComponentPalette'
import PropertyPanel from './PropertyPanel'
import { Rocket, Monitor, Tablet, Smartphone, PanelLeftClose, PanelRightClose, PanelLeft, PanelRight, Sparkles } from 'lucide-react'

type Component = { id: string; type: string; props: any }

export default function LandingPageBuilder() {
  const [components, setComponents] = useState<Component[]>([
    { id: '1', type: 'hero', props: { title: 'Build landing pages 10x faster', subtitle: 'LaunchPad is better than landingsite.ai', cta: 'Get Started' } },
  ])
  const [selectedId, setSelectedId] = useState<string | null>('1')
  const [showLeft, setShowLeft] = useState(true)
  const [showRight, setShowRight] = useState(true)
  const [device, setDevice] = useState<'desktop'|'tablet'|'mobile'>('desktop')

  const addComponent = (type: string) => {
    const newComp: Component = {
      id: Date.now().toString(),
      type,
      props: { title: type.toUpperCase(), subtitle: 'Edit this in the right panel' }
    }
    setComponents([...components, newComp])
    setSelectedId(newComp.id)
  }

  const updateComponent = (id: string, newProps: any) => {
    setComponents(components.map(c => c.id === id? {...c, props: {...c.props,...newProps } } : c))
  }

  const selectedComponent = components.find(c => c.id === selectedId)

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="h-screen flex flex-col bg-[#08080a] text-white overflow-hidden">
        {/* PREMIUM TOP BAR */}
        <header className="h- shrink-0 flex items-center justify-between px-3 border-b border-white/[0.08] bg-[#0f0f11]/80 backdrop-blur-xl z-50">
          <div className="flex items-center gap-3">
            <button onClick={()=>setShowLeft(!showLeft)} className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white">{showLeft? <PanelLeftClose className="w-4 h-4"/> : <PanelLeft className="w-4 h-4"/>}</button>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-600/20"><Rocket className="w-4 h-4 text-white"/></div>
            <span className="font-semibold tracking-tight text-">LaunchPad</span>
            <span className="text- px-2 py-0.5 rounded-full bg-white/10 border border-white/10 tracking-widest text-white/60">BETA</span>
          </div>

          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1 p-1 rounded-full bg-[#1a1a1e] border border-white/[0.08]">
            <button onClick={()=>setDevice('desktop')} className={`p-2 rounded-full transition-all ${device==='desktop'?'bg-white text-black shadow':'text-white/40 hover:text-white/80'}`}><Monitor className="w-4 h-4"/></button>
            <button onClick={()=>setDevice('tablet')} className={`p-2 rounded-full transition-all ${device==='tablet'?'bg-white text-black shadow':'text-white/40 hover:text-white/80'}`}><Tablet className="w-4 h-4"/></button>
            <button onClick={()=>setDevice('mobile')} className={`p-2 rounded-full transition-all ${device==='mobile'?'bg-white text-black shadow':'text-white/40 hover:text-white/80'}`}><Smartphone className="w-4 h-4"/></button>
          </div>

          <div className="flex items-center gap-2">
            <button className="h-8 px-3 text- rounded-full bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.08] text-white/80">Templates</button>
            <button className="h-8 px-3 text- rounded-full bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.08] text-white/80">Export Code</button>
            <button className="h-8 px-4 text- rounded-full bg-white text-black font-medium hover:bg-zinc-200 flex items-center gap-1.5"><Rocket className="w-3.5 h-3.5"/> Publish Site</button>
            <button onClick={()=>setShowRight(!showRight)} className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white ml-1">{showRight? <PanelRightClose className="w-4 h-4"/> : <PanelRight className="w-4 h-4"/>}</button>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          {showLeft && <aside className="w- shrink-0 border-r border-white/[0.06] bg-[#121214] overflow-y-auto"><ComponentPalette onAddComponent={addComponent} /></aside>}

          <main className="flex-1 bg-[#0e0e10] relative overflow-auto flex justify-center p-6 lg:p-10">
            <div className={`transition-all duration-300 bg-white rounded- shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_32px_80px_rgba(0,0,0,0.6)] overflow-hidden ${device==='desktop'?'w-full max-w-': device==='tablet'?'w-':'w- shrink-0'}`}>
              <Canvas components={components} selectedId={selectedId} onSelect={setSelectedId} />
            </div>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-[#1a1a1e] border border-white/10 text- text-white/40">Tip: Drag to reorder • Click to select • Right panel to edit</div>
          </main>

          {showRight && <aside className="w- shrink-0 border-l border-white/[0.06] bg-[#121214] overflow-y-auto"><PropertyPanel component={selectedComponent as any} onUpdateComponent={updateComponent} /></aside>}
        </div>
      </div>
    </DndProvider>
  )
}