import { describe, it, expect } from 'vitest';
import { errorMessage } from './mbox.service';

describe('errorMessage', () => {
  it('returns message property when given an Error instance', () => {
    const error = new Error('something broke');
    expect(errorMessage(error)).toBe('something broke');
  });

  it('returns stringified value when given a string', () => {
    expect(errorMessage('plain text error')).toBe('plain text error');
  });

  it('returns stringified value when given a number', () => {
    expect(errorMessage(42)).toBe('42');
  });

  it('returns stringified value when given null', () => {
    expect(errorMessage(null)).toBe('null');
  });

  it('returns stringified value when given undefined', () => {
    expect(errorMessage(undefined)).toBe('undefined');
  });

  it('returns message from Error subclass', () => {
    const error = new TypeError('type mismatch');
    expect(errorMessage(error)).toBe('type mismatch');
  });

  it('returns stringified value when given an object without message', () => {
    expect(errorMessage({ code: 404 })).toBe('[object Object]');
  });
});
