'use client';

import { useState } from 'react';
import { Component } from './LandingPageBuilder';
import { Type, Palette, Settings, Sparkles } from 'lucide-react';

interface PropertyPanelProps {
  component: Component | undefined;
  onUpdateComponent: (id: string, updates: Partial<Component>) => void;
}

export default function PropertyPanel({ component, onUpdateComponent }: PropertyPanelProps) {
  const [activeTab, setActiveTab] = useState('content');

  if (!component) {
    return (
      <div className="p-6 h-full bg-[#121214]">
        <div className="text-center py-16">
          <div className="w-12 h-12 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center mx-auto mb-4">
            <Settings className="w-6 h-6 text-white/40" />
          </div>
          <h3 className="text- font-medium text-white mb-1.5">No Component Selected</h3>
          <p className="text- text-white/40 max-w- mx-auto leading-relaxed">Click any section on the canvas to edit its content & style</p>
        </div>
      </div>
    );
  }

  const updateProp = (key: string, value: any) => {
    onUpdateComponent(component.id, {
      props: {...component.props, [key]: value }
    });
  };

  const updateStyle = (key: string, value: string) => {
    onUpdateComponent(component.id, {
      styles: {...component.styles, [key]: value }
    });
  };

  return (
    <div className="p-4 bg-[#121214] h-full text-white">
      <div className="mb-6">
        <h2 className="text- font-semibold tracking-[0.15em] text-white/40 uppercase mb-3 flex items-center gap-1.5"><Sparkles className="w-3 h-3"/> Properties</h2>
        <div className="flex items-center gap-2">
          <div className="px-2.5 py-1 bg-violet-500/20 text-violet-300 border border-violet-500/20 rounded-full text- font-medium tracking-wide uppercase">{component.type}</div>
          <span className="text- text-white/30">ID: {component.id.slice(0, 6)}</span>
        </div>
      </div>

      <div className="flex p-1 rounded-full bg-white/[0.06] border border-white/[0.06] mb-6">
        <button onClick={() => setActiveTab('content')} className={`flex-1 py-1.5 rounded-full text- font-medium flex items-center justify-center gap-1.5 transition-all ${activeTab === 'content'? 'bg-white text-black shadow' : 'text-white/50 hover:text-white/80'}`}><Type className="w-3.5 h-3.5" /> Content</button>
        <button onClick={() => setActiveTab('style')} className={`flex-1 py-1.5 rounded-full text- font-medium flex items-center justify-center gap-1.5 transition-all ${activeTab === 'style'? 'bg-white text-black shadow' : 'text-white/50 hover:text-white/80'}`}><Palette className="w-3.5 h-3.5" /> Style</button>
      </div>

      {activeTab === 'content' && (
        <div className="space-y-4">
          {Object.entries(component.props).map(([key, value]) => (
            <div key={key}>
              <label className="block text- font-medium tracking-wide text-white/50 uppercase mb-1.5">{key.replace(/([A-Z])/g, ' $1')}</label>
              {typeof value === 'string' && key.toLowerCase().includes('color')? (
                <input type="color" value={value as string || '#4f46e5'} onChange={(e) => updateProp(key, e.target.value)} className="w-full h-10 rounded-xl border border-white/10 bg-transparent" />
              ) : typeof value === 'string' && (key.toLowerCase().includes('text') || key === 'title' || key === 'subtitle')? (
                <textarea value={value as string || ''} onChange={(e) => updateProp(key, e.target.value)} className="w-full px-3 py-2.5 bg-white/[0.06] border border-white/[0.08] rounded-xl focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 text- text-white placeholder:text-white/30" rows={key === 'subtitle'? 2 : 1} />
              ) : typeof value === 'string'? (
                <input type="text" value={value as string || ''} onChange={(e) => updateProp(key, e.target.value)} className="w-full px-3 py-2.5 bg-white/[0.06] border border-white/[0.08] rounded-xl focus:ring-2 focus:ring-violet-500/50 text- text-white" />
              ) : Array.isArray(value)? (
                <div className="space-y-2">
                  {value.map((item: any, index: number) => (
                    <div key={index} className="flex gap-2">
                      <input type="text" value={typeof item === 'object'? item.title || item.name || '' : item} onChange={(e) => { const newArray = [...value]; if (typeof item === 'object') { newArray[index] = {...item, title: e.target.value }; } else { newArray[index] = e.target.value; } updateProp(key, newArray); }} className="flex-1 px-2.5 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text- text-white" placeholder="Item" />
                    </div>
                  ))}
                  <button onClick={() => { const newArray = [...value]; if (typeof value[0] === 'object') { newArray.push({ title: 'New Item', description: 'Description' }); } else { newArray.push('New Item'); } updateProp(key, newArray); }} className="text- text-violet-300 hover:text-violet-200">+ Add Item</button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'style' && (
        <div className="space-y-5">
          <div>
            <label className="block text- font-medium tracking-wide text-white/50 uppercase mb-2">Background</label>
            <div className="flex gap-2">
              <input type="color" value={component.styles?.backgroundColor || '#ffffff'} onChange={(e) => updateStyle('backgroundColor', e.target.value)} className="w-12 h-10 rounded-xl border border-white/10 bg-transparent" />
              <input type="text" value={component.styles?.backgroundColor || '#ffffff'} onChange={(e) => updateStyle('backgroundColor', e.target.value)} className="flex-1 px-3 py-2 bg-white/[0.06] border border-white/[0.08] rounded-xl text- text-white" placeholder="#ffffff" />
            </div>
          </div>
          <div>
            <label className="block text- font-medium tracking-wide text-white/50 uppercase mb-2">Text Color</label>
            <div className="flex gap-2">
              <input type="color" value={component.styles?.color || '#1f2937'} onChange={(e) => updateStyle('color', e.target.value)} className="w-12 h-10 rounded-xl border border-white/10 bg-transparent" />
              <input type="text" value={component.styles?.color || '#1f2937'} onChange={(e) => updateStyle('color', e.target.value)} className="flex-1 px-3 py-2 bg-white/[0.06] border border-white/[0.08] rounded-xl text- text-white" placeholder="#1f2937" />
            </div>
          </div>
          <div>
            <label className="block text- font-medium tracking-wide text-white/50 uppercase mb-2">Padding: {component.styles?.padding || '2rem'}</label>
            <input type="range" min="0" max="8" step="0.5" value={parseFloat(component.styles?.padding || '2')} onChange={(e) => updateStyle('padding', e.target.value + 'rem')} className="w-full accent-violet-500" />
          </div>
        </div>
      )}
    </div>
  );
}