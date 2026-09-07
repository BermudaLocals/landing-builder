'use client';

import { useDrop } from 'react-dnd';
import ComponentRenderer from './ComponentRenderer';
import { Trash2, Plus, Sparkles } from 'lucide-react';
import { Component } from './LandingPageBuilder';

interface CanvasProps {
  components: Component[];
  selectedComponent: string | null;
  onSelectComponent: (id: string | null) => void;
  onUpdateComponent: (id: string, updates: Partial<Component>) => void;
  onDeleteComponent: (id: string) => void;
}

export default function Canvas({
  components,
  selectedComponent,
  onSelectComponent,
  onUpdateComponent,
  onDeleteComponent
}: CanvasProps) {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'component',
    drop: (item: { type: any }) => {
      return { name: 'Canvas' };
    },
    collect: (monitor) => ({
      isOver:!!monitor.isOver(),
    }),
  }));

  return (
    <div
      ref={drop as any}
      className={`min-h-full p-6 transition-all duration-200 ${isOver? 'bg-violet-500/[0.03] border-2 border-dashed border-violet-500/40' : 'bg-[#fcfcfd] border border-zinc-200'}`}
    >
      <div className="max-w- mx-auto">
        {components.length === 0? (
          <div className="text-center py-24">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-violet-600 to-indigo-600 rounded- mb-5 shadow-xl shadow-violet-600/20">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h3 className="text- font-semibold tracking-tight text-zinc-900 mb-2">Your canvas is empty</h3>
            <p className="text- text-zinc-500 mb-8 max-w-sm mx-auto">Drag components from the left or click to add your first section. Build better than landingsite.ai</p>
            <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-zinc-900 text-white rounded-full hover:bg-black text-sm font-medium">
              <Plus className="w-4 h-4" />
              Add First Component
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {components.map((component) => (
              <div
                key={component.id}
                className={`relative group rounded- overflow-hidden transition-all ${selectedComponent === component.id? 'ring-2 ring-violet-500 ring-offset-2 ring-offset-[#fcfcfd]' : 'hover:ring-1 hover:ring-zinc-200'}`}
                onClick={() => onSelectComponent(component.id)}
              >
                <div className="absolute top-3 right-3 z-10 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteComponent(component.id);
                    }}
                    className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <ComponentRenderer
                  component={component}
                  onUpdate={(updates: any) => onUpdateComponent(component.id, updates)}
                />

                <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-zinc-900 text-white text- tracking-widest uppercase opacity-0 group-hover:opacity-100 transition-opacity">
                  {component.type}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-10 text-center">
          <p className="text- text-zinc-400 tracking-wide">Tip: Drag to reorder (coming soon) • Click to select • Use right panel to edit • {components.length} section{components.length!== 1? 's' : ''}</p>
        </div>
      </div>
    </div>
  );
}