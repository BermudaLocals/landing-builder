'use client';

import { useDrop } from 'react-dnd';
import ComponentRenderer from './ComponentRenderer';
import { Trash2, Plus } from 'lucide-react';
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
      // Handle drop - component is added via palette click
      return { name: 'Canvas' };
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  return (
    <div 
      ref={drop}
      className={`min-h-full p-4 transition-all ${isOver ? 'bg-blue-50 border-2 border-dashed border-blue-300' : 'bg-white border border-gray-200'}`}
    >
      <div className="max-w-6xl mx-auto">
        {components.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <Plus className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Empty Canvas</h3>
            <p className="text-gray-500 mb-6">Drag components from the left panel or click to add</p>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Plus className="w-4 h-4" />
              Add First Component
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {components.map((component) => (
              <div 
                key={component.id}
                className={`relative group ${selectedComponent === component.id ? 'ring-2 ring-blue-500 ring-offset-2' : 'hover:ring-1 hover:ring-gray-300'}`}
                onClick={() => onSelectComponent(component.id)}
              >
                <div className="absolute -top-3 -right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteComponent(component.id);
                    }}
                    className="p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
                
                <ComponentRenderer 
                  component={component}
                  onUpdate={(updates) => onUpdateComponent(component.id, updates)}
                />
                
                <div className="text-xs text-gray-500 mt-1 px-1">
                  {component.type.charAt(0).toUpperCase() + component.type.slice(1)}
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="mt-8 text-center text-gray-400 text-sm">
          <p>Tip: Drag components to reorder (coming soon) • Click to select • Use right panel to edit</p>
        </div>
      </div>
    </div>
  );
}
