/**
 * Deterministic, rule-based Companion "voice" for Sprint 1 onboarding.
 *
 * IMPORTANT — this is not a language model. Sprint 1 has no AI/LLM provider in
 * scope, so the Companion's replies are templated copy modeled directly on the
 * canonical example script in docs/reference Module 7 §6, with light templating
 * (quoting back a short excerpt of what the user wrote) to avoid feeling
 * completely canned. Real generative replies are explicitly deferred to a later
 * sprint — see docs/architecture/sprint-1-decisions.md.
 */

function excerpt(text: string, maxWords = 8): string {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return words.join(' ');
  return `${words.slice(0, maxWords).join(' ')}…`;
}

export const OPENING_MESSAGE =
  "Hi — I'm glad you're here. I don't know much about you yet, but I'd like to. What's been on your mind lately — even something small?";

export function firstFollowUp(userMessage: string): string {
  const quoted = excerpt(userMessage);
  return `Thanks for telling me that — “${quoted}” sounds like it's been taking up some real space. What's the hardest part about it, do you think?`;
}

/**
 * Asks — rather than asserts — before remembering anything (explicit memory
 * consent, per the Sprint 1 privacy requirement that a user who declines can
 * still complete onboarding with nothing saved).
 */
export function reflectionMessage(): string {
  return "That makes sense. Want me to remember this, so if it comes up again, we can look back at how it's actually going, not just how it feels right now?";
}

export const MEMORY_SAVED_MESSAGE = "Got it — I'll keep that in mind.";
export const MEMORY_DECLINED_MESSAGE = "That's okay — I won't save that. We can just keep talking.";

export function memoryNoteContent(firstUserMessage: string): string {
  return `Remembered: ${excerpt(firstUserMessage, 20)}`;
}

export const DISCOVERY_OFFER_MESSAGE =
  'Want to see what Discovery has to offer — tarot, your chart, your numbers? Totally optional — we can also just keep talking.';

export const DISCOVERY_ACCEPTED_MESSAGE =
  "Discovery is ready for you whenever you want it — a real Tarot draw, your chart, your numbers, all live right now. For now, I'll keep what you've shared in mind.";

export const DISCOVERY_SKIPPED_MESSAGE =
  "That's completely fine — we can always come back to it whenever you're curious.";

export const ACTIVATION_MESSAGE =
  "I'll keep this in mind for next time. Whenever you're ready to talk again, I'm here.";
