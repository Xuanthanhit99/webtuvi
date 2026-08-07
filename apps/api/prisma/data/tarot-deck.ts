/**
 * The complete, real, 78-card traditional Tarot deck — no placeholders, no AI-generated content.
 * Upright/reversed meanings and keyword sets are original text grounded in traditional Rider-
 * Waite-Smith-descended Tarot symbolism (public-domain/traditional knowledge used industry-wide,
 * not copied from any single copyrighted source). Elemental/astrological correspondences follow
 * the standard Golden Dawn attribution system. See docs/architecture/tarot-discovery.md.
 *
 * Consumed by prisma/seed-tarot.ts (upsert on `slug`) and by the draw engine's own unit tests
 * (imported directly, never re-typed) so the deck data has exactly one source of truth.
 */

export type TarotArcanaSeed = 'MAJOR' | 'MINOR';
export type TarotSuitSeed = 'WANDS' | 'CUPS' | 'SWORDS' | 'PENTACLES' | null;

export interface TarotCardSeed {
  slug: string;
  name: string;
  arcana: TarotArcanaSeed;
  suit: TarotSuitSeed;
  number: number;
  uprightKeywords: string[];
  uprightMeaning: string;
  reversedKeywords: string[];
  reversedMeaning: string;
  element: string | null;
  astrological: string | null;
  categories: string[];
  imageSlug: string;
}

