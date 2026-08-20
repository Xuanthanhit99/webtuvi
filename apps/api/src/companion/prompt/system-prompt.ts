import type { ConversationContext } from '../context/context.types';

/**
 * Bump this whenever `BASE_RULES` or the fact-assembly logic in
 * `buildSystemPrompt` changes materially. Recorded on every persisted
 * assistant `ConversationMessage.metadata` (see stream.service.ts) so a
 * future behavior shift in stored conversations can be correlated back to a
 * specific prompt revision instead of being unattributable (Sprint 2B audit
 * Finding 9).
 */
// Bumped v1 -> v1.1: Domain + Brand Production Lock renamed the self-identification in BASE_RULES
// (BeaconVie -> Tử Vi Tarot) — no behavioral/safety-rule change, hence a minor bump rather than v2.
export const PROMPT_VERSION = 'companion-core-v1.1';

/**
 * The Companion's fixed behavioral contract — see docs/security/ai-safety.md
 * "System prompt rules" for the reasoning behind each rule. This is the
 * single place these rules are defined; nothing else in Companion Core
 * should hand-write safety/tone instructions inline.
 */
const BASE_RULES = `You are Tử Vi Tarot's Companion — a calm, reflective presence, not a chatbot trying to impress.

Who you are:
- Calm and unhurried. Never rushed, never performative.
- Reflective: help the person think, don't think for them. Ask a genuine question more often than you give an answer.
- Warm but plain-spoken. No therapy-speak, no forced positivity, no emoji spam.

Hard rules — never break these:
- Never manipulate, guilt, pressure, or use dark patterns to keep someone engaged.
- Never pretend to remember something that wasn't actually provided to you in this conversation or the context below. If you don't have it, say you don't know or ask.
- Never diagnose a mental health condition, medical condition, or disorder.
- Never claim to be a therapist, doctor, or licensed professional, or imply your guidance replaces one.
- Never fabricate memories, facts about the person, or events that weren't told to you.
- If you're missing information you'd need to answer well, say plainly that you don't know or don't have that — don't guess and present it as fact.

When someone is in real distress, take it seriously and gently, without diagnosing — you are not their only support and shouldn't act like it.`;

export function buildSystemPrompt(context: ConversationContext): string {
  const facts: string[] = [`The person's name is ${context.displayName}.`];

  if (context.pronouns) facts.push(`Their pronouns: ${context.pronouns}.`);
  if (context.timezone) facts.push(`Their timezone: ${context.timezone}.`);
  if (context.locale) facts.push(`Their locale: ${context.locale}.`);
  facts.push(`Right now it's ${context.currentTimeLabel} for them.`);
  facts.push(
    context.onboardingCompleted
      ? 'They have completed onboarding.'
      : 'They have not yet completed onboarding — keep things gentle and low-pressure.',
  );

  if (context.recentActivityLabels.length > 0) {
    facts.push(`Their recent activity, most recent first: ${context.recentActivityLabels.join('; ')}.`);
  }

  if (context.recentConversationSummaries.length > 0) {
    const summaries = context.recentConversationSummaries
      .map((s) => `"${s.lastMessageExcerpt}"${s.title ? ` (${s.title})` : ''}`)
      .join(' | ');
    facts.push(`They have other recent conversations with you — last messages: ${summaries}.`);
  } else {
    facts.push('This may be one of your first conversations together — do not claim shared history you do not have.');
  }

  facts.push(
    `Their memory preference is "${context.memoryPreference}" and reflection frequency preference is "${context.reflectionFrequency}" — respect this; do not push saving or reflecting on things against their stated preference.`,
  );

  if (context.activeGoalTitles.length > 0) {
    facts.push(
      `Their current goals, most recent first: ${context.activeGoalTitles.join('; ')}. You may acknowledge these naturally if relevant — never invent progress, advice, or a plan for them beyond what they say.`,
    );
  }

  if (context.latestTarotReading) {
    const cards = context.latestTarotReading.cardNames.join(', ');
    facts.push(
      `Their most recent Tarot reading drew: ${cards}.${context.latestTarotReading.interpretation ? ` The reflection already offered for it: "${context.latestTarotReading.interpretation}"` : ''} You may reference this naturally if it comes up — you never draw, re-draw, or reinterpret cards yourself; that already happened deterministically before this conversation.`,
    );
  }

  if (context.latestNumerologyReading) {
    const numbers = context.latestNumerologyReading.values
      .map((v) => `${v.type.replace('_', ' ').toLowerCase()}: ${v.value}${v.isMasterNumber ? ' (Master Number)' : ''}`)
      .join(', ');
    facts.push(
      `Their most recent Numerology reading calculated: ${numbers}.${context.latestNumerologyReading.interpretation ? ` The reflection already offered for it: "${context.latestNumerologyReading.interpretation}"` : ''} You may reference this naturally if it comes up — you never calculate, recalculate, or "correct" a number yourself; those were already computed deterministically before this conversation, and you never state a number that isn't exactly what's listed here.`,
    );
  }

  if (context.latestNatalChart) {
    const bigThree = `Sun in ${context.latestNatalChart.sun}, Moon in ${context.latestNatalChart.moon}${context.latestNatalChart.ascendant ? `, Ascendant in ${context.latestNatalChart.ascendant}` : ' (Ascendant unavailable — birth time not known or an extreme birth latitude)'}`;
    facts.push(
      `Their most recent Natal Chart calculated: ${bigThree}.${context.latestNatalChart.interpretationOverview ? ` The overview already offered for it: "${context.latestNatalChart.interpretationOverview}"` : ''} You may reference this naturally if it comes up — you never calculate, recalculate, or "correct" a placement yourself; the full chart was already computed deterministically before this conversation, and you never state a placement that isn't exactly what's listed here.`,
    );
  }

  return `${BASE_RULES}\n\nWhat you actually know about them right now (do not assume anything beyond this):\n${facts.map((f) => `- ${f}`).join('\n')}`;
}
