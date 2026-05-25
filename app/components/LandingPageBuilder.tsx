'use client';

import { useState, useCallback } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import ComponentPalette from './ComponentPalette';
import Canvas from './Canvas';
import PropertyPanel from './PropertyPanel';
import TemplateGallery from './TemplateGallery';
import ExportDialog from './ExportDialog';
import { PanelLeft, PanelRight, Rocket } from 'lucide-react';

type ComponentType = 'header' | 'hero' | 'features' | 'testimonials' | 'pricing' | 'cta' | 'footer';

interface Component {
  id: string;
  type: ComponentType;
  props: Record<string, any>;
  styles: Record<string, any>;
}

export default function LandingPageBuilder() {
  const [components, setComponents] = useState<Component[]>([
    {
      id: 'header-1',
      type: 'header',
      props: { title: 'LaunchPad', logo: '', navItems: ['Home', 'Features', 'Pricing', 'Contact'] },
      styles: { backgroundColor: '#ffffff', color: '#1f2937' }
    },
    {
      id: 'hero-1',
      type: 'hero',
      props: { 
        title: 'Build Landing Pages That Convert', 
        subtitle: 'Drag, drop, and deploy in minutes. No code required.',
        ctaText: 'Start Building',
        ctaLink: '#',
        image: ''
      },
      styles: { backgroundColor: '#4f46e5', color: '#ffffff' }
    }
  ]);
  
  const [selectedComponent, setSelectedComponent] = useState<string | null>('hero-1');
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showExport, setShowExport] = useState(false);

  const addComponent = useCallback((type: ComponentType) => {
    const newComponent: Component = {
      id: `${type}-${Date.now()}`,
      type,
      props: getDefaultProps(type),
      styles: getDefaultStyles(type)
    };
    setComponents(prev => [...prev, newComponent]);
    setSelectedComponent(newComponent.id);
  }, []);

  const updateComponent = useCallback((id: string, updates: Partial<Component>) => {
    setComponents(prev => 
      prev.map(comp => 
        comp.id === id ? { ...comp, ...updates } : comp
      )
    );
  }, []);

  const deleteComponent = useCallback((id: string) => {
    setComponents(prev => prev.filter(comp => comp.id !== id));
    setSelectedComponent(null);
  }, []);

  const publishPage = useCallback(async () => {
    // Publish to Vercel/Netlify
    const response = await fetch('/api/publish', {
      method: 'POST',
      body: JSON.stringify({ components })
    });
    const data = await response.json();
    
    if (data.url) {
      window.open(data.url, '_blank');
    }
  }, [components]);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="h-screen flex flex-col bg-gray-50">
        {/* Top Bar */}
        <div className="h-16 bg-white border-b border-gray-200 px-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowLeftPanel(!showLeftPanel)}
              className="p-2 hover:bg-gray-100 rounded"
            >
              <PanelLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-semibold text-gray-800">LaunchPad Builder</h1>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowTemplates(true)}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Templates
            </button>
            <button
              onClick={() => setShowExport(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Export Code
            </button>
            <button
              onClick={publishPage}
              className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:opacity-90 flex items-center gap-2"
            >
              <Rocket className="w-4 h-4" />
              Publish Site
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left Panel - Components */}
          {showLeftPanel && (
            <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
              <ComponentPalette onAddComponent={addComponent} />
            </div>
          )}

          {/* Main Canvas */}
          <div className="flex-1 overflow-y-auto p-4">
            <Canvas
              components={components}
              selectedComponent={selectedComponent}
              onSelectComponent={setSelectedComponent}
              onUpdateComponent={updateComponent}
              onDeleteComponent={deleteComponent}
            />
          </div>

          {/* Right Panel - Properties */}
          {showRightPanel && (
            <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
              <PropertyPanel
                component={components.find(c => c.id === selectedComponent)}
                onUpdateComponent={updateComponent}
              />
            </div>
          )}
        </div>
      </div>

      {showTemplates && (
        <TemplateGallery
          onSelectTemplate={(template) => {
            setComponents(template.components);
            setShowTemplates(false);
          }}
          onClose={() => setShowTemplates(false)}
        />
      )}

      {showExport && (
        <ExportDialog
          components={components}
          onClose={() => setShowExport(false)}
        />
      )}
    </DndProvider>
  );
}

function getDefaultProps(type: ComponentType) {
  const defaults = {
    header: { title: 'Your Brand', logo: '', navItems: ['Home', 'About', 'Contact'] },
    hero: { 
      title: 'Amazing Headline Here', 
      subtitle: 'Compelling subheading that explains your value proposition.',
      ctaText: 'Get Started',
      ctaLink: '#',
      image: ''
    },
    features: {
      title: 'Why Choose Us',
      features: [
        { title: 'Feature One', description: 'Description of feature one', icon: '✓' },
        { title: 'Feature Two', description: 'Description of feature two', icon: '⚡' },
        { title: 'Feature Three', description: 'Description of feature three', icon: '🎯' }
      ]
    },
    testimonials: {
      title: 'What Our Customers Say',
      testimonials: [
        { quote: 'This changed everything!', author: 'John Doe', role: 'CEO, Company' },
        { quote: 'Incredible results!', author: 'Jane Smith', role: 'Marketing Director' }
      ]
    },
    pricing: {
      title: 'Simple Pricing',
      plans: [
        { name: 'Basic', price: '$19', features: ['Feature 1', 'Feature 2'] },
        { name: 'Pro', price: '$49', features: ['All features', 'Priority support'] },
        { name: 'Enterprise', price: '$99', features: ['Everything', 'Custom solutions'] }
      ]
    },
    cta: {
      title: 'Ready to Get Started?',
      subtitle: 'Join thousands of satisfied customers today.',
      ctaText: 'Start Free Trial',
      ctaLink: '#'
    },
    footer: {
      copyright: '© 2024 Your Company. All rights reserved.',
      links: ['Privacy Policy', 'Terms of Service', 'Contact Us']
    }
  };
  
  return defaults[type] || {};
}

function getDefaultStyles(type: ComponentType) {
  return {
    backgroundColor: type === 'hero' ? '#4f46e5' : '#ffffff',
    color: type === 'hero' ? '#ffffff' : '#1f2937',
    padding: '2rem',
    borderRadius: '0.5rem'
  };
}
