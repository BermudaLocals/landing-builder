'use client';
import { Component } from './LandingPageBuilder';

export default function ComponentRenderer({ component, onUpdate }: { component: Component, onUpdate: (u:any)=>void }) {
  const s = component.styles || { backgroundColor: '#ffffff', color: '#1f2937', padding: '2rem', borderRadius: '0.5rem' };
  const baseStyles = {
    backgroundColor: s.backgroundColor || '#ffffff',
    color: s.color || '#1f2937',
    padding: s.padding || '2rem',
    borderRadius: s.borderRadius || '0.5rem',
  } as any;

  const renderComponent = () => {
    switch(component.type) {
      case 'hero':
        return (
          <div style={baseStyles} className="text-center py-20">
            <h1 className="text-5xl font-bold tracking-tight">{component.props.title || 'Build landing pages 10x faster'}</h1>
            <p className="mt-4 text-lg opacity-70">{component.props.subtitle || 'LaunchPad is better than landingsite.ai'}</p>
            <button className="mt-8 px-6 py-3 rounded-full bg-zinc-900 text-white">{component.props.cta || 'Get Started'}</button>
          </div>
        );
      case 'header':
        return <div style={baseStyles} className="flex justify-between items-center py-4 px-6"><span className="font-bold">LaunchPad</span><span className="text-sm opacity-60">Menu</span></div>;
      case 'footer':
        return <div style={baseStyles} className="py-10 text-center text-sm opacity-60">© 2026 LaunchPad - {component.props.title || 'Footer'}</div>;
      case 'cta':
        return <div style={baseStyles} className="py-16 text-center bg-zinc-900 text-white rounded-xl"><h3 className="text-3xl font-bold">{component.props.title || 'Ready to launch?'}</h3></div>;
      default:
        return <div style={baseStyles} className="py-12 text-center"><div className="text-xs uppercase opacity-40">{component.type}</div><div className="font-medium mt-1">{component.props.title}</div><div className="text-sm opacity-60">{component.props.subtitle}</div></div>;
    }
  };
  return renderComponent();
}