const MAJOR_ARCANA: TarotCardSeed[] = [
  {
    slug: 'major-00-the-fool', name: 'The Fool', arcana: 'MAJOR', suit: null, number: 0,
    uprightKeywords: ['new beginnings', 'spontaneity', 'innocence', 'a leap of faith', 'free spirit'],
    uprightMeaning: 'A fresh start with no fixed script yet — an invitation to step forward with an open mind, trusting the process before every detail is known.',
    reversedKeywords: ['recklessness', 'naivety', 'poor judgment', 'hesitation'],
    reversedMeaning: 'Leaping without looking, or the opposite — staying frozen at the edge out of fear, missing a beginning that was ready to be taken.',
    element: 'Air', astrological: 'Uranus',
    categories: ['new-beginnings', 'change', 'self-reflection'], imageSlug: 'major-00-the-fool',
  },
  {
    slug: 'major-01-the-magician', name: 'The Magician', arcana: 'MAJOR', suit: null, number: 1,
    uprightKeywords: ['manifestation', 'resourcefulness', 'willpower', 'inspired action'],
    uprightMeaning: 'All the tools are already at hand — the moment favors turning intention into action with focus and skill.',
    reversedKeywords: ['manipulation', 'poor planning', 'untapped potential', 'deception'],
    reversedMeaning: 'Talent or resources going unused, or being aimed at the wrong end — a gap between what you say and what you actually do.',
    element: null, astrological: 'Mercury',
    categories: ['career', 'creativity', 'growth'], imageSlug: 'major-01-the-magician',
  },
  {
    slug: 'major-02-the-high-priestess', name: 'The High Priestess', arcana: 'MAJOR', suit: null, number: 2,
    uprightKeywords: ['intuition', 'mystery', 'the subconscious', 'inner knowing', 'stillness'],
    uprightMeaning: 'A quiet, receptive kind of knowing that hasn’t become words yet — trust what’s felt beneath the surface as much as what’s said aloud.',
    reversedKeywords: ['secrets withheld', 'disconnection', 'repressed feelings'],
    reversedMeaning: 'Talking yourself out of what you already sense, or information being kept back — from yourself or by someone else.',
    element: null, astrological: 'Moon',
    categories: ['self-reflection', 'spirituality', 'intuition'], imageSlug: 'major-02-the-high-priestess',
  },
  {
    slug: 'major-03-the-empress', name: 'The Empress', arcana: 'MAJOR', suit: null, number: 3,
    uprightKeywords: ['abundance', 'nurturing', 'creativity', 'fertility', 'sensuality'],
    uprightMeaning: 'Something is ready to grow — a project, a relationship, a part of yourself — given warmth, patience, and room to develop in its own time.',
    reversedKeywords: ['creative block', 'over-dependence', 'neglect', 'smothering'],
    reversedMeaning: 'Care tipping into control, or self-neglect from giving everything to others — the nurturing has lost its balance.',
    element: null, astrological: 'Venus',
    categories: ['creativity', 'family', 'growth', 'home'], imageSlug: 'major-03-the-empress',
  },
  {
    slug: 'major-04-the-emperor', name: 'The Emperor', arcana: 'MAJOR', suit: null, number: 4,
    uprightKeywords: ['authority', 'structure', 'stability', 'discipline'],
    uprightMeaning: 'Order and a clear framework are what the situation needs — steady leadership, including leading yourself.',
    reversedKeywords: ['rigidity', 'domination', 'lack of discipline', 'coldness'],
    reversedMeaning: 'Control used too heavily, or not enough structure at all — either way, the balance between order and flexibility has slipped.',
    element: null, astrological: 'Aries',
    categories: ['career', 'stability', 'leadership'], imageSlug: 'major-04-the-emperor',
  },
  {
    slug: 'major-05-the-hierophant', name: 'The Hierophant', arcana: 'MAJOR', suit: null, number: 5,
    uprightKeywords: ['tradition', 'institutions', 'guidance', 'shared belief'],
    uprightMeaning: 'Established wisdom, mentorship, or a conventional path has real value here — learning the existing structure before departing from it.',
    reversedKeywords: ['questioning convention', 'restriction', 'unconventional paths'],
    reversedMeaning: 'Outgrowing a tradition, institution, or belief that no longer fits — or feeling boxed in by a rule that deserves to be questioned.',
    element: null, astrological: 'Taurus',
    categories: ['spirituality', 'growth', 'stability'], imageSlug: 'major-05-the-hierophant',
  },
  {
    slug: 'major-06-the-lovers', name: 'The Lovers', arcana: 'MAJOR', suit: null, number: 6,
    uprightKeywords: ['love', 'harmony', 'alignment of values', 'a meaningful choice'],
    uprightMeaning: 'A relationship or decision built on genuine alignment — two things (or people) fitting together honestly, not by convenience.',
    reversedKeywords: ['disharmony', 'imbalance', 'misaligned values', 'indecision'],
    reversedMeaning: 'A relationship or choice pulled in two directions at once — values that look aligned on the surface but aren’t underneath.',
    element: null, astrological: 'Gemini',
    categories: ['love', 'relationships', 'choices'], imageSlug: 'major-06-the-lovers',
  },
  {
    slug: 'major-07-the-chariot', name: 'The Chariot', arcana: 'MAJOR', suit: null, number: 7,
    uprightKeywords: ['willpower', 'determination', 'victory', 'staying the course'],
    uprightMeaning: 'Two opposing forces held under one steady hand — momentum and focus carrying something through to a real win.',
    reversedKeywords: ['lack of direction', 'aggression', 'loss of control'],
    reversedMeaning: 'Pulling in two directions at once with nothing steering — effort spent without the focus to actually get anywhere.',
    element: null, astrological: 'Cancer',
    categories: ['career', 'growth', 'success'], imageSlug: 'major-07-the-chariot',
  },
  {
    slug: 'major-08-strength', name: 'Strength', arcana: 'MAJOR', suit: null, number: 8,
    uprightKeywords: ['courage', 'patience', 'compassion', 'quiet inner strength'],
    uprightMeaning: 'Real strength here looks like gentleness and patience, not force — meeting something difficult (in yourself or outside it) with steady compassion.',
    reversedKeywords: ['self-doubt', 'insecurity', 'lack of self-control'],
    reversedMeaning: 'Reaching for force or control because the quieter, steadier kind of strength feels out of reach right now.',
    element: null, astrological: 'Leo',
    categories: ['self-reflection', 'growth', 'health'], imageSlug: 'major-08-strength',
  },
  {
    slug: 'major-09-the-hermit', name: 'The Hermit', arcana: 'MAJOR', suit: null, number: 9,
    uprightKeywords: ['introspection', 'solitude', 'inner guidance', 'soul-searching'],
    uprightMeaning: 'A season for stepping back and looking inward — the answer being sought is found alone, not in the noise.',
    reversedKeywords: ['isolation', 'loneliness', 'avoidance'],
    reversedMeaning: 'Solitude that has tipped into isolation — withdrawing from others as a way of avoiding something rather than understanding it.',
    element: null, astrological: 'Virgo',
    categories: ['self-reflection', 'spirituality'], imageSlug: 'major-09-the-hermit',
  },
  {
    slug: 'major-10-wheel-of-fortune', name: 'Wheel of Fortune', arcana: 'MAJOR', suit: null, number: 10,
    uprightKeywords: ['cycles', 'turning points', 'change', 'fate'],
    uprightMeaning: 'Circumstances are shifting on their own momentum — a natural turning point, not something to force or resist.',
    reversedKeywords: ['resistance to change', 'a difficult cycle', 'feeling unlucky'],
    reversedMeaning: 'Fighting a change that’s already underway, or feeling like the cycle keeps repeating the same difficult pattern.',
    element: null, astrological: 'Jupiter',
    categories: ['change', 'growth'], imageSlug: 'major-10-wheel-of-fortune',
  },
  {
    slug: 'major-11-justice', name: 'Justice', arcana: 'MAJOR', suit: null, number: 11,
    uprightKeywords: ['fairness', 'truth', 'cause and effect', 'accountability'],
    uprightMeaning: 'A situation calling for honesty and clear-eyed accountability — actions and their real consequences, looked at plainly.',
    reversedKeywords: ['unfairness', 'avoiding accountability', 'imbalance'],
    reversedMeaning: 'Something out of balance — a truth being avoided, or consequences not yet being faced honestly.',
    element: null, astrological: 'Libra',
    categories: ['choices', 'career', 'self-reflection'], imageSlug: 'major-11-justice',
  },
  {
    slug: 'major-12-the-hanged-man', name: 'The Hanged Man', arcana: 'MAJOR', suit: null, number: 12,
    uprightKeywords: ['surrender', 'a new perspective', 'letting go', 'pause'],
    uprightMeaning: 'Progress by pausing, not pushing — choosing to see a situation from an entirely different angle before acting.',
    reversedKeywords: ['stalling', 'resistance', 'needless sacrifice'],
    reversedMeaning: 'Stuck in the pause rather than learning from it — delay for its own sake, or giving something up that didn’t need to be given up.',
    element: 'Water', astrological: 'Neptune',
    categories: ['self-reflection', 'change'], imageSlug: 'major-12-the-hanged-man',
  },
  {
    slug: 'major-13-death', name: 'Death', arcana: 'MAJOR', suit: null, number: 13,
    uprightKeywords: ['endings', 'transformation', 'letting go', 'rebirth'],
    uprightMeaning: 'A real ending that clears the way for something new — rarely comfortable, but rarely optional either.',
    reversedKeywords: ['resistance to change', 'stagnation', 'fear of endings'],
    reversedMeaning: 'Holding onto something past its natural end, which keeps the next chapter from being able to start.',
    element: null, astrological: 'Scorpio',
    categories: ['change', 'loss', 'growth'], imageSlug: 'major-13-death',
  },
  {
    slug: 'major-14-temperance', name: 'Temperance', arcana: 'MAJOR', suit: null, number: 14,
    uprightKeywords: ['balance', 'moderation', 'patience', 'blending opposites'],
    uprightMeaning: 'Two different things brought into a working balance through patience — nothing rushed, nothing forced.',
    reversedKeywords: ['imbalance', 'excess', 'impatience'],
    reversedMeaning: 'Pulled toward one extreme or another — patience running out, or two parts of a situation refusing to reconcile.',
    element: null, astrological: 'Sagittarius',
    categories: ['self-reflection', 'health', 'relationships'], imageSlug: 'major-14-temperance',
  },
  {
    slug: 'major-15-the-devil', name: 'The Devil', arcana: 'MAJOR', suit: null, number: 15,
    uprightKeywords: ['restriction', 'attachment', 'the shadow self', 'old patterns'],
    uprightMeaning: 'A pattern, habit, or attachment that feels heavier than it needs to — worth naming honestly, since the chain is often looser than it looks.',
    reversedKeywords: ['breaking free', 'reclaiming power', 'releasing a pattern'],
    reversedMeaning: 'Recognizing a limiting pattern clearly enough to start loosening its hold — awareness as the first real step out.',
    element: null, astrological: 'Capricorn',
    categories: ['self-reflection', 'growth', 'health'], imageSlug: 'major-15-the-devil',
  },
  {
    slug: 'major-16-the-tower', name: 'The Tower', arcana: 'MAJOR', suit: null, number: 16,
    uprightKeywords: ['sudden upheaval', 'revelation', 'disruption', 'awakening'],
    uprightMeaning: 'A structure built on a shaky foundation coming apart suddenly — disruptive, but often clearing ground that needed clearing.',
    reversedKeywords: ['delayed change', 'fear of change', 'internal upheaval'],
    reversedMeaning: 'The same upheaval happening more slowly, or internally, or being held off through avoidance rather than met directly.',
    element: null, astrological: 'Mars',
    categories: ['change', 'loss'], imageSlug: 'major-16-the-tower',
  },
  {
    slug: 'major-17-the-star', name: 'The Star', arcana: 'MAJOR', suit: null, number: 17,
    uprightKeywords: ['hope', 'inspiration', 'renewal', 'faith'],
    uprightMeaning: 'A quiet return of hope after a hard stretch — not a guarantee, but a genuine reason to keep going.',
    reversedKeywords: ['despair', 'disconnection', 'self-doubt'],
    reversedMeaning: 'Hope feeling out of reach right now — worth naming that honestly rather than forcing optimism that isn’t there yet.',
    element: null, astrological: 'Aquarius',
    categories: ['hope', 'self-reflection', 'spirituality'], imageSlug: 'major-17-the-star',
  },
  {
    slug: 'major-18-the-moon', name: 'The Moon', arcana: 'MAJOR', suit: null, number: 18,
    uprightKeywords: ['illusion', 'intuition', 'the subconscious', 'uncertainty'],
    uprightMeaning: 'Not everything is clear yet — a time to move carefully and trust intuition over incomplete information.',
    reversedKeywords: ['releasing fear', 'clarity emerging', 'confusion lifting'],
    reversedMeaning: 'The fog beginning to lift — fears that felt large in the dark starting to look more manageable in the light.',
    element: null, astrological: 'Pisces',
    categories: ['self-reflection', 'intuition', 'uncertainty'], imageSlug: 'major-18-the-moon',
  },
  {
    slug: 'major-19-the-sun', name: 'The Sun', arcana: 'MAJOR', suit: null, number: 19,
    uprightKeywords: ['joy', 'success', 'vitality', 'clarity'],
    uprightMeaning: 'A genuinely bright stretch — clarity, energy, and something to feel good about without needing to qualify it.',
    reversedKeywords: ['temporary setback', 'overconfidence', 'clouded positivity'],
    reversedMeaning: 'The good feeling is there but not quite in full — a delay, or positivity that’s overselling itself a little.',
    element: null, astrological: 'The Sun',
    categories: ['success', 'health', 'hope'], imageSlug: 'major-19-the-sun',
  },
  {
    slug: 'major-20-judgement', name: 'Judgement', arcana: 'MAJOR', suit: null, number: 20,
    uprightKeywords: ['reckoning', 'awakening', 'inner calling', 'renewal'],
    uprightMeaning: 'A moment of honest self-evaluation — looking clearly at where things stand and answering a call to change course.',
    reversedKeywords: ['self-doubt', 'avoiding reflection', 'harsh self-judgment'],
    reversedMeaning: 'Either judging yourself too harshly to hear the actual message, or avoiding the self-reflection altogether.',
    element: 'Fire', astrological: 'Pluto',
    categories: ['self-reflection', 'change', 'growth'], imageSlug: 'major-20-judgement',
  },
  {
    slug: 'major-21-the-world', name: 'The World', arcana: 'MAJOR', suit: null, number: 21,
    uprightKeywords: ['completion', 'fulfillment', 'wholeness', 'accomplishment'],
    uprightMeaning: 'A cycle reaching genuine completion — something finished well, with the sense of a full circle closing.',
    reversedKeywords: ['incompletion', 'delay', 'unfinished business'],
    reversedMeaning: 'Close to completion but not quite there — one loose thread left before the circle can actually close.',
    element: null, astrological: 'Saturn',
    categories: ['success', 'growth', 'change'], imageSlug: 'major-21-the-world',
  },
];

