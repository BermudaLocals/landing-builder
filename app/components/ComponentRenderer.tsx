'use client';

import { Component } from './LandingPageBuilder';
import { Edit2 } from 'lucide-react';

interface ComponentRendererProps {
  component: Component;
  onUpdate: (updates: Partial<Component>) => void;
}

export default function ComponentRenderer({ component, onUpdate }: ComponentRendererProps) {
  const renderComponent = () => {
    const baseStyles = {
      backgroundColor: component.styles.backgroundColor || '#ffffff',
      color: component.styles.color || '#1f2937',
      padding: component.styles.padding || '2rem',
      borderRadius: component.styles.borderRadius || '0.5rem',
      border: '1px solid #e5e7eb'
    };

    switch (component.type) {
      case 'header':
        return (
          <header style={baseStyles}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 bg-blue-500 rounded"></div>
                <h1 className="text-xl font-bold">{component.props.title || 'Your Brand'}</h1>
              </div>
              <nav className="flex gap-6">
                {(component.props.navItems || ['Home', 'About', 'Contact']).map((item: string) => (
                  <a key={item} href="#" className="hover:text-blue-600">{item}</a>
                ))}
              </nav>
            </div>
          </header>
        );
      
      case 'hero':
        return (
          <section style={baseStyles} className="text-center">
            <h1 className="text-4xl font-bold mb-4">{component.props.title || 'Amazing Headline'}</h1>
            <p className="text-xl mb-8 opacity-90">{component.props.subtitle || 'Compelling subheading'}</p>
            <button 
              className="px-8 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition"
              onClick={() => onUpdate({ props: { ...component.props, ctaText: 'Updated!' } })}
            >
              {component.props.ctaText || 'Get Started'}
            </button>
          </section>
        );
      
      case 'features':
        return (
          <section style={baseStyles}>
            <h2 className="text-2xl font-bold mb-8 text-center">{component.props.title || 'Why Choose Us'}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(component.props.features || []).map((feature: any, index: number) => (
                <div key={index} className="p-4 bg-white/50 rounded-lg">
                  <div className="text-2xl mb-2">{feature.icon || '✓'}</div>
                  <h3 className="font-semibold mb-2">{feature.title || 'Feature'}</h3>
                  <p className="text-gray-600">{feature.description || 'Description'}</p>
                </div>
              ))}
            </div>
          </section>
        );
      
      case 'testimonials':
        return (
          <section style={baseStyles}>
            <h2 className="text-2xl font-bold mb-8 text-center">{component.props.title || 'Testimonials'}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(component.props.testimonials || []).map((testimonial: any, index: number) => (
                <div key={index} className="p-6 bg-white/50 rounded-lg border border-gray-200">
                  <p className="italic mb-4">"{testimonial.quote || 'Great service!'}"</p>
                  <div>
                    <div className="font-semibold">{testimonial.author || 'John Doe'}</div>
                    <div className="text-gray-600 text-sm">{testimonial.role || 'Customer'}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      
      default:
        return (
          <div style={baseStyles} className="p-8">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold">{component.type.toUpperCase()}</div>
                <div className="text-gray-600">Edit this component in the properties panel</div>
              </div>
              <Edit2 className="w-5 h-5 text-gray-400" />
            </div>
          </div>
        );
    }
  };

  return (
    <div className="relative">
      {renderComponent()}
    </div>
  );
}
