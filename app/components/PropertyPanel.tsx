'use client';

import { useState } from 'react';
import { Component } from './LandingPageBuilder';
import { Type, Palette, Settings } from 'lucide-react';

interface PropertyPanelProps {
  component: Component | undefined;
  onUpdateComponent: (id: string, updates: Partial<Component>) => void;
}

export default function PropertyPanel({ component, onUpdateComponent }: PropertyPanelProps) {
  const [activeTab, setActiveTab] = useState('content');

  if (!component) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <Settings className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Component Selected</h3>
          <p className="text-gray-500">Click on any component to edit its properties</p>
        </div>
      </div>
    );
  }

  const updateProp = (key: string, value: any) => {
    onUpdateComponent(component.id, {
      props: { ...component.props, [key]: value }
    });
  };

  const updateStyle = (key: string, value: string) => {
    onUpdateComponent(component.id, {
      styles: { ...component.styles, [key]: value }
    });
  };

  return (
    <div className="p-4">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Properties</h2>
        <div className="text-sm text-gray-500 flex items-center gap-2">
          <div className="px-2 py-1 bg-blue-100 text-blue-800 rounded">{component.type}</div>
          <span>ID: {component.id.slice(0, 8)}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('content')}
          className={`flex-1 py-2 text-center font-medium ${activeTab === 'content' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
        >
          <div className="flex items-center justify-center gap-2">
            <Type className="w-4 h-4" />
            Content
          </div>
        </button>
        <button
          onClick={() => setActiveTab('style')}
          className={`flex-1 py-2 text-center font-medium ${activeTab === 'style' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
        >
          <div className="flex items-center justify-center gap-2">
            <Palette className="w-4 h-4" />
            Style
          </div>
        </button>
      </div>

      {activeTab === 'content' && (
        <div className="space-y-4">
          {Object.entries(component.props).map(([key, value]) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                {key.replace(/([A-Z])/g, ' $1')}
              </label>
              {typeof value === 'string' && key.toLowerCase().includes('color') ? (
                <input
                  type="color"
                  value={value || '#4f46e5'}
                  onChange={(e) => updateProp(key, e.target.value)}
                  className="w-full h-10 rounded border border-gray-300"
                />
              ) : typeof value === 'string' && (key.toLowerCase().includes('text') || key === 'title' || key === 'subtitle') ? (
                <textarea
                  value={value || ''}
                  onChange={(e) => updateProp(key, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={key === 'subtitle' ? 2 : 1}
                />
              ) : typeof value === 'string' ? (
                <input
                  type="text"
                  value={value || ''}
                  onChange={(e) => updateProp(key, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              ) : Array.isArray(value) ? (
                <div className="space-y-2">
                  {value.map((item, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={typeof item === 'object' ? item.title || item.name || '' : item}
                        onChange={(e) => {
                          const newArray = [...value];
                          if (typeof item === 'object') {
                            newArray[index] = { ...item, title: e.target.value };
                          } else {
                            newArray[index] = e.target.value;
                          }
                          updateProp(key, newArray);
                        }}
                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                        placeholder="Item"
                      />
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      const newArray = [...value];
                      if (typeof value[0] === 'object') {
                        newArray.push({ title: 'New Item', description: 'Description' });
                      } else {
                        newArray.push('New Item');
                      }
                      updateProp(key, newArray);
                    }}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    + Add Item
                  </button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'style' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Background Color</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={component.styles.backgroundColor || '#ffffff'}
                onChange={(e) => updateStyle('backgroundColor', e.target.value)}
                className="w-12 h-10 rounded border border-gray-300"
              />
              <input
                type="text"
                value={component.styles.backgroundColor || '#ffffff'}
                onChange={(e) => updateStyle('backgroundColor', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded"
                placeholder="#ffffff"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Text Color</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={component.styles.color || '#1f2937'}
                onChange={(e) => updateStyle('color', e.target.value)}
                className="w-12 h-10 rounded border border-gray-300"
              />
              <input
                type="text""/value"}
                className="w-12 h-10 rounded border border-gray-300"
              />
              <input
                type="text"
                value={component.styles.color || '#1f2937'}
                onChange={(e) => updateStyle('color', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded"
                placeholder="#1f2937"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Padding (rem)</label>
            <input
              type="range"
              min="0"
              max="8"
              step="0.5"
              value={parseFloat(component.styles.padding || '2')}
              onChange={(e) => updateStyle('padding', e.target.value + 'rem')}
              className="w-full"
            />
            <div className="text-xs text-gray-500 mt-1">{component.styles.padding || '2rem'}</div>
          </div>
        </div>
      )}
    </div>
  );
}