interface MinorRankSeed {
  rank: number;
  name: string;
  uprightKeywords: string[];
  uprightMeaning: string;
  reversedKeywords: string[];
  reversedMeaning: string;
  categories: string[];
}

const WANDS_RANKS: MinorRankSeed[] = [
  { rank: 1, name: 'Ace of Wands', uprightKeywords: ['inspiration', 'new spark', 'potential'], uprightMeaning: 'A fresh burst of creative or professional inspiration, right at the start — the potential is real, even if the shape isn’t fully formed yet.', reversedKeywords: ['delays', 'lack of motivation', 'a missed spark'], reversedMeaning: 'The spark is there but stalled — motivation slow to catch, or an opportunity not quite acted on in time.', categories: ['career', 'creativity', 'new-beginnings'] },
  { rank: 2, name: 'Two of Wands', uprightKeywords: ['planning', 'future vision', 'personal power'], uprightMeaning: 'Standing at the edge of a bigger plan, weighing options with a real sense of what’s possible from here.', reversedKeywords: ['fear of the unknown', 'playing it too safe', 'poor planning'], reversedMeaning: 'Hesitating to commit to the bigger vision — comfort winning out over a step that’s actually ready to be taken.', categories: ['career', 'choices', 'growth'] },
  { rank: 3, name: 'Three of Wands', uprightKeywords: ['expansion', 'foresight', 'looking ahead'], uprightMeaning: 'Early efforts starting to pay off, with a clear view of where things are headed next.', reversedKeywords: ['delays', 'lack of foresight', 'obstacles'], reversedMeaning: 'Expansion stalling out — plans that looked solid running into unexpected obstacles.', categories: ['career', 'growth'] },
  { rank: 4, name: 'Four of Wands', uprightKeywords: ['celebration', 'harmony', 'homecoming'], uprightMeaning: 'A genuine milestone worth marking — stability and community coming together around something worked for.', reversedKeywords: ['lack of support', 'transition', 'conflict at home'], reversedMeaning: 'A celebration that feels premature, or a homecoming complicated by unresolved tension.', categories: ['family', 'home', 'success'] },
  { rank: 5, name: 'Five of Wands', uprightKeywords: ['conflict', 'competition', 'tension'], uprightMeaning: 'Competing energies or opinions clashing openly — not necessarily hostile, but genuinely unresolved.', reversedKeywords: ['avoiding conflict', 'inner conflict', 'resolution'], reversedMeaning: 'Tension being avoided rather than worked through, or a conflict finally starting to settle.', categories: ['conflict', 'career'] },
  { rank: 6, name: 'Six of Wands', uprightKeywords: ['victory', 'recognition', 'confidence'], uprightMeaning: 'Real, visible success — effort that’s paid off and is being recognized by others, not just felt privately.', reversedKeywords: ['setback', 'lack of recognition', 'self-doubt'], reversedMeaning: 'A win that isn’t landing the way it should — recognition withheld, or confidence quietly slipping.', categories: ['success', 'career'] },
  { rank: 7, name: 'Seven of Wands', uprightKeywords: ['perseverance', 'standing your ground', 'defense'], uprightMeaning: 'Holding a position under real pressure — the effort to defend what’s been built is worth it.', reversedKeywords: ['overwhelm', 'giving up', 'exhaustion'], reversedMeaning: 'The pressure has become too much to keep holding — exhaustion winning out over persistence.', categories: ['conflict', 'career', 'growth'] },
  { rank: 8, name: 'Eight of Wands', uprightKeywords: ['swift action', 'momentum', 'alignment'], uprightMeaning: 'Things moving quickly now, in the right direction — a moment to act without overthinking.', reversedKeywords: ['delays', 'frustration', 'slowing down'], reversedMeaning: 'Momentum that was building has stalled — frustration at a pace that suddenly feels too slow.', categories: ['career', 'change'] },
  { rank: 9, name: 'Nine of Wands', uprightKeywords: ['resilience', 'persistence', 'boundaries'], uprightMeaning: 'Tired but still standing — close enough to the goal that stopping now would waste everything already given.', reversedKeywords: ['exhaustion', 'defensiveness', 'giving up near the end'], reversedMeaning: 'The resilience has worn thin — guardedness or fatigue making it hard to see how close the finish actually is.', categories: ['growth', 'health', 'career'] },
  { rank: 10, name: 'Ten of Wands', uprightKeywords: ['burden', 'responsibility', 'overload'], uprightMeaning: 'Carrying more than feels sustainable — real accomplishment, but at the cost of being stretched thin.', reversedKeywords: ['releasing burdens', 'delegating', 'burnout'], reversedMeaning: 'The load has become too heavy to keep carrying alone — a real need to set some of it down.', categories: ['career', 'health'] },
  { rank: 11, name: 'Page of Wands', uprightKeywords: ['exploration', 'enthusiasm', 'new ideas'], uprightMeaning: 'Curious, eager energy toward something new — more about the excitement of possibility than a finished plan.', reversedKeywords: ['lack of direction', 'procrastination', 'scattered energy'], reversedMeaning: 'Enthusiasm without follow-through — ideas that haven’t found a direction to move in yet.', categories: ['creativity', 'new-beginnings'] },
  { rank: 12, name: 'Knight of Wands', uprightKeywords: ['adventure', 'passion', 'bold action'], uprightMeaning: 'Confident, fast-moving energy toward a goal — passion translated directly into action.', reversedKeywords: ['recklessness', 'haste', 'scattered energy'], reversedMeaning: 'Passion outrunning judgment — moving fast in a direction that hasn’t been fully thought through.', categories: ['career', 'change'] },
  { rank: 13, name: 'Queen of Wands', uprightKeywords: ['confidence', 'independence', 'warmth'], uprightMeaning: 'Self-assured, warm leadership — comfortable taking up space and encouraging others to do the same.', reversedKeywords: ['insecurity', 'jealousy', 'self-doubt'], reversedMeaning: 'Confidence that’s been shaken — comparing and coming up short instead of standing in your own strength.', categories: ['leadership', 'self-reflection'] },
  { rank: 14, name: 'King of Wands', uprightKeywords: ['leadership', 'vision', 'boldness'], uprightMeaning: 'Big-picture leadership with the confidence to act on it — vision paired with the will to see it through.', reversedKeywords: ['impulsiveness', 'ruthlessness', 'high expectations'], reversedMeaning: 'Vision without patience — pushing ahead in a way that leaves others (or the plan itself) behind.', categories: ['leadership', 'career'] },
];

