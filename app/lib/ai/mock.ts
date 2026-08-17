import type { AiProvider, AiGenerationResult } from './provider';

// Deterministic offline provider. Default when AI_PROVIDER is unset, so the
// generation loop works in development and demos without credentials or cost.
// Real deployments set AI_PROVIDER (e.g. "openai") plus that provider's keys.
export const mockProvider: AiProvider = {
  name: 'mock',

  async generateStructuredComponents(prompt: string): Promise<AiGenerationResult> {
    const subject = prompt.trim().replace(/\s+/g, ' ').slice(0, 80);

    return {
      model: 'mock-1',
      components: [
        {
          id: 'header-1',
          type: 'header',
          props: { title: subject, logo: '', navItems: ['Home', 'Features', 'Pricing', 'Contact'] },
          styles: { backgroundColor: '#ffffff', color: '#1f2937', padding: '2rem', borderRadius: '0.5rem' },
        },
        {
          id: 'hero-1',
          type: 'hero',
          props: {
            title: subject,
            subtitle: `Everything you need for ${subject.toLowerCase()}, generated as a starting point.`,
            ctaText: 'Get Started',
            ctaLink: '#',
            image: '',
          },
          styles: { backgroundColor: '#4f46e5', color: '#ffffff', padding: '2rem', borderRadius: '0.5rem' },
        },
        {
          id: 'features-1',
          type: 'features',
          props: {
            title: 'Why Choose Us',
            features: [
              { title: 'Fast', description: 'Get up and running in minutes.', icon: '⚡' },
              { title: 'Simple', description: 'No complexity, just results.', icon: '✓' },
              { title: 'Reliable', description: 'Built to be depended on.', icon: '🎯' },
            ],
          },
          styles: { backgroundColor: '#ffffff', color: '#1f2937', padding: '2rem', borderRadius: '0.5rem' },
        },
        {
          id: 'cta-1',
          type: 'cta',
          props: {
            title: 'Ready to Get Started?',
            subtitle: 'Join us today.',
            ctaText: 'Start Now',
            ctaLink: '#',
          },
          styles: { backgroundColor: '#ffffff', color: '#1f2937', padding: '2rem', borderRadius: '0.5rem' },
        },
        {
          id: 'footer-1',
          type: 'footer',
          props: {
            copyright: `© ${new Date().getFullYear()} ${subject}. All rights reserved.`,
            links: ['Privacy Policy', 'Terms of Service', 'Contact Us'],
          },
          styles: { backgroundColor: '#ffffff', color: '#1f2937', padding: '2rem', borderRadius: '0.5rem' },
        },
      ],
    };
  },
};
