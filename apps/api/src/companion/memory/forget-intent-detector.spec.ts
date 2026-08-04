import { detectForgetIntent } from './forget-intent-detector';

describe('detectForgetIntent', () => {
  it('detects "Forget that."', () => {
    expect(detectForgetIntent('Forget that.')).toEqual({ kind: 'FORGET_RECENT' });
  });

  it('detects "forget what I just said"', () => {
    expect(detectForgetIntent('Please forget what I just said')).toEqual({ kind: 'FORGET_RECENT' });
  });

  it('detects "forget the last thing"', () => {
    expect(detectForgetIntent('Can you forget the last thing I told you')).toEqual({ kind: 'FORGET_RECENT' });
  });

  it('detects "Don\'t remember this."', () => {
    expect(detectForgetIntent("Don't remember this.")).toEqual({ kind: 'FORGET_RECENT' });
  });

  it('detects "Never remember my health stuff" and maps to the HEALTH type', () => {
    expect(detectForgetIntent('Never remember my health stuff')).toEqual({ kind: 'NEVER_REMEMBER_TYPE', type: 'HEALTH' });
  });

  it('detects "never remember anything about my work" and maps to the WORK type', () => {
    expect(detectForgetIntent('Never remember anything about my work')).toEqual({ kind: 'NEVER_REMEMBER_TYPE', type: 'WORK' });
  });

  it('detects "Delete everything about my ex" with the topic extracted', () => {
    expect(detectForgetIntent('Delete everything about my ex')).toEqual({ kind: 'DELETE_ABOUT', topic: 'my ex' });
  });

  it('strips trailing punctuation from the extracted topic', () => {
    expect(detectForgetIntent('Delete everything about my old job.')).toEqual({ kind: 'DELETE_ABOUT', topic: 'my old job' });
  });

  it('returns null for "never remember" with no recognizable type keyword', () => {
    expect(detectForgetIntent('Never remember this random thing')).toBeNull();
  });

  it('returns null for ordinary conversation', () => {
    expect(detectForgetIntent('I had a great day today')).toBeNull();
  });

  it('returns null for "delete everything about" with no topic text', () => {
    expect(detectForgetIntent('Delete everything about')).toBeNull();
  });

  it('is deterministic', () => {
    const a = detectForgetIntent('Delete everything about my old job');
    const b = detectForgetIntent('Delete everything about my old job');
    expect(a).toEqual(b);
  });
});