const CUPS_RANKS: MinorRankSeed[] = [
  { rank: 1, name: 'Ace of Cups', uprightKeywords: ['new love', 'emotional beginning', 'compassion'], uprightMeaning: 'An open heart at the start of something — new love, deepened connection, or a genuine emotional fresh start.', reversedKeywords: ['emotional block', 'repressed feelings', 'emptiness'], reversedMeaning: 'Feelings held back rather than let in — an emotional opening that hasn’t quite happened yet.', categories: ['love', 'relationships', 'new-beginnings'] },
  { rank: 2, name: 'Two of Cups', uprightKeywords: ['partnership', 'mutual attraction', 'connection'], uprightMeaning: 'A genuine two-way connection — mutual respect and attraction meeting in the middle.', reversedKeywords: ['imbalance', 'disconnection', 'broken communication'], reversedMeaning: 'A connection that’s become one-sided, or communication that’s stopped flowing both ways.', categories: ['love', 'relationships'] },
  { rank: 3, name: 'Three of Cups', uprightKeywords: ['friendship', 'celebration', 'community'], uprightMeaning: 'Joy shared with others — friendship, community, and a moment genuinely worth celebrating together.', reversedKeywords: ['overindulgence', 'gossip', 'isolation'], reversedMeaning: 'Celebration tipping into excess, or a community that’s become a source of gossip rather than support.', categories: ['relationships', 'community'] },
  { rank: 4, name: 'Four of Cups', uprightKeywords: ['apathy', 'contemplation', 'missed opportunity'], uprightMeaning: 'A kind of emotional flatness — turned inward enough that a real opportunity nearby is easy to miss.', reversedKeywords: ['renewed interest', 'awareness', 'motivation returning'], reversedMeaning: 'The apathy starting to lift — motivation and interest slowly finding their way back.', categories: ['self-reflection', 'choices'] },
  { rank: 5, name: 'Five of Cups', uprightKeywords: ['loss', 'regret', 'grief'], uprightMeaning: 'Grief or disappointment that’s real and deserves acknowledgment — while something remains standing nearby, even if it’s hard to see right now.', reversedKeywords: ['acceptance', 'moving on', 'finding peace'], reversedMeaning: 'Beginning to make peace with a loss — grief loosening its grip enough to look forward again.', categories: ['loss', 'self-reflection'] },
  { rank: 6, name: 'Six of Cups', uprightKeywords: ['nostalgia', 'childhood memories', 'reunion'], uprightMeaning: 'Warmth from the past resurfacing — an old connection, memory, or simpler time offering comfort.', reversedKeywords: ['living in the past', 'unrealistic nostalgia', 'stuck looking backward'], reversedMeaning: 'Nostalgia that’s become a way of avoiding the present, rather than a source of comfort within it.', categories: ['family', 'self-reflection'] },
  { rank: 7, name: 'Seven of Cups', uprightKeywords: ['choices', 'fantasy', 'wishful thinking'], uprightMeaning: 'Many appealing options on the table — worth being honest about which are real and which are wishful thinking.', reversedKeywords: ['clarity', 'focused choice', 'cutting through illusion'], reversedMeaning: 'The fog of too many options clearing — one real choice coming into focus.', categories: ['choices', 'creativity'] },
  { rank: 8, name: 'Eight of Cups', uprightKeywords: ['walking away', 'seeking deeper meaning', 'disillusionment'], uprightMeaning: 'Leaving something behind that no longer satisfies, in search of something that actually will.', reversedKeywords: ['fear of moving on', 'stagnation', 'avoidance'], reversedMeaning: 'Knowing it’s time to walk away, but staying anyway out of fear of what leaving might mean.', categories: ['change', 'self-reflection'] },
  { rank: 9, name: 'Nine of Cups', uprightKeywords: ['satisfaction', 'contentment', 'gratitude'], uprightMeaning: 'A genuine sense of having enough — contentment that’s been earned, not just wished for.', reversedKeywords: ['overindulgence', 'unfulfilled desires', 'smugness'], reversedMeaning: 'Satisfaction that’s more surface than substance — chasing more without noticing what’s already enough.', categories: ['success', 'health'] },
  { rank: 10, name: 'Ten of Cups', uprightKeywords: ['emotional fulfillment', 'family harmony', 'lasting happiness'], uprightMeaning: 'A deep, lasting kind of happiness — the people around you and the life you’ve built feeling genuinely aligned.', reversedKeywords: ['broken harmony', 'unrealistic expectations', 'disharmony'], reversedMeaning: 'A picture of happiness that looks right from outside but doesn’t quite feel that way from within.', categories: ['family', 'love', 'home'] },
  { rank: 11, name: 'Page of Cups', uprightKeywords: ['emotional beginnings', 'curiosity', 'sensitivity'], uprightMeaning: 'An openhearted, curious approach to feelings — willing to be moved by something new.', reversedKeywords: ['emotional immaturity', 'insecurity', 'unrealistic ideas'], reversedMeaning: 'Sensitivity that’s tipped into moodiness, or feelings not yet matched by the maturity to handle them.', categories: ['love', 'creativity'] },
  { rank: 12, name: 'Knight of Cups', uprightKeywords: ['romance', 'charm', 'idealism'], uprightMeaning: 'Following the heart with genuine charm and idealism — leading with feeling rather than calculation.', reversedKeywords: ['moodiness', 'unrealistic expectations', 'disappointment'], reversedMeaning: 'Idealism running ahead of reality — expectations set too high for what’s actually there.', categories: ['love', 'relationships'] },
  { rank: 13, name: 'Queen of Cups', uprightKeywords: ['compassion', 'emotional security', 'intuition'], uprightMeaning: 'Deep emotional intelligence, offered generously — a steady, compassionate presence for others.', reversedKeywords: ['emotional insecurity', 'overwhelm', 'martyrdom'], reversedMeaning: 'Giving so much emotional care to others that there’s little left for yourself.', categories: ['relationships', 'self-reflection'] },
  { rank: 14, name: 'King of Cups', uprightKeywords: ['emotional balance', 'diplomacy', 'wisdom'], uprightMeaning: 'Calm command of strong feelings — wisdom that comes from having made peace with the full emotional range.', reversedKeywords: ['emotional manipulation', 'moodiness', 'volatility'], reversedMeaning: 'Emotional control slipping — moodiness or manipulation standing in for the balance that’s usually there.', categories: ['relationships', 'leadership'] },
];

