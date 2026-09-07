'use client';
import { Component } from './LandingPageBuilder';

export default function ComponentRenderer({ component, onUpdate }: { component: Component, onUpdate: (u:any)=>void }) {
  const s = component.styles || {};
  const base = {
    backgroundColor: s.backgroundColor || '#ffffff',
    color: s.color || '#1f2937',
    padding: s.padding || '2rem',
    borderRadius: s.borderRadius || '0.5rem',
  } as any;

  switch(component.type) {
    case 'hero':
      return (
        <div style={base} className="relative overflow-hidden bg-gradient-to-b from-white via-white to-zinc-50">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-100/60 via-transparent to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />

          <div className="relative max-w-6xl mx-auto px-8 py-24 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-50 border border-violet-200 text- font-medium tracking-wide text-violet-700 mb-6 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-violet-600 animate-pulse" />
              NEW • 10x better than landingsite.ai
            </div>

            <h1 className="text- leading-[0.95] font-bold tracking-[-0.04em] text-zinc-900 max-w- mx-auto">
              {component.props.title || 'Build landing pages 10x faster'}
            </h1>

            <p className="mt-5 text- leading-7 text-zinc-500 max-w- mx-auto">
              {component.props.subtitle || 'LaunchPad is better than landingsite.ai — drag, drop, publish in minutes, not hours. No code needed.'}
            </p>

            <div className="mt-8 flex items-center justify-center gap-3">
              <button className="h-11 px-6 rounded-full bg-zinc-900 text-white text- font-medium hover:bg-black shadow-[0_8px_24px_rgba(0,0,0,0.2)] transition-all">
                {component.props.cta || 'Get Started — Free'}
              </button>
              <button className="h-11 px-6 rounded-full bg-white border border-zinc-200 text-zinc-700 text- font-medium hover:bg-zinc-50">
                Watch 30s Demo
              </button>
            </div>

            <div className="mt-4 flex items-center justify-center gap-2 text- text-zinc-400">
              <div className="flex -space-x-2">
                <div className="w-6 h-6 rounded-full bg-zinc-200 border-2 border-white" />
                <div className="w-6 h-6 rounded-full bg-zinc-300 border-2 border-white" />
                <div className="w-6 h-6 rounded-full bg-zinc-400 border-2 border-white" />
              </div>
              Trusted by 2,400+ founders
            </div>

            <div className="mt-12 mx-auto max-w-4xl rounded- border border-zinc-200 bg-white shadow-[0_32px_80px_rgba(0,0,0,0.16),0_0_0_1px_rgba(0,0,0,0.04)] overflow-hidden">
              <div className="h-10 border-b border-zinc-100 flex items-center gap-1.5 px-4 bg-zinc-50/50">
                <div className="w-3 h-3 rounded-full bg-[#FF5F56]" />
                <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
                <div className="w-3 h-3 rounded-full bg-[#27C93F]" />
                <div className="ml-4 h-6 w- rounded-full bg-white border border-zinc-200 flex items-center px-3 text- text-zinc-400">launchpad.bermuda — Live Preview</div>
              </div>
              <div className="h- bg-gradient-to-br from-violet-50 via-white to-indigo-50 flex flex-col items-center justify-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center text-white font-bold">L</div>
                <div className="text- text-zinc-500">Your published site appears here — instant deploy</div>
              </div>
            </div>
          </div>
        </div>
      );
    case 'header':
      return <div style={base} className="flex justify-between items-center py-4 px-8 border-b border-zinc-100 bg-white/80 backdrop-blur"><span className="font-semibold tracking-tight">LaunchPad</span><span className="text-sm text-zinc-500">Features • Pricing • Docs</span></div>;
    case 'features':
      return (
        <div style={base} className="py-20 px-8 max-w-6xl mx-auto grid grid-cols-3 gap-6">
          {[1,2,3].map(i=> (
            <div key={i} className="p-6 rounded- border border-zinc-200 bg-white hover:shadow-lg transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-zinc-900 mb-4" />
              <h4 className="font-semibold text-zinc-900">Feature {i}</h4>
              <p className="text- text-zinc-500 mt-1.5 leading-6">{component.props.subtitle || 'Edit this in right panel'}</p>
            </div>
          ))}
        </div>
      );
    case 'footer':
      return <div style={base} className="py-12 text-center text- text-zinc-400 border-t border-zinc-100">© 2026 LaunchPad • Built in Bermuda • {component.props.title || ''}</div>;
    case 'cta':
      return <div style={base} className="py-20 text-center bg-zinc-900 text-white rounded- mx-8 my-8"><h3 className="text- font-bold tracking-tight">{component.props.title || 'Ready to launch?'}</h3><p className="text-white/60 mt-3">{component.props.subtitle || 'Publish your site in 60 seconds'}</p><button className="mt-6 h-11 px-6 rounded-full bg-white text-black font-medium">Publish Now</button></div>;
    default:
      return <div style={base} className="py-16 text-center border-y border-dashed border-zinc-200 bg-zinc-50/50"><div className="text- tracking-[0.2em] uppercase text-zinc-400">{component.type}</div><div className="mt-2 font-medium text-zinc-900">{component.props.title}</div><div className="text-sm text-zinc-500">{component.props.subtitle}</div></div>;
  }
}
