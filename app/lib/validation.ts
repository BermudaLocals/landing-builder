// Server-side validation of the builder's component document model.
// The 7 types duplicate the builder's ComponentType union on purpose:
// route handlers must not import from 'use client' modules.
export const COMPONENT_TYPES = [
  'header',
  'hero',
  'features',
  'testimonials',
  'pricing',
  'cta',
  'footer',
] as const;

export interface ValidatedComponent {
  id: string;
  type: string;
  props: Record<string, unknown>;
  styles: Record<string, unknown>;
}

type ValidationResult =
  | { ok: true; components: ValidatedComponent[] }
  | { ok: false; error: string };

const MAX_COMPONENTS = 50;

export function validateComponents(input: unknown): ValidationResult {
  if (!Array.isArray(input)) {
    return { ok: false, error: 'components must be an array' };
  }
  if (input.length > MAX_COMPONENTS) {
    return { ok: false, error: `too many components (max ${MAX_COMPONENTS})` };
  }

  for (let i = 0; i < input.length; i++) {
    const component = input[i];
    if (typeof component !== 'object' || component === null || Array.isArray(component)) {
      return { ok: false, error: `components[${i}] must be an object` };
    }
    const { id, type, props, styles } = component as Record<string, unknown>;

    if (typeof id !== 'string' || id.length === 0 || id.length > 100) {
      return { ok: false, error: `components[${i}].id must be a non-empty string (max 100 chars)` };
    }
    if (typeof type !== 'string' || !COMPONENT_TYPES.includes(type as (typeof COMPONENT_TYPES)[number])) {
      return { ok: false, error: `components[${i}].type must be one of: ${COMPONENT_TYPES.join(', ')}` };
    }
    if (typeof props !== 'object' || props === null || Array.isArray(props)) {
      return { ok: false, error: `components[${i}].props must be an object` };
    }
    if (typeof styles !== 'object' || styles === null || Array.isArray(styles)) {
      return { ok: false, error: `components[${i}].styles must be an object` };
    }
  }

  return { ok: true, components: input as ValidatedComponent[] };
}

const MAX_TITLE_LENGTH = 120;

export function validateTitle(
  input: unknown
): { ok: true; title: string } | { ok: false; error: string } {
  if (typeof input !== 'string') {
    return { ok: false, error: 'title must be a string' };
  }
  const title = input.trim();
  if (title.length === 0) {
    return { ok: false, error: 'title must not be empty' };
  }
  if (title.length > MAX_TITLE_LENGTH) {
    return { ok: false, error: `title must be at most ${MAX_TITLE_LENGTH} characters` };
  }
  return { ok: true, title };
}

const MIN_PROMPT_LENGTH = 10;
const MAX_PROMPT_LENGTH = 1000;

export function validatePrompt(
  input: unknown
): { ok: true; prompt: string } | { ok: false; error: string } {
  if (typeof input !== 'string') {
    return { ok: false, error: 'prompt must be a string' };
  }
  const prompt = input.trim();
  if (prompt.length < MIN_PROMPT_LENGTH) {
    return { ok: false, error: `prompt must be at least ${MIN_PROMPT_LENGTH} characters` };
  }
  if (prompt.length > MAX_PROMPT_LENGTH) {
    return { ok: false, error: `prompt must be at most ${MAX_PROMPT_LENGTH} characters` };
  }
  return { ok: true, prompt };
}