const SWORDS_RANKS: MinorRankSeed[] = [
  { rank: 1, name: 'Ace of Swords', uprightKeywords: ['clarity', 'breakthrough', 'truth'], uprightMeaning: 'A moment of real mental clarity — a truth or idea cutting cleanly through confusion.', reversedKeywords: ['confusion', 'miscommunication', 'clouded judgment'], reversedMeaning: 'The clarity hasn’t arrived yet — thinking clouded, or a message getting lost in translation.', categories: ['choices', 'career'] },
  { rank: 2, name: 'Two of Swords', uprightKeywords: ['indecision', 'stalemate', 'a difficult choice'], uprightMeaning: 'Caught between two options, deliberately not choosing yet — sometimes a real pause is needed before deciding.', reversedKeywords: ['indecision resolved', 'information overload', 'forced choice'], reversedMeaning: 'The stalemate breaking, one way or another — often because avoiding the choice has stopped being possible.', categories: ['choices'] },
  { rank: 3, name: 'Three of Swords', uprightKeywords: ['heartbreak', 'grief', 'painful truth'], uprightMeaning: 'A real, sharp emotional pain — the kind that comes from a truth or loss that can’t be softened.', reversedKeywords: ['healing', 'forgiveness', 'releasing pain'], reversedMeaning: 'The sharp edge of the pain beginning to soften — forgiveness or healing starting to take hold.', categories: ['loss', 'love', 'self-reflection'] },
  { rank: 4, name: 'Four of Swords', uprightKeywords: ['rest', 'recovery', 'contemplation'], uprightMeaning: 'A deliberate pause to recover — rest that’s necessary, not a retreat from what matters.', reversedKeywords: ['burnout', 'restlessness', 'forced rest'], reversedMeaning: 'Rest that’s being resisted, or forced by exhaustion that’s gone unacknowledged too long.', categories: ['health', 'self-reflection'] },
  { rank: 5, name: 'Five of Swords', uprightKeywords: ['conflict', 'winning at a cost', 'tension'], uprightMeaning: 'A win that costs more than it’s worth — conflict where being right matters less than what’s lost along the way.', reversedKeywords: ['reconciliation', 'letting go of conflict', 'remorse'], reversedMeaning: 'Willingness to step back from a fight that was never going to end well for anyone.', categories: ['conflict', 'relationships'] },
  { rank: 6, name: 'Six of Swords', uprightKeywords: ['transition', 'moving on', 'leaving hardship behind'], uprightMeaning: 'Moving away from a difficult period, even if the destination isn’t fully clear yet — forward motion after a hard stretch.', reversedKeywords: ['resistance to change', 'unresolved issues', 'feeling stuck'], reversedMeaning: 'Wanting to move on but still tethered to unresolved parts of what’s being left behind.', categories: ['change', 'growth'] },
  { rank: 7, name: 'Seven of Swords', uprightKeywords: ['deception', 'strategy', 'going it alone'], uprightMeaning: 'Acting under the radar — sometimes a necessary strategy, sometimes a shortcut worth questioning.', reversedKeywords: ['coming clean', 'exposed deceit', 'guilt'], reversedMeaning: 'Something hidden coming to light — a moment to come clean rather than keep covering ground.', categories: ['conflict', 'career'] },
  { rank: 8, name: 'Eight of Swords', uprightKeywords: ['restriction', 'self-imposed limits', 'feeling trapped'], uprightMeaning: 'Feeling boxed in by a situation that, on closer look, has more room to move than it first appears.', reversedKeywords: ['release', 'new perspective', 'regaining control'], reversedMeaning: 'Recognizing that the trap was more a story than a wall — and starting to step out of it.', categories: ['self-reflection', 'growth'] },
  { rank: 9, name: 'Nine of Swords', uprightKeywords: ['anxiety', 'worry', 'mental anguish'], uprightMeaning: 'Real anxiety, often worse in the middle of the night than the situation warrants in daylight — worth naming rather than carrying alone.', reversedKeywords: ['releasing fear', 'hope after despair', 'reaching out'], reversedMeaning: 'The worst of the worry starting to lift, sometimes because it’s finally been shared with someone.', categories: ['health', 'self-reflection'] },
  { rank: 10, name: 'Ten of Swords', uprightKeywords: ['painful ending', 'rock bottom', 'a hard truth'], uprightMeaning: 'A difficult, clear ending — painful, but with nowhere further down to go from here.', reversedKeywords: ['recovery', 'resisting an ending', 'gradual healing'], reversedMeaning: 'Beginning to recover from the worst of it, even if resistance to accepting the ending lingers.', categories: ['loss', 'change'] },
  { rank: 11, name: 'Page of Swords', uprightKeywords: ['curiosity', 'mental energy', 'vigilance'], uprightMeaning: 'Alert, curious, and quick to notice details — mentally engaged and ready to learn.', reversedKeywords: ['gossip', 'scattered thoughts', 'all talk, no action'], reversedMeaning: 'Mental energy scattered into gossip or overthinking rather than aimed at something useful.', categories: ['career', 'creativity'] },
  { rank: 12, name: 'Knight of Swords', uprightKeywords: ['ambition', 'drive', 'fast, assertive action'], uprightMeaning: 'Moving fast and directly toward a goal, driven by conviction more than caution.', reversedKeywords: ['recklessness', 'impulsiveness', 'burnout'], reversedMeaning: 'Speed without direction — action taken so quickly it outruns good judgment.', categories: ['career', 'conflict'] },
  { rank: 13, name: 'Queen of Swords', uprightKeywords: ['independence', 'clear thinking', 'honesty'], uprightMeaning: 'Direct, honest communication backed by clear, independent thinking — no illusions, no sugarcoating.', reversedKeywords: ['coldness', 'harsh judgment', 'bitterness'], reversedMeaning: 'Honesty that’s curdled into coldness — clarity used to wound rather than to clarify.', categories: ['relationships', 'self-reflection'] },
  { rank: 14, name: 'King of Swords', uprightKeywords: ['authority', 'truth', 'intellectual clarity'], uprightMeaning: 'Leadership grounded in clear thinking and fairness — decisions made on facts, not feelings alone.', reversedKeywords: ['manipulation', 'abuse of power', 'cold logic'], reversedMeaning: 'Intellect and authority used to manipulate or dominate rather than to genuinely clarify.', categories: ['leadership', 'career'] },
];

