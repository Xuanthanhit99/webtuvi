/**
 * Same disclosed limitation as onboarding/conversation-script.ts: this is a
 * deterministic, rule-based responder, not a language model. It exists so the
 * Companion route and Dashboard's "continue the conversation" CTA have something
 * real to open onto in Sprint 1, without pretending to be generative AI.
 */

const GENERIC_REPLIES = [
  "Thanks for sharing that. What feels most present about it right now?",
  "I hear you. Is there a part of this you'd like to think through together?",
  "That's worth sitting with. What would feel like progress here, even something small?",
  "Noted — I'm listening. Want to say more, or leave it there for now?",
];

function excerpt(text: string, maxWords = 8): string {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return words.join(' ');
  return `${words.slice(0, maxWords).join(' ')}…`;
}

export function replyTo(userMessage: string, turnIndex: number): string {
  // turnIndex comes from a Prisma count(), always >= 0.
  const template = GENERIC_REPLIES[turnIndex % GENERIC_REPLIES.length]!;
  if (turnIndex === 0) {
    return `“${excerpt(userMessage)}” — ${template.charAt(0).toLowerCase()}${template.slice(1)}`;
  }
  return template;
}

export const OPEN_INVITATION = "I'm here whenever you want to talk.";
