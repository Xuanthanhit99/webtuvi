import { deriveLiveAnnouncement } from './live-announcement';

describe('deriveLiveAnnouncement', () => {
  it('announces once when generation begins', () => {
    expect(deriveLiveAnnouncement('streaming')).toBe('Companion is responding…');
  });

  it('is empty for idle — nothing to announce', () => {
    expect(deriveLiveAnnouncement('idle')).toBe('');
  });

  it.each(['sending', 'error', 'rate_limited', 'safety_refused', 'offline', 'cancelled'] as const)(
    'is empty for status "%s" — those are announced by their own Alert/log region, not duplicated here',
    (status) => {
      expect(deriveLiveAnnouncement(status)).toBe('');
    },
  );
});