const PENTACLES_RANKS: MinorRankSeed[] = [
  { rank: 1, name: 'Ace of Pentacles', uprightKeywords: ['new opportunity', 'prosperity', 'security'], uprightMeaning: 'A tangible new opportunity — practical, grounded, and worth taking seriously.', reversedKeywords: ['missed opportunity', 'poor planning', 'scarcity mindset'], reversedMeaning: 'An opportunity that slipped by, often from planning too little or hesitating too long.', categories: ['career', 'money', 'new-beginnings'] },
  { rank: 2, name: 'Two of Pentacles', uprightKeywords: ['balance', 'adaptability', 'juggling priorities'], uprightMeaning: 'Managing multiple demands at once with real flexibility — not effortless, but manageable.', reversedKeywords: ['overwhelm', 'disorganization', 'dropped priorities'], reversedMeaning: 'Too many things in the air at once — the balance has genuinely slipped.', categories: ['career', 'money'] },
  { rank: 3, name: 'Three of Pentacles', uprightKeywords: ['collaboration', 'skill', 'craftsmanship'], uprightMeaning: 'Good work built with others, each contributing real skill toward something worth making well.', reversedKeywords: ['poor teamwork', 'misalignment', 'mediocrity'], reversedMeaning: 'Collaboration that isn’t clicking — effort going in without the coordination to make it count.', categories: ['career', 'creativity'] },
  { rank: 4, name: 'Four of Pentacles', uprightKeywords: ['security', 'control', 'holding on'], uprightMeaning: 'Holding tightly to what’s been earned — security that’s understandable, even if it’s starting to feel rigid.', reversedKeywords: ['letting go', 'generosity', 'loosening control'], reversedMeaning: 'Starting to loosen the grip on control or possessions — generosity returning.', categories: ['money', 'self-reflection'] },
  { rank: 5, name: 'Five of Pentacles', uprightKeywords: ['hardship', 'financial loss', 'insecurity'], uprightMeaning: 'A genuinely hard stretch, materially or otherwise — worth remembering that support does exist nearby, even if it’s hard to see.', reversedKeywords: ['recovery', 'support found', 'improving circumstances'], reversedMeaning: 'The hardship starting to ease — help arriving, or circumstances slowly turning around.', categories: ['money', 'health'] },
  { rank: 6, name: 'Six of Pentacles', uprightKeywords: ['generosity', 'giving and receiving', 'balance'], uprightMeaning: 'A healthy exchange — giving and receiving support in a way that feels fair to both sides.', reversedKeywords: ['strings attached', 'one-sided giving', 'debt'], reversedMeaning: 'Generosity that comes with conditions, or an exchange that’s become lopsided.', categories: ['money', 'relationships'] },
  { rank: 7, name: 'Seven of Pentacles', uprightKeywords: ['patience', 'long-term view', 'assessment'], uprightMeaning: 'Taking stock of effort already invested and deciding, patiently, whether and how to keep going.', reversedKeywords: ['impatience', 'lack of reward', 'wasted effort'], reversedMeaning: 'Impatience for results that haven’t come yet, or effort that hasn’t paid off the way it should have.', categories: ['career', 'growth'] },
  { rank: 8, name: 'Eight of Pentacles', uprightKeywords: ['mastery', 'dedication', 'skill-building'], uprightMeaning: 'Steady, focused effort toward genuine skill — the kind of practice that compounds over time.', reversedKeywords: ['perfectionism', 'lack of focus', 'mediocrity'], reversedMeaning: 'Effort scattered, or perfectionism getting in the way of the steady progress that would actually help.', categories: ['career', 'growth', 'creativity'] },
  { rank: 9, name: 'Nine of Pentacles', uprightKeywords: ['abundance', 'independence', 'self-sufficiency'], uprightMeaning: 'A comfortable, self-made kind of independence — enjoying what’s been built through your own steady effort.', reversedKeywords: ['overextension', 'financial setback', 'dependence'], reversedMeaning: 'The independence feeling shakier than it looks — overextended, or leaning on others more than usual.', categories: ['money', 'success'] },
  { rank: 10, name: 'Ten of Pentacles', uprightKeywords: ['legacy', 'family', 'long-term success'], uprightMeaning: 'Something built to last — family, wealth, or a legacy that extends well beyond the immediate moment.', reversedKeywords: ['family conflict', 'instability', 'loss of legacy'], reversedMeaning: 'The foundation feeling less stable than it should — family tension or instability undermining what was built.', categories: ['family', 'money', 'home'] },
  { rank: 11, name: 'Page of Pentacles', uprightKeywords: ['new opportunity', 'ambition', 'studiousness'], uprightMeaning: 'A practical new opportunity approached with real curiosity and a willingness to learn.', reversedKeywords: ['procrastination', 'lack of progress', 'unrealistic goals'], reversedMeaning: 'Good intentions that haven’t turned into action yet — plans still waiting to actually start.', categories: ['career', 'new-beginnings'] },
  { rank: 12, name: 'Knight of Pentacles', uprightKeywords: ['diligence', 'reliability', 'methodical progress'], uprightMeaning: 'Slow, steady, dependable progress — not flashy, but reliably getting the job done.', reversedKeywords: ['stagnation', 'boredom', 'stubbornness'], reversedMeaning: 'Steadiness that’s tipped into being stuck — routine without the progress it used to bring.', categories: ['career', 'stability'] },
  { rank: 13, name: 'Queen of Pentacles', uprightKeywords: ['nurturing', 'practicality', 'resourcefulness'], uprightMeaning: 'Grounded, practical care — making sure the people and things that matter are genuinely looked after.', reversedKeywords: ['neglect', 'imbalance', 'financial insecurity'], reversedMeaning: 'Care that’s stretched too thin, or practical matters that have quietly gone neglected.', categories: ['home', 'family', 'money'] },
  { rank: 14, name: 'King of Pentacles', uprightKeywords: ['abundance', 'security', 'discipline'], uprightMeaning: 'Steady, disciplined leadership that has built real, lasting material security.', reversedKeywords: ['greed', 'stubbornness', 'poor financial decisions'], reversedMeaning: 'Security pursued at the expense of generosity or flexibility — discipline curdling into rigidity.', categories: ['money', 'leadership'] },
];

