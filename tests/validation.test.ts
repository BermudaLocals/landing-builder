import { describe, it, expect } from 'vitest';
import { validateComponents, validateTitle, COMPONENT_TYPES } from '@/lib/validation';

const validComponent = {
  id: 'hero-1',
  type: 'hero',
  props: { title: 'Hello' },
  styles: { backgroundColor: '#fff' },
};

describe('validateComponents', () => {
  it('accepts a valid component document', () => {
    const result = validateComponents([validComponent]);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.components).toHaveLength(1);
  });

  it('accepts every known component type', () => {
    const result = validateComponents(
      COMPONENT_TYPES.map((type, i) => ({ id: `c-${i}`, type, props: {}, styles: {} }))
    );
    expect(result.ok).toBe(true);
  });

  it('rejects non-array input', () => {
    expect(validateComponents('nope').ok).toBe(false);
    expect(validateComponents(null).ok).toBe(false);
    expect(validateComponents({}).ok).toBe(false);
  });

  it('rejects unknown component types', () => {
    const result = validateComponents([{ ...validComponent, type: 'banner' }]);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('type');
  });

  it('rejects non-object props/styles', () => {
    expect(validateComponents([{ ...validComponent, props: [] }]).ok).toBe(false);
    expect(validateComponents([{ ...validComponent, styles: null }]).ok).toBe(false);
  });

  it('rejects missing or oversized ids', () => {
    expect(validateComponents([{ ...validComponent, id: '' }]).ok).toBe(false);
    expect(validateComponents([{ ...validComponent, id: 'x'.repeat(101) }]).ok).toBe(false);
  });

  it('rejects documents over the component limit', () => {
    const many = Array.from({ length: 51 }, (_, i) => ({ ...validComponent, id: `c-${i}` }));
    expect(validateComponents(many).ok).toBe(false);
  });
});

describe('validateTitle', () => {
  it('accepts and trims a normal title', () => {
    const result = validateTitle('  My Page  ');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.title).toBe('My Page');
  });

  it('rejects empty, non-string, and oversized titles', () => {
    expect(validateTitle('   ').ok).toBe(false);
    expect(validateTitle(42).ok).toBe(false);
    expect(validateTitle('x'.repeat(121)).ok).toBe(false);
  });
});
