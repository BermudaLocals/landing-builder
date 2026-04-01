'use client';

import { useDrag } from 'react-dnd';
import { 
  Header, 
  Star, 
  Users, 
  MessageSquare, 
  CreditCard, 
  Target, 
  Layout 
} from 'lucide-react';

interface ComponentItem {
  type: 'header' | 'hero' | 'features' | 'testimonials' | 'pricing' | 'cta' | 'footer';
  label: string;
  icon: React.ReactNode;
}

export default function ComponentPalette({ onAddComponent }: { onAddComponent: (type: any) => void }) {
  const components: ComponentItem[] = [
    { type: 'header', label: 'Header', icon: <Header className="w-5 h-5" /> },
    { type: 'hero', label: 'Hero', icon: <Star className="w-5 h-5" /> },
    { type: 'features', label: 'Features', icon: <Layout className="w-5 h-5" /> },
    { type: 'testimonials', label: 'Testimonials', icon: <MessageSquare className="w-5 h-5" /> },
    { type: 'pricing', label: 'Pricing', icon: <CreditCard className="w-5 h-5" /> },
    { type: 'cta', label: 'Call to Action', icon: <Target className="w-5 h-5" /> },
    { type: 'footer', label: 'Footer', icon: <Users className="w-5 h-5" /> },
  ];

  const DraggableComponent = ({ component }: { component: ComponentItem }) => {
    const [{ isDragging }, drag] = useDrag(() => ({
      type: 'component',
      item: { type: component.type },
      collect: (monitor) => ({
        isDragging: !!monitor.isDragging(),
      }),
    }));

    return (
      <div
        ref={drag}
        onClick={() => onAddComponent(component.type)}
        className={`p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 cursor-pointer transition-all ${isDragging ? 'opacity-50' : ''}`}
      >
        <div className="flex items-center gap-3">
          <div className="text-blue-600">{component.icon}</div>
          <div>
            <div className="font-medium text-gray-900">{component.label}</div>
            <div className="text-sm text-gray-500">Drag to canvas or click</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Components</h2>
      <div className="space-y-3">
        {components.map((component) => (
          <DraggableComponent key={component.type} component={component} />
        ))}
      </div>
      
      <div className="mt-8">
        <h3 className="font-medium text-gray-900 mb-3">Quick Templates</h3>
        <div className="space-y-2">
          <button 
            onClick={() => onAddComponent('hero')}
            className="w-full text-left p-3 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100 rounded-lg hover:border-blue-300"
          >
            <div className="font-medium text-gray-900">SaaS Landing Page</div>
            <div className="text-sm text-gray-500">Header + Hero + Features + CTA</div>
          </button>
          <button 
            onClick={() => onAddComponent('pricing')}
            className="w-full text-left p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 rounded-lg hover:border-green-300"
          >
            <div className="font-medium text-gray-900">Product Showcase</div>
            <div className="text-sm text-gray-500">Hero + Features + Testimonials + Pricing</div>
          </button>
        </div>
      </div>
    </div>
  );
}