function suitToSlugPart(suit: 'WANDS' | 'CUPS' | 'SWORDS' | 'PENTACLES'): string {
  return suit.toLowerCase();
}

function buildSuit(suit: 'WANDS' | 'CUPS' | 'SWORDS' | 'PENTACLES', element: string, ranks: MinorRankSeed[]): TarotCardSeed[] {
  return ranks.map((r) => {
    const paddedRank = String(r.rank).padStart(2, '0');
    const slug = `${suitToSlugPart(suit)}-${paddedRank}-${r.name.toLowerCase().replace(/ /g, '-')}`;
    return {
      slug,
      name: r.name,
      arcana: 'MINOR' as const,
      suit,
      number: r.rank,
      uprightKeywords: r.uprightKeywords,
      uprightMeaning: r.uprightMeaning,
      reversedKeywords: r.reversedKeywords,
      reversedMeaning: r.reversedMeaning,
      element,
      astrological: null,
      categories: r.categories,
      imageSlug: slug,
    };
  });
}

export const TAROT_DECK: TarotCardSeed[] = [
  ...MAJOR_ARCANA,
  ...buildSuit('WANDS', 'Fire', WANDS_RANKS),
  ...buildSuit('CUPS', 'Water', CUPS_RANKS),
  ...buildSuit('SWORDS', 'Air', SWORDS_RANKS),
  ...buildSuit('PENTACLES', 'Earth', PENTACLES_RANKS),
];

if (TAROT_DECK.length !== 78) {
  throw new Error(`TAROT_DECK must contain exactly 78 cards, found ${TAROT_DECK.length}`);
}
