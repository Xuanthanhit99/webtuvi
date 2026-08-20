import {
  DISCOVERY_ACCEPTED_MESSAGE,
  firstFollowUp,
  memoryNoteContent,
  reflectionMessage,
} from './conversation-script';

describe('conversation-script', () => {
  it('quotes back an excerpt of what the user wrote in the first follow-up', () => {
    const reply = firstFollowUp('Starting a new job next week and feeling nervous about it.');
    expect(reply).toContain('Starting a new job next week');
    expect(reply).toContain('hardest part');
  });

  it('truncates long messages to a bounded excerpt', () => {
    const longMessage = new Array(50).fill('word').join(' ');
    const reply = firstFollowUp(longMessage);
    expect(reply.length).toBeLessThan(longMessage.length);
  });

  it('the reflection message asks for consent rather than asserting it will remember', () => {
    expect(reflectionMessage()).toMatch(/want me to remember/i);
  });

  it('memoryNoteContent is always prefixed for downstream display', () => {
    expect(memoryNoteContent('feeling nervous about a new job')).toMatch(/^Remembered: /);
  });

  it('the Discovery-accepted message tells the user Discovery is available now, not still warming up', () => {
    expect(DISCOVERY_ACCEPTED_MESSAGE).not.toMatch(/warming up/i);
    expect(DISCOVERY_ACCEPTED_MESSAGE).not.toMatch(/coming soon/i);
    expect(DISCOVERY_ACCEPTED_MESSAGE).not.toMatch(/let you know the moment/i);
    expect(DISCOVERY_ACCEPTED_MESSAGE).toMatch(/ready|live/i);
  });
});
