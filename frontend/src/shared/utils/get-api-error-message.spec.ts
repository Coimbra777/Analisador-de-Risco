import { describe, expect, it } from 'vitest';

import { getApiErrorMessage } from './get-api-error-message';

describe('getApiErrorMessage', () => {
  it('returns translated message for known API string', () => {
    const err = {
      response: { data: { message: 'Invalid email or password.' } },
    };
    expect(getApiErrorMessage(err, 'fallback')).toBe(
      'E-mail ou senha inválidos.',
    );
  });

  it('joins validation array messages', () => {
    const err = {
      response: { data: { message: ['a is required', 'b is invalid'] } },
    };
    const out = getApiErrorMessage(err, 'fallback');
    expect(out).toContain('a is required');
    expect(out).toContain('b is invalid');
  });

  it('returns fallback when message is missing', () => {
    expect(getApiErrorMessage(new Error('network'), 'Something went wrong')).toBe(
      'Something went wrong',
    );
  });

  it('maps file size prefix to user-friendly text', () => {
    const err = {
      response: { data: { message: 'File is too large (max 5mb)' } },
    };
    expect(getApiErrorMessage(err, 'x')).toBe(
      'O arquivo excede o tamanho máximo permitido.',
    );
  });
});
