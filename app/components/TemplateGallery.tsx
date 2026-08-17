'use client';

import { useMemo } from 'react';
import { X, LayoutTemplate } from 'lucide-react';
import {
  Component,
  ComponentType,
  getDefaultProps,
  getDefaultStyles,
} from './LandingPageBuilder';

export interface Template {
  id: string;
  name: string;
  description: string;
  components: Component[];
}

interface TemplateGalleryProps {
  onSelectTemplate: (template: Template) => void;
  onClose: () => void;
}

const buildComponents = (prefix: string, types: ComponentType[]): Component[] =>
  types.map((type, index) => ({
    id: `${prefix}-${type}-${index}`,
    type,
    props: getDefaultProps(type),
    styles: getDefaultStyles(type),
  }));

// Built lazily inside the component to avoid module-init work (the builder
// module and this module import each other's types/helpers).
function getTemplates(): Template[] {
  return [
    {
      id: 'saas-landing',
      name: 'SaaS Landing Page',
      description: 'Header + Hero + Features + CTA + Footer',
      components: buildComponents('saas', ['header', 'hero', 'features', 'cta', 'footer']),
    },
    {
      id: 'product-showcase',
      name: 'Product Showcase',
      description: 'Header + Hero + Features + Testimonials + Pricing + Footer',
      components: buildComponents('showcase', [
        'header',
        'hero',
        'features',
        'testimonials',
        'pricing',
        'footer',
      ]),
    },
    {
      id: 'waitlist',
      name: 'Waitlist Page',
      description: 'Hero + CTA + Footer',
      components: buildComponents('waitlist', ['hero', 'cta', 'footer']),
    },
  ];
}

export default function TemplateGallery({ onSelectTemplate, onClose }: TemplateGalleryProps) {
  const templates = useMemo(getTemplates, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Template Gallery</h2>
            <p className="text-sm text-gray-500">
              Start from a pre-built layout. Selecting a template replaces the current canvas.
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map((template) => (
            <button
              key={template.id}
              onClick={() => onSelectTemplate(template)}
              className="text-left p-4 border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all"
            >
              <div className="flex items-center gap-3 mb-2">
                <LayoutTemplate className="w-5 h-5 text-blue-600" />
                <div className="font-medium text-gray-900">{template.name}</div>
              </div>
              <div className="text-sm text-gray-500">{template.description}</div>
              <div className="mt-3 flex flex-wrap gap-1">
                {template.components.map((component) => (
                  <span
                    key={component.id}
                    className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
                  >
                    {component.type}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
