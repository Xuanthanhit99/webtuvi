/**
 * The complete, real, 78-card traditional Tarot deck — no placeholders, no AI-generated content.
 * Upright/reversed meanings and keyword sets are original text grounded in traditional Rider-
 * Waite-Smith-descended Tarot symbolism (public-domain/traditional knowledge used industry-wide,
 * not copied from any single copyrighted source). Elemental/astrological correspondences follow
 * the standard Golden Dawn attribution system. See docs/architecture/tarot-discovery.md.
 *
 * Tarot 78-Card Completion pass — added `nameVi` (Vietnamese display name, English `name`/`slug`
 * remain canonical identity), `reflectionPrompts`, and four topic-framed meaning fields
 * (love/career/finance/self). Every addition is original text grounded in the same card's own
 * already-established upright meaning — never a separate invented reading, never a deterministic-
 * outcome claim ("you will...", "this guarantees..."). See
 * docs/audit/tarot-78-card-completion-audit.md for the full authoring discipline and scope record.
 *
 * Consumed by prisma/seed-tarot.ts (upsert on `slug`) and by the draw engine's own unit tests
 * (imported directly, never re-typed) so the deck data has exactly one source of truth.
 */

export const TAROT_DECK_VERSION = 'tarot-v1-78';

export type TarotArcanaSeed = 'MAJOR' | 'MINOR';
export type TarotSuitSeed = 'WANDS' | 'CUPS' | 'SWORDS' | 'PENTACLES' | null;

export interface TarotCardSeed {
  slug: string;
  name: string;
  nameVi: string;
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
  reflectionPrompts: string[];
  loveMeaning: string;
  careerMeaning: string;
  financeMeaning: string;
  selfMeaning: string;
  deckVersion: string;
}

interface MajorArcanaSeed {
  slug: string;
  name: string;
  nameVi: string;
  number: number;
  uprightKeywords: string[];
  uprightMeaning: string;
  reversedKeywords: string[];
  reversedMeaning: string;
  element: string | null;
  astrological: string | null;
  categories: string[];
  reflectionPrompts: string[];
  loveMeaning: string;
  careerMeaning: string;
  financeMeaning: string;
  selfMeaning: string;
}

const MAJOR_ARCANA_SEED: MajorArcanaSeed[] = [
  {
    slug: 'major-00-the-fool', name: 'The Fool', nameVi: 'Kẻ Khờ', number: 0,
    uprightKeywords: ['new beginnings', 'spontaneity', 'innocence', 'a leap of faith', 'free spirit'],
    uprightMeaning: 'A fresh start with no fixed script yet — an invitation to step forward with an open mind, trusting the process before every detail is known.',
    reversedKeywords: ['recklessness', 'naivety', 'poor judgment', 'hesitation'],
    reversedMeaning: 'Leaping without looking, or the opposite — staying frozen at the edge out of fear, missing a beginning that was ready to be taken.',
    element: 'Air', astrological: 'Uranus', categories: ['new-beginnings', 'change', 'self-reflection'],
    reflectionPrompts: ['What would you try if you trusted yourself a little more right now?', 'Where are you waiting for certainty that may never fully arrive?', 'What does "starting before you feel ready" actually look like here?'],
    loveMeaning: 'A new connection or a fresh, lighter chapter in an existing one — worth approaching openly rather than guarded.',
    careerMeaning: 'A genuinely new professional direction or opportunity, best met with curiosity rather than an over-prepared plan.',
    financeMeaning: 'A fresh financial start or a first step into something untested — promising, but worth a basic plan before leaping.',
    selfMeaning: 'An invitation to trust your own instincts and step into the unknown part of your own story.',
  },
  {
    slug: 'major-01-the-magician', name: 'The Magician', nameVi: 'Pháp Sư', number: 1,
    uprightKeywords: ['manifestation', 'resourcefulness', 'willpower', 'inspired action'],
    uprightMeaning: 'All the tools are already at hand — the moment favors turning intention into action with focus and skill.',
    reversedKeywords: ['manipulation', 'poor planning', 'untapped potential', 'deception'],
    reversedMeaning: 'Talent or resources going unused, or being aimed at the wrong end — a gap between what you say and what you actually do.',
    element: null, astrological: 'Mercury', categories: ['career', 'creativity', 'growth'],
    reflectionPrompts: ['What resource do you already have that you haven’t fully used yet?', 'Where does your intention need to become a concrete first action?', 'Is there a gap between what you say you want and what you’re actually doing?'],
    loveMeaning: 'The tools for real connection — honesty, effort, initiative — are already there if you choose to use them.',
    careerMeaning: 'A strong moment to act on a skill or plan you already have rather than waiting for more preparation.',
    financeMeaning: 'A practical opportunity to put existing resources or skills to productive, focused use.',
    selfMeaning: 'A reminder that you have more capability at hand right now than you may be giving yourself credit for.',
  },
  {
    slug: 'major-02-the-high-priestess', name: 'The High Priestess', nameVi: 'Nữ Tư Tế', number: 2,
    uprightKeywords: ['intuition', 'mystery', 'the subconscious', 'inner knowing', 'stillness'],
    uprightMeaning: 'A quiet, receptive kind of knowing that hasn’t become words yet — trust what’s felt beneath the surface as much as what’s said aloud.',
    reversedKeywords: ['secrets withheld', 'disconnection', 'repressed feelings'],
    reversedMeaning: 'Talking yourself out of what you already sense, or information being kept back — from yourself or by someone else.',
    element: null, astrological: 'Moon', categories: ['self-reflection', 'spirituality', 'intuition'],
    reflectionPrompts: ['What do you already sense but haven’t let yourself say out loud?', 'Where might quiet and stillness serve you better than more action right now?', 'What is being left unsaid, by you or someone else, in this situation?'],
    loveMeaning: 'Trust the quieter signals in a relationship — what’s felt often carries more truth than what’s said outright.',
    careerMeaning: 'A hunch or instinct about a professional situation is worth taking seriously, even without full proof yet.',
    financeMeaning: 'Before acting, sit with what you already privately sense about the situation rather than rushing a decision.',
    selfMeaning: 'A season for listening inward — the answer is already forming beneath the surface.',
  },
  {
    slug: 'major-03-the-empress', name: 'The Empress', nameVi: 'Nữ Hoàng', number: 3,
    uprightKeywords: ['abundance', 'nurturing', 'creativity', 'fertility', 'sensuality'],
    uprightMeaning: 'Something is ready to grow — a project, a relationship, a part of yourself — given warmth, patience, and room to develop in its own time.',
    reversedKeywords: ['creative block', 'over-dependence', 'neglect', 'smothering'],
    reversedMeaning: 'Care tipping into control, or self-neglect from giving everything to others — the nurturing has lost its balance.',
    element: null, astrological: 'Venus', categories: ['creativity', 'family', 'growth', 'home'],
    reflectionPrompts: ['What in your life is ready to grow if you gave it more patience?', 'Where has caring for others come at the cost of caring for yourself?', 'What would nurturing this situation, rather than forcing it, look like?'],
    loveMeaning: 'Warmth, generosity, and genuine care are what a relationship needs right now — given without losing yourself.',
    careerMeaning: 'A creative or collaborative project benefits from patient nurturing rather than being rushed to completion.',
    financeMeaning: 'Steady, patient growth of what you already have serves you better than a sudden push right now.',
    selfMeaning: 'A reminder to extend the same warmth and care to yourself that you so readily give others.',
  },
  {
    slug: 'major-04-the-emperor', name: 'The Emperor', nameVi: 'Hoàng Đế', number: 4,
    uprightKeywords: ['authority', 'structure', 'stability', 'discipline'],
    uprightMeaning: 'Order and a clear framework are what the situation needs — steady leadership, including leading yourself.',
    reversedKeywords: ['rigidity', 'domination', 'lack of discipline', 'coldness'],
    reversedMeaning: 'Control used too heavily, or not enough structure at all — either way, the balance between order and flexibility has slipped.',
    element: null, astrological: 'Aries', categories: ['career', 'stability', 'leadership'],
    reflectionPrompts: ['Where in your life would a little more structure genuinely help?', 'Are you leading yourself here, or waiting for someone else to?', 'Has control tipped into rigidity somewhere it doesn’t need to?'],
    loveMeaning: 'A relationship benefits from clearer commitments and follow-through, not just good intentions.',
    careerMeaning: 'A moment to lead — set clear structure and hold a steady course rather than drifting.',
    financeMeaning: 'Discipline and a real plan will serve this situation better than improvisation right now.',
    selfMeaning: 'A call to build steadier structure and self-discipline in an area that’s felt ungrounded.',
  },
  {
    slug: 'major-05-the-hierophant', name: 'The Hierophant', nameVi: 'Giáo Hoàng', number: 5,
    uprightKeywords: ['tradition', 'institutions', 'guidance', 'shared belief'],
    uprightMeaning: 'Established wisdom, mentorship, or a conventional path has real value here — learning the existing structure before departing from it.',
    reversedKeywords: ['questioning convention', 'restriction', 'unconventional paths'],
    reversedMeaning: 'Outgrowing a tradition, institution, or belief that no longer fits — or feeling boxed in by a rule that deserves to be questioned.',
    element: null, astrological: 'Taurus', categories: ['spirituality', 'growth', 'stability'],
    reflectionPrompts: ['Is there wisdom from a mentor or tradition worth leaning on right now?', 'Which rule in this situation deserves to be questioned rather than followed?', 'What would learning the existing structure, before changing it, look like?'],
    loveMeaning: 'A relationship may benefit from shared values or a more conventional commitment being named honestly.',
    careerMeaning: 'Mentorship, established process, or professional guidance is worth seeking out before improvising alone.',
    financeMeaning: 'A conventional, well-tested approach serves better here than an untested shortcut.',
    selfMeaning: 'A season for learning from those who’ve walked a similar path before you.',
  },
  {
    slug: 'major-06-the-lovers', name: 'The Lovers', nameVi: 'Tình Nhân', number: 6,
    uprightKeywords: ['love', 'harmony', 'alignment of values', 'a meaningful choice'],
    uprightMeaning: 'A relationship or decision built on genuine alignment — two things (or people) fitting together honestly, not by convenience.',
    reversedKeywords: ['disharmony', 'imbalance', 'misaligned values', 'indecision'],
    reversedMeaning: 'A relationship or choice pulled in two directions at once — values that look aligned on the surface but aren’t underneath.',
    element: null, astrological: 'Gemini', categories: ['love', 'relationships', 'choices'],
    reflectionPrompts: ['Where do your values and this choice genuinely align, or not?', 'What would an honest, unhurried version of this decision look like?', 'Is this relationship built on real alignment, or on convenience?'],
    loveMeaning: 'A meaningful choice about a relationship — worth making from genuine alignment, not pressure.',
    careerMeaning: 'A partnership or decision point that calls for real alignment of goals, not just convenience.',
    financeMeaning: 'A financial choice involving another person works best when both sides’ real priorities are named honestly.',
    selfMeaning: 'A moment to choose what genuinely aligns with your own values, not what looks right from outside.',
  },
  {
    slug: 'major-07-the-chariot', name: 'The Chariot', nameVi: 'Cỗ Xe', number: 7,
    uprightKeywords: ['willpower', 'determination', 'victory', 'staying the course'],
    uprightMeaning: 'Two opposing forces held under one steady hand — momentum and focus carrying something through to a real win.',
    reversedKeywords: ['lack of direction', 'aggression', 'loss of control'],
    reversedMeaning: 'Pulling in two directions at once with nothing steering — effort spent without the focus to actually get anywhere.',
    element: null, astrological: 'Cancer', categories: ['career', 'growth', 'success'],
    reflectionPrompts: ['What two forces are you currently trying to hold together?', 'Where has effort been spent without enough direction behind it?', 'What would staying the course, without forcing it, look like here?'],
    loveMeaning: 'Real progress in a relationship comes from steady, aligned effort from both sides, not force.',
    careerMeaning: 'Focus and determination are carrying a goal within real reach — stay the course.',
    financeMeaning: 'Disciplined, focused effort toward a financial goal is close to paying off.',
    selfMeaning: 'A test of willpower — holding opposing pulls inside yourself under one steady direction.',
  },
  {
    slug: 'major-08-strength', name: 'Strength', nameVi: 'Sức Mạnh', number: 8,
    uprightKeywords: ['courage', 'patience', 'compassion', 'quiet inner strength'],
    uprightMeaning: 'Real strength here looks like gentleness and patience, not force — meeting something difficult (in yourself or outside it) with steady compassion.',
    reversedKeywords: ['self-doubt', 'insecurity', 'lack of self-control'],
    reversedMeaning: 'Reaching for force or control because the quieter, steadier kind of strength feels out of reach right now.',
    element: null, astrological: 'Leo', categories: ['self-reflection', 'growth', 'health'],
    reflectionPrompts: ['Where could patience and gentleness serve you better than force?', 'What would meeting this difficulty with compassion, not control, look like?', 'What is quiet inner strength asking of you right now?'],
    loveMeaning: 'Patience and gentle understanding hold a relationship together more than winning an argument would.',
    careerMeaning: 'A difficult professional situation is better met with calm persistence than confrontation.',
    financeMeaning: 'Steady, patient handling of a financial difficulty serves better than a forceful reaction.',
    selfMeaning: 'A reminder that your quiet, steady resolve is real strength, even when it doesn’t feel dramatic.',
  },
  {
    slug: 'major-09-the-hermit', name: 'The Hermit', nameVi: 'Ẩn Sĩ', number: 9,
    uprightKeywords: ['introspection', 'solitude', 'inner guidance', 'soul-searching'],
    uprightMeaning: 'A season for stepping back and looking inward — the answer being sought is found alone, not in the noise.',
    reversedKeywords: ['isolation', 'loneliness', 'avoidance'],
    reversedMeaning: 'Solitude that has tipped into isolation — withdrawing from others as a way of avoiding something rather than understanding it.',
    element: null, astrological: 'Virgo', categories: ['self-reflection', 'spirituality'],
    reflectionPrompts: ['What might become clearer if you gave yourself real quiet time to think?', 'Is your need for space right now about reflection, or about avoidance?', 'What answer have you been looking for outside that might already be inside?'],
    loveMeaning: 'Some time apart, used for honest reflection rather than avoidance, may clarify what you actually want.',
    careerMeaning: 'A quiet, focused period of independent work suits this moment better than group input.',
    financeMeaning: 'Step back and review your own situation privately before consulting outside opinions.',
    selfMeaning: 'A genuine invitation to withdraw briefly and listen to your own inner guidance.',
  },
  {
    slug: 'major-10-wheel-of-fortune', name: 'Wheel of Fortune', nameVi: 'Bánh Xe Số Mệnh', number: 10,
    uprightKeywords: ['cycles', 'turning points', 'change', 'fate'],
    uprightMeaning: 'Circumstances are shifting on their own momentum — a natural turning point, not something to force or resist.',
    reversedKeywords: ['resistance to change', 'a difficult cycle', 'feeling unlucky'],
    reversedMeaning: 'Fighting a change that’s already underway, or feeling like the cycle keeps repeating the same difficult pattern.',
    element: null, astrological: 'Jupiter', categories: ['change', 'growth'],
    reflectionPrompts: ['What change is already underway that you might be resisting?', 'What pattern keeps repeating, and what would it take to shift it?', 'Where could you work with this turning point instead of against it?'],
    loveMeaning: 'A relationship is entering a natural new phase — flowing with the shift serves better than resisting it.',
    careerMeaning: 'Circumstances are turning in a new direction on their own — timing matters more than force here.',
    financeMeaning: 'A financial cycle is shifting; adapt to the change rather than fighting the timing.',
    selfMeaning: 'A reminder that not every turning point needs to be controlled — some just need to be met.',
  },
  {
    slug: 'major-11-justice', name: 'Justice', nameVi: 'Công Lý', number: 11,
    uprightKeywords: ['fairness', 'truth', 'cause and effect', 'accountability'],
    uprightMeaning: 'A situation calling for honesty and clear-eyed accountability — actions and their real consequences, looked at plainly.',
    reversedKeywords: ['unfairness', 'avoiding accountability', 'imbalance'],
    reversedMeaning: 'Something out of balance — a truth being avoided, or consequences not yet being faced honestly.',
    element: null, astrological: 'Libra', categories: ['choices', 'career', 'self-reflection'],
    reflectionPrompts: ['What truth in this situation deserves to be looked at plainly?', 'Where haven’t you fully owned the consequences of a choice?', 'What would a fair, balanced resolution here actually look like?'],
    loveMeaning: 'Honest accountability from both sides is what fairness in this relationship requires right now.',
    careerMeaning: 'A professional matter calls for a fair, clear-eyed look at facts and consequences, not spin.',
    financeMeaning: 'An honest accounting of the real numbers is overdue before any further decision.',
    selfMeaning: 'A call to look honestly at your own role and its real consequences.',
  },
  {
    slug: 'major-12-the-hanged-man', name: 'The Hanged Man', nameVi: 'Người Treo Ngược', number: 12,
    uprightKeywords: ['surrender', 'a new perspective', 'letting go', 'pause'],
    uprightMeaning: 'Progress by pausing, not pushing — choosing to see a situation from an entirely different angle before acting.',
    reversedKeywords: ['stalling', 'resistance', 'needless sacrifice'],
    reversedMeaning: 'Stuck in the pause rather than learning from it — delay for its own sake, or giving something up that didn’t need to be given up.',
    element: 'Water', astrological: 'Neptune', categories: ['self-reflection', 'change'],
    reflectionPrompts: ['What would this situation look like from a completely different angle?', 'Is this pause helping you see clearly, or just delaying a decision?', 'What are you holding onto that might not actually need holding?'],
    loveMeaning: 'Pausing before reacting, and trying to see the other person’s view, may shift this relationship more than pushing would.',
    careerMeaning: 'A deliberate pause to reconsider your approach may reveal a better path than pressing forward.',
    financeMeaning: 'Hold off on a decision until you can see the situation from a genuinely different angle.',
    selfMeaning: 'A season to let go of forcing outcomes and simply see things differently for a while.',
  },
  {
    slug: 'major-13-death', name: 'Death', nameVi: 'Tử Thần', number: 13,
    uprightKeywords: ['endings', 'transformation', 'letting go', 'rebirth'],
    uprightMeaning: 'A real ending that clears the way for something new — rarely comfortable, but rarely optional either.',
    reversedKeywords: ['resistance to change', 'stagnation', 'fear of endings'],
    reversedMeaning: 'Holding onto something past its natural end, which keeps the next chapter from being able to start.',
    element: null, astrological: 'Scorpio', categories: ['change', 'loss', 'growth'],
    reflectionPrompts: ['What has already ended, even if you haven’t fully accepted it yet?', 'What might become possible once you let this chapter close?', 'Where is holding on costing you more than letting go would?'],
    loveMeaning: 'A relationship or a way of relating is genuinely ending — honoring that clears space for what’s next.',
    careerMeaning: 'A role, project, or approach has run its course; closing it properly opens the next one.',
    financeMeaning: 'A financial habit or arrangement that’s no longer serving you may need to end deliberately.',
    selfMeaning: 'A real transformation is underway — letting the old version of this situation go is part of it.',
  },
  {
    slug: 'major-14-temperance', name: 'Temperance', nameVi: 'Điều Độ', number: 14,
    uprightKeywords: ['balance', 'moderation', 'patience', 'blending opposites'],
    uprightMeaning: 'Two different things brought into a working balance through patience — nothing rushed, nothing forced.',
    reversedKeywords: ['imbalance', 'excess', 'impatience'],
    reversedMeaning: 'Pulled toward one extreme or another — patience running out, or two parts of a situation refusing to reconcile.',
    element: null, astrological: 'Sagittarius', categories: ['self-reflection', 'health', 'relationships'],
    reflectionPrompts: ['What two things in your life need a better balance right now?', 'Where has impatience made a situation harder than it needed to be?', 'What would moderation, instead of an extreme, look like here?'],
    loveMeaning: 'A relationship benefits from patient compromise, blending two different needs rather than one winning out.',
    careerMeaning: 'Balancing competing priorities steadily, rather than favoring one extreme, moves things forward.',
    financeMeaning: 'A moderate, patient approach serves better than either overspending or overly restricting right now.',
    selfMeaning: 'A reminder to find the steady middle path rather than swinging between extremes.',
  },
  {
    slug: 'major-15-the-devil', name: 'The Devil', nameVi: 'Ác Quỷ', number: 15,
    uprightKeywords: ['restriction', 'attachment', 'the shadow self', 'old patterns'],
    uprightMeaning: 'A pattern, habit, or attachment that feels heavier than it needs to — worth naming honestly, since the chain is often looser than it looks.',
    reversedKeywords: ['breaking free', 'reclaiming power', 'releasing a pattern'],
    reversedMeaning: 'Recognizing a limiting pattern clearly enough to start loosening its hold — awareness as the first real step out.',
    element: null, astrological: 'Capricorn', categories: ['self-reflection', 'growth', 'health'],
    reflectionPrompts: ['What pattern or attachment feels heavier than it actually needs to be?', 'What would naming this honestly, without judgment, look like?', 'Where do you have more freedom here than it currently feels like?'],
    loveMeaning: 'An unhealthy pattern in a relationship deserves honest naming rather than being quietly tolerated.',
    careerMeaning: 'A limiting professional habit or dependency is worth examining honestly.',
    financeMeaning: 'A financial habit that feels hard to break is worth naming directly rather than avoiding.',
    selfMeaning: 'A chance to see a self-limiting pattern clearly enough to start loosening its grip.',
  },
  {
    slug: 'major-16-the-tower', name: 'The Tower', nameVi: 'Tòa Tháp', number: 16,
    uprightKeywords: ['sudden upheaval', 'revelation', 'disruption', 'awakening'],
    uprightMeaning: 'A structure built on a shaky foundation coming apart suddenly — disruptive, but often clearing ground that needed clearing.',
    reversedKeywords: ['delayed change', 'fear of change', 'internal upheaval'],
    reversedMeaning: 'The same upheaval happening more slowly, or internally, or being held off through avoidance rather than met directly.',
    element: null, astrological: 'Mars', categories: ['change', 'loss'],
    reflectionPrompts: ['What foundation in your life might not be as stable as it looks?', 'What could this disruption be clearing space for, longer term?', 'Is a slower, internal version of this upheaval already underway?'],
    loveMeaning: 'A sudden, honest reckoning in a relationship — disruptive, but potentially clearing away what wasn’t real.',
    careerMeaning: 'An unstable professional structure may need to fall apart before something sturdier can be built.',
    financeMeaning: 'A shaky financial arrangement may face a sudden correction — better faced directly than delayed.',
    selfMeaning: 'A jarring but real moment of clarity about something you’d been building on shaky ground.',
  },
  {
    slug: 'major-17-the-star', name: 'The Star', nameVi: 'Ngôi Sao', number: 17,
    uprightKeywords: ['hope', 'inspiration', 'renewal', 'faith'],
    uprightMeaning: 'A quiet return of hope after a hard stretch — not a guarantee, but a genuine reason to keep going.',
    reversedKeywords: ['despair', 'disconnection', 'self-doubt'],
    reversedMeaning: 'Hope feeling out of reach right now — worth naming that honestly rather than forcing optimism that isn’t there yet.',
    element: null, astrological: 'Aquarius', categories: ['hope', 'self-reflection', 'spirituality'],
    reflectionPrompts: ['What small sign of hope have you noticed, even if it feels fragile?', 'What would it mean to let yourself feel a little more hopeful right now?', 'Where might renewed faith in yourself change how you approach this?'],
    loveMeaning: 'A genuine, gentle sense of hope is returning to a relationship after a difficult stretch.',
    careerMeaning: 'Renewed inspiration and a fresh sense of possibility are opening up professionally.',
    financeMeaning: 'A hard financial period is easing, with real (if modest) reason for renewed optimism.',
    selfMeaning: 'A quiet, genuine return of hope — worth trusting even if it isn’t a guarantee.',
  },
  {
    slug: 'major-18-the-moon', name: 'The Moon', nameVi: 'Mặt Trăng', number: 18,
    uprightKeywords: ['illusion', 'intuition', 'the subconscious', 'uncertainty'],
    uprightMeaning: 'Not everything is clear yet — a time to move carefully and trust intuition over incomplete information.',
    reversedKeywords: ['releasing fear', 'clarity emerging', 'confusion lifting'],
    reversedMeaning: 'The fog beginning to lift — fears that felt large in the dark starting to look more manageable in the light.',
    element: null, astrological: 'Pisces', categories: ['self-reflection', 'intuition', 'uncertainty'],
    reflectionPrompts: ['What feels unclear right now that intuition might help navigate?', 'Which fear might look smaller once you look at it directly?', 'What would moving carefully, rather than rushing to clarity, look like?'],
    loveMeaning: 'Something in a relationship isn’t fully clear yet — worth moving carefully rather than assuming the worst.',
    careerMeaning: 'A professional situation has more uncertainty than it appears — proceed carefully, trust your gut.',
    financeMeaning: 'Financial information may be incomplete right now — avoid a big decision until it’s clearer.',
    selfMeaning: 'A season of uncertainty that intuition, more than logic, is best suited to navigate.',
  },
  {
    slug: 'major-19-the-sun', name: 'The Sun', nameVi: 'Mặt Trời', number: 19,
    uprightKeywords: ['joy', 'success', 'vitality', 'clarity'],
    uprightMeaning: 'A genuinely bright stretch — clarity, energy, and something to feel good about without needing to qualify it.',
    reversedKeywords: ['temporary setback', 'overconfidence', 'clouded positivity'],
    reversedMeaning: 'The good feeling is there but not quite in full — a delay, or positivity that’s overselling itself a little.',
    element: null, astrological: 'The Sun', categories: ['success', 'health', 'hope'],
    reflectionPrompts: ['What genuinely good thing in your life deserves to be enjoyed without qualification?', 'Where might a little more confidence, honestly earned, serve you well?', 'What would sharing this good energy with someone else look like?'],
    loveMeaning: 'A genuinely warm, joyful stretch in a relationship — worth enjoying openly.',
    careerMeaning: 'A bright, successful period professionally, with real clarity about the path forward.',
    financeMeaning: 'A favorable, clear financial stretch — a good moment to feel confident, not just hopeful.',
    selfMeaning: 'A real, well-earned sense of vitality and clarity about who you are right now.',
  },
  {
    slug: 'major-20-judgement', name: 'Judgement', nameVi: 'Phán Xét', number: 20,
    uprightKeywords: ['reckoning', 'awakening', 'inner calling', 'renewal'],
    uprightMeaning: 'A moment of honest self-evaluation — looking clearly at where things stand and answering a call to change course.',
    reversedKeywords: ['self-doubt', 'avoiding reflection', 'harsh self-judgment'],
    reversedMeaning: 'Either judging yourself too harshly to hear the actual message, or avoiding the self-reflection altogether.',
    element: 'Fire', astrological: 'Pluto', categories: ['self-reflection', 'change', 'growth'],
    reflectionPrompts: ['What honest self-evaluation have you been putting off?', 'What is this moment calling you to change or reconsider?', 'Where might you be judging yourself more harshly than the situation warrants?'],
    loveMeaning: 'A moment to honestly evaluate whether a relationship still reflects who you’ve become.',
    careerMeaning: 'A real reckoning about whether your current path still serves your actual goals.',
    financeMeaning: 'An honest review of past financial choices, without harsh self-judgment, guides the next step.',
    selfMeaning: 'A genuine call to reassess where you stand and answer honestly, without excessive self-criticism.',
  },
  {
    slug: 'major-21-the-world', name: 'The World', nameVi: 'Thế Giới', number: 21,
    uprightKeywords: ['completion', 'fulfillment', 'wholeness', 'accomplishment'],
    uprightMeaning: 'A cycle reaching genuine completion — something finished well, with the sense of a full circle closing.',
    reversedKeywords: ['incompletion', 'delay', 'unfinished business'],
    reversedMeaning: 'Close to completion but not quite there — one loose thread left before the circle can actually close.',
    element: null, astrological: 'Saturn', categories: ['success', 'growth', 'change'],
    reflectionPrompts: ['What cycle in your life is genuinely close to a real completion?', 'What loose thread, if any, still needs tying before it truly closes?', 'What would fully honoring this accomplishment, rather than rushing past it, look like?'],
    loveMeaning: 'A relationship or a chapter within one is reaching a genuine, well-earned sense of completeness.',
    careerMeaning: 'A significant project or goal is reaching real, satisfying completion.',
    financeMeaning: 'A financial goal is close to being fully achieved — a strong position to build the next one from.',
    selfMeaning: 'A genuine sense of wholeness — a full circle closing after real effort.',
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
  reflectionPrompts: string[];
  loveMeaning: string;
  careerMeaning: string;
  financeMeaning: string;
  selfMeaning: string;
}

const WANDS_RANKS: MinorRankSeed[] = [
  { rank: 1, name: 'Ace of Wands', uprightKeywords: ['inspiration', 'new spark', 'potential'], uprightMeaning: 'A fresh burst of creative or professional inspiration, right at the start — the potential is real, even if the shape isn’t fully formed yet.', reversedKeywords: ['delays', 'lack of motivation', 'a missed spark'], reversedMeaning: 'The spark is there but stalled — motivation slow to catch, or an opportunity not quite acted on in time.', categories: ['career', 'creativity', 'new-beginnings'], reflectionPrompts: ['What spark of inspiration have you been sitting on?', 'What’s one small action that would give this idea real momentum?'], loveMeaning: 'A spark of new romantic or creative energy in a relationship, worth acting on.', careerMeaning: 'A genuine new professional idea worth pursuing before the spark fades.', financeMeaning: 'A promising new financial idea or opportunity, still early enough to shape well.', selfMeaning: 'A real burst of motivation worth channeling before it cools.' },
  { rank: 2, name: 'Two of Wands', uprightKeywords: ['planning', 'future vision', 'personal power'], uprightMeaning: 'Standing at the edge of a bigger plan, weighing options with a real sense of what’s possible from here.', reversedKeywords: ['fear of the unknown', 'playing it too safe', 'poor planning'], reversedMeaning: 'Hesitating to commit to the bigger vision — comfort winning out over a step that’s actually ready to be taken.', categories: ['career', 'choices', 'growth'], reflectionPrompts: ['What bigger plan have you been weighing but not committing to?', 'What would taking one concrete step toward it look like?'], loveMeaning: 'Weighing a bigger commitment or shared future — worth naming the vision out loud.', careerMeaning: 'A larger professional plan is forming; the next real step is worth taking.', financeMeaning: 'A bigger financial goal is within reach if you commit to a concrete plan.', selfMeaning: 'A moment to claim your own sense of direction rather than staying comfortable.' },
  { rank: 3, name: 'Three of Wands', uprightKeywords: ['expansion', 'foresight', 'looking ahead'], uprightMeaning: 'Early efforts starting to pay off, with a clear view of where things are headed next.', reversedKeywords: ['delays', 'lack of foresight', 'obstacles'], reversedMeaning: 'Expansion stalling out — plans that looked solid running into unexpected obstacles.', categories: ['career', 'growth'], reflectionPrompts: ['What early effort is starting to show real results?', 'What does the next stage of this plan actually require of you?'], loveMeaning: 'Early efforts in a relationship are paying off, with a clearer shared future ahead.', careerMeaning: 'A professional plan is expanding well — a good time to look further ahead.', financeMeaning: 'An earlier financial decision is starting to pay off as expected.', selfMeaning: 'A confident, forward-looking moment after real groundwork already laid.' },
  { rank: 4, name: 'Four of Wands', uprightKeywords: ['celebration', 'harmony', 'homecoming'], uprightMeaning: 'A genuine milestone worth marking — stability and community coming together around something worked for.', reversedKeywords: ['lack of support', 'transition', 'conflict at home'], reversedMeaning: 'A celebration that feels premature, or a homecoming complicated by unresolved tension.', categories: ['family', 'home', 'success'], reflectionPrompts: ['What milestone deserves to be celebrated, even quietly?', 'Who would you want to share this moment with?'], loveMeaning: 'A relationship milestone genuinely worth marking and celebrating together.', careerMeaning: 'A real professional milestone worth acknowledging before moving to the next goal.', financeMeaning: 'A financial milestone reached — a stable moment worth recognizing.', selfMeaning: 'A genuine sense of arrival and stability worth pausing to appreciate.' },
  { rank: 5, name: 'Five of Wands', uprightKeywords: ['conflict', 'competition', 'tension'], uprightMeaning: 'Competing energies or opinions clashing openly — not necessarily hostile, but genuinely unresolved.', reversedKeywords: ['avoiding conflict', 'inner conflict', 'resolution'], reversedMeaning: 'Tension being avoided rather than worked through, or a conflict finally starting to settle.', categories: ['conflict', 'career'], reflectionPrompts: ['What unresolved tension is asking to be worked through directly?', 'Is this conflict actually about the surface issue, or something underneath it?'], loveMeaning: 'Open disagreement in a relationship that’s better worked through than avoided.', careerMeaning: 'Competing opinions at work need honest airing rather than suppression.', financeMeaning: 'Conflicting priorities around money need a direct conversation to resolve.', selfMeaning: 'An internal tug-of-war worth naming rather than pushing down.' },
  { rank: 6, name: 'Six of Wands', uprightKeywords: ['victory', 'recognition', 'confidence'], uprightMeaning: 'Real, visible success — effort that’s paid off and is being recognized by others, not just felt privately.', reversedKeywords: ['setback', 'lack of recognition', 'self-doubt'], reversedMeaning: 'A win that isn’t landing the way it should — recognition withheld, or confidence quietly slipping.', categories: ['success', 'career'], reflectionPrompts: ['What real success deserves to be acknowledged, including by yourself?', 'Where might quiet self-doubt be undercutting an actual win?'], loveMeaning: 'A relationship or gesture is being genuinely recognized and appreciated.', careerMeaning: 'Visible professional recognition for effort that’s genuinely paid off.', financeMeaning: 'A financial win worth acknowledging — the effort behind it was real.', selfMeaning: 'A moment to let yourself feel genuinely proud, not just relieved.' },
  { rank: 7, name: 'Seven of Wands', uprightKeywords: ['perseverance', 'standing your ground', 'defense'], uprightMeaning: 'Holding a position under real pressure — the effort to defend what’s been built is worth it.', reversedKeywords: ['overwhelm', 'giving up', 'exhaustion'], reversedMeaning: 'The pressure has become too much to keep holding — exhaustion winning out over persistence.', categories: ['conflict', 'career', 'growth'], reflectionPrompts: ['What are you defending that’s genuinely worth the effort?', 'Where has persistence started to tip into exhaustion?'], loveMeaning: 'Standing firm on something that matters to you in a relationship, worth defending clearly.', careerMeaning: 'Holding your position under professional pressure — worth it if the ground is solid.', financeMeaning: 'Defending a financial decision under pressure from others — worth reassessing if exhausting.', selfMeaning: 'A test of resolve — worth checking whether it still serves you.' },
  { rank: 8, name: 'Eight of Wands', uprightKeywords: ['swift action', 'momentum', 'alignment'], uprightMeaning: 'Things moving quickly now, in the right direction — a moment to act without overthinking.', reversedKeywords: ['delays', 'frustration', 'slowing down'], reversedMeaning: 'Momentum that was building has stalled — frustration at a pace that suddenly feels too slow.', categories: ['career', 'change'], reflectionPrompts: ['Where is momentum building that you could act on now?', 'What’s causing the recent slowdown, and is it temporary?'], loveMeaning: 'Fast-moving, aligned energy between two people — a good moment to act, not overthink.', careerMeaning: 'Things are moving quickly in a good direction — act while the momentum holds.', financeMeaning: 'A fast-moving financial opportunity worth acting on without delay.', selfMeaning: 'A rare moment of everything aligning — worth moving with it.' },
  { rank: 9, name: 'Nine of Wands', uprightKeywords: ['resilience', 'persistence', 'boundaries'], uprightMeaning: 'Tired but still standing — close enough to the goal that stopping now would waste everything already given.', reversedKeywords: ['exhaustion', 'defensiveness', 'giving up near the end'], reversedMeaning: 'The resilience has worn thin — guardedness or fatigue making it hard to see how close the finish actually is.', categories: ['growth', 'health', 'career'], reflectionPrompts: ['How close are you actually to the finish line here?', 'What would one more steady push, rather than giving up, look like?'], loveMeaning: 'Tired but still committed — worth one more honest effort before deciding anything.', careerMeaning: 'Close to a professional finish line despite real fatigue — worth the last push.', financeMeaning: 'Close to a financial goal despite the strain — worth persisting a little longer.', selfMeaning: 'A test of resilience — you’re closer to done than it currently feels.' },
  { rank: 10, name: 'Ten of Wands', uprightKeywords: ['burden', 'responsibility', 'overload'], uprightMeaning: 'Carrying more than feels sustainable — real accomplishment, but at the cost of being stretched thin.', reversedKeywords: ['releasing burdens', 'delegating', 'burnout'], reversedMeaning: 'The load has become too heavy to keep carrying alone — a real need to set some of it down.', categories: ['career', 'health'], reflectionPrompts: ['What are you carrying that could reasonably be set down or shared?', 'Is this weight actually necessary, or self-imposed?'], loveMeaning: 'One person is carrying more of the relationship’s weight than feels sustainable.', careerMeaning: 'An unsustainable workload — worth delegating or renegotiating before burnout.', financeMeaning: 'A heavy financial burden that may need restructuring rather than just enduring.', selfMeaning: 'A sign it’s time to set some real weight down, not just carry it further.' },
  { rank: 11, name: 'Page of Wands', uprightKeywords: ['exploration', 'enthusiasm', 'new ideas'], uprightMeaning: 'Curious, eager energy toward something new — more about the excitement of possibility than a finished plan.', reversedKeywords: ['lack of direction', 'procrastination', 'scattered energy'], reversedMeaning: 'Enthusiasm without follow-through — ideas that haven’t found a direction to move in yet.', categories: ['creativity', 'new-beginnings'], reflectionPrompts: ['What new idea has you genuinely excited right now?', 'What would giving that enthusiasm just one concrete direction look like?'], loveMeaning: 'Genuine, eager curiosity about someone or something new in your relationships.', careerMeaning: 'A fresh professional idea worth exploring, even before it’s fully formed.', financeMeaning: 'An early-stage financial idea worth researching before committing.', selfMeaning: 'A curious, playful energy worth following without over-planning it yet.' },
  { rank: 12, name: 'Knight of Wands', uprightKeywords: ['adventure', 'passion', 'bold action'], uprightMeaning: 'Confident, fast-moving energy toward a goal — passion translated directly into action.', reversedKeywords: ['recklessness', 'haste', 'scattered energy'], reversedMeaning: 'Passion outrunning judgment — moving fast in a direction that hasn’t been fully thought through.', categories: ['career', 'change'], reflectionPrompts: ['Where is bold action genuinely called for right now?', 'Is this momentum outrunning your actual judgment on it?'], loveMeaning: 'Bold, passionate energy in pursuing or deepening a relationship.', careerMeaning: 'Confident, fast professional action — worth a quick gut-check before committing fully.', financeMeaning: 'A bold financial move that’s exciting but worth a sanity check first.', selfMeaning: 'A passionate, adventurous pull worth honoring, with a little grounding.' },
  { rank: 13, name: 'Queen of Wands', uprightKeywords: ['confidence', 'independence', 'warmth'], uprightMeaning: 'Self-assured, warm leadership — comfortable taking up space and encouraging others to do the same.', reversedKeywords: ['insecurity', 'jealousy', 'self-doubt'], reversedMeaning: 'Confidence that’s been shaken — comparing and coming up short instead of standing in your own strength.', categories: ['leadership', 'self-reflection'], reflectionPrompts: ['Where could a little more self-assured warmth serve you?', 'What comparison to someone else might be undercutting your own confidence?'], loveMeaning: 'Confident, warm presence in a relationship — comfortable being fully yourself.', careerMeaning: 'Leading with genuine confidence and warmth earns real respect right now.', financeMeaning: 'A confident, independent approach to your own financial decisions serves well.', selfMeaning: 'A reminder of your own genuine self-assurance, not a borrowed one.' },
  { rank: 14, name: 'King of Wands', uprightKeywords: ['leadership', 'vision', 'boldness'], uprightMeaning: 'Big-picture leadership with the confidence to act on it — vision paired with the will to see it through.', reversedKeywords: ['impulsiveness', 'ruthlessness', 'high expectations'], reversedMeaning: 'Vision without patience — pushing ahead in a way that leaves others (or the plan itself) behind.', categories: ['leadership', 'career'], reflectionPrompts: ['What vision are you ready to lead on with real confidence?', 'Are your expectations of others (or yourself) realistic right now?'], loveMeaning: 'Confident, visionary leadership in shaping a relationship’s shared direction.', careerMeaning: 'Bold, big-picture leadership backed by the will to follow through.', financeMeaning: 'A confident, decisive approach to a financial vision, checked against realism.', selfMeaning: 'A moment to lead your own life with real vision and follow-through.' },
];

const CUPS_RANKS: MinorRankSeed[] = [
  { rank: 1, name: 'Ace of Cups', uprightKeywords: ['new love', 'emotional beginning', 'compassion'], uprightMeaning: 'An open heart at the start of something — new love, deepened connection, or a genuine emotional fresh start.', reversedKeywords: ['emotional block', 'repressed feelings', 'emptiness'], reversedMeaning: 'Feelings held back rather than let in — an emotional opening that hasn’t quite happened yet.', categories: ['love', 'relationships', 'new-beginnings'], reflectionPrompts: ['Where is your heart being invited to open right now?', 'What feeling have you been holding back from letting in fully?'], loveMeaning: 'A genuine emotional opening — new love or a deepened connection worth welcoming.', careerMeaning: 'A fulfilling, meaningful new professional connection or start.', financeMeaning: 'A financial decision that feels emotionally, not just practically, right.', selfMeaning: 'A real emotional fresh start, worth letting yourself feel fully.' },
  { rank: 2, name: 'Two of Cups', uprightKeywords: ['partnership', 'mutual attraction', 'connection'], uprightMeaning: 'A genuine two-way connection — mutual respect and attraction meeting in the middle.', reversedKeywords: ['imbalance', 'disconnection', 'broken communication'], reversedMeaning: 'A connection that’s become one-sided, or communication that’s stopped flowing both ways.', categories: ['love', 'relationships'], reflectionPrompts: ['Is this connection genuinely mutual right now?', 'What would restoring two-way communication here look like?'], loveMeaning: 'A genuine, mutual connection meeting in the middle — real partnership energy.', careerMeaning: 'A strong, mutually respectful professional partnership or collaboration.', financeMeaning: 'A shared financial decision that benefits from open, two-way communication.', selfMeaning: 'A reminder to look for real reciprocity, not one-sided effort.' },
  { rank: 3, name: 'Three of Cups', uprightKeywords: ['friendship', 'celebration', 'community'], uprightMeaning: 'Joy shared with others — friendship, community, and a moment genuinely worth celebrating together.', reversedKeywords: ['overindulgence', 'gossip', 'isolation'], reversedMeaning: 'Celebration tipping into excess, or a community that’s become a source of gossip rather than support.', categories: ['relationships', 'community'], reflectionPrompts: ['Who deserves to celebrate this moment with you?', 'Is a community around you offering support, or something less healthy?'], loveMeaning: 'Joy shared openly with friends or loved ones around a relationship.', careerMeaning: 'A collaborative professional success worth celebrating with the team.', financeMeaning: 'A shared financial win, worth acknowledging together rather than alone.', selfMeaning: 'A reminder that joy is often better shared than kept private.' },
  { rank: 4, name: 'Four of Cups', uprightKeywords: ['apathy', 'contemplation', 'missed opportunity'], uprightMeaning: 'A kind of emotional flatness — turned inward enough that a real opportunity nearby is easy to miss.', reversedKeywords: ['renewed interest', 'awareness', 'motivation returning'], reversedMeaning: 'The apathy starting to lift — motivation and interest slowly finding their way back.', categories: ['self-reflection', 'choices'], reflectionPrompts: ['What opportunity nearby might you be too withdrawn to notice?', 'What would re-engaging, even a little, look like right now?'], loveMeaning: 'Emotional flatness that may be causing you to overlook a real connection nearby.', careerMeaning: 'Disengagement that may be masking a real opportunity worth a second look.', financeMeaning: 'Apathy toward your own finances that’s worth a closer, re-engaged look.', selfMeaning: 'A quiet inward turn — worth checking whether it’s rest or avoidance.' },
  { rank: 5, name: 'Five of Cups', uprightKeywords: ['loss', 'regret', 'grief'], uprightMeaning: 'Grief or disappointment that’s real and deserves acknowledgment — while something remains standing nearby, even if it’s hard to see right now.', reversedKeywords: ['acceptance', 'moving on', 'finding peace'], reversedMeaning: 'Beginning to make peace with a loss — grief loosening its grip enough to look forward again.', categories: ['loss', 'self-reflection'], reflectionPrompts: ['What loss deserves honest acknowledgment rather than being pushed past?', 'What is still standing nearby that you haven’t noticed yet?'], loveMeaning: 'A real disappointment in a relationship deserves grieving before moving forward.', careerMeaning: 'A professional setback is real, but not the whole picture — something remains.', financeMeaning: 'A financial loss deserves honest acknowledgment, not denial.', selfMeaning: 'A real grief worth feeling fully before looking for what remains.' },
  { rank: 6, name: 'Six of Cups', uprightKeywords: ['nostalgia', 'childhood memories', 'reunion'], uprightMeaning: 'Warmth from the past resurfacing — an old connection, memory, or simpler time offering comfort.', reversedKeywords: ['living in the past', 'unrealistic nostalgia', 'stuck looking backward'], reversedMeaning: 'Nostalgia that’s become a way of avoiding the present, rather than a source of comfort within it.', categories: ['family', 'self-reflection'], reflectionPrompts: ['What memory or connection from the past is offering real comfort right now?', 'Is looking backward helping you, or keeping you from the present?'], loveMeaning: 'A warm, meaningful reconnection with someone from the past.', careerMeaning: 'A past skill or connection resurfacing as genuinely useful now.', financeMeaning: 'A simpler, earlier approach to money may offer useful perspective now.', selfMeaning: 'A gentle reminder of who you were, worth honoring without living there.' },
  { rank: 7, name: 'Seven of Cups', uprightKeywords: ['choices', 'fantasy', 'wishful thinking'], uprightMeaning: 'Many appealing options on the table — worth being honest about which are real and which are wishful thinking.', reversedKeywords: ['clarity', 'focused choice', 'cutting through illusion'], reversedMeaning: 'The fog of too many options clearing — one real choice coming into focus.', categories: ['choices', 'creativity'], reflectionPrompts: ['Of the options in front of you, which are genuinely real?', 'What would choosing just one, honestly, look like?'], loveMeaning: 'Several romantic possibilities or fantasies — worth being honest about what’s actually real.', careerMeaning: 'Many appealing professional options — worth narrowing to the genuinely viable ones.', financeMeaning: 'Too many financial options at once — worth cutting through to one realistic path.', selfMeaning: 'A moment to separate genuine desire from wishful thinking.' },
  { rank: 8, name: 'Eight of Cups', uprightKeywords: ['walking away', 'seeking deeper meaning', 'disillusionment'], uprightMeaning: 'Leaving something behind that no longer satisfies, in search of something that actually will.', reversedKeywords: ['fear of moving on', 'stagnation', 'avoidance'], reversedMeaning: 'Knowing it’s time to walk away, but staying anyway out of fear of what leaving might mean.', categories: ['change', 'self-reflection'], reflectionPrompts: ['What no longer satisfies you the way it used to?', 'What is fear of the unknown keeping you from walking away from?'], loveMeaning: 'A relationship that no longer feels fulfilling, worth honestly reassessing.', careerMeaning: 'A role or path that’s stopped being satisfying, worth considering leaving.', financeMeaning: 'A financial arrangement that no longer serves your actual goals.', selfMeaning: 'A real pull to leave something behind in search of deeper meaning.' },
  { rank: 9, name: 'Nine of Cups', uprightKeywords: ['satisfaction', 'contentment', 'gratitude'], uprightMeaning: 'A genuine sense of having enough — contentment that’s been earned, not just wished for.', reversedKeywords: ['overindulgence', 'unfulfilled desires', 'smugness'], reversedMeaning: 'Satisfaction that’s more surface than substance — chasing more without noticing what’s already enough.', categories: ['success', 'health'], reflectionPrompts: ['What in your life already feels genuinely like enough?', 'Where might you be chasing more without appreciating what’s here?'], loveMeaning: 'A genuine sense of contentment and satisfaction within a relationship.', careerMeaning: 'A real, earned sense of professional satisfaction worth recognizing.', financeMeaning: 'A genuinely comfortable financial position worth appreciating, not just extending.', selfMeaning: 'An honest, earned sense of having enough right now.' },
  { rank: 10, name: 'Ten of Cups', uprightKeywords: ['emotional fulfillment', 'family harmony', 'lasting happiness'], uprightMeaning: 'A deep, lasting kind of happiness — the people around you and the life you’ve built feeling genuinely aligned.', reversedKeywords: ['broken harmony', 'unrealistic expectations', 'disharmony'], reversedMeaning: 'A picture of happiness that looks right from outside but doesn’t quite feel that way from within.', categories: ['family', 'love', 'home'], reflectionPrompts: ['Where in your life do you feel this kind of deep alignment already?', 'Does this happiness feel real from within, or mostly from outside?'], loveMeaning: 'A deep, lasting sense of harmony and fulfillment in a relationship or family.', careerMeaning: 'Work and life feeling genuinely aligned, not just outwardly successful.', financeMeaning: 'Financial stability that supports real, lasting contentment, not just appearances.', selfMeaning: 'A genuine, deep sense of emotional fulfillment worth recognizing.' },
  { rank: 11, name: 'Page of Cups', uprightKeywords: ['emotional beginnings', 'curiosity', 'sensitivity'], uprightMeaning: 'An openhearted, curious approach to feelings — willing to be moved by something new.', reversedKeywords: ['emotional immaturity', 'insecurity', 'unrealistic ideas'], reversedMeaning: 'Sensitivity that’s tipped into moodiness, or feelings not yet matched by the maturity to handle them.', categories: ['love', 'creativity'], reflectionPrompts: ['What new feeling or connection are you curious to explore?', 'Where might sensitivity need a little more grounding right now?'], loveMeaning: 'An openhearted, curious start to new feelings — worth exploring gently.', careerMeaning: 'A creative, emotionally engaged approach to a new professional idea.', financeMeaning: 'An intuitive, feeling-led approach to a financial choice — worth some grounding too.', selfMeaning: 'A tender, curious openness to your own emotional world.' },
  { rank: 12, name: 'Knight of Cups', uprightKeywords: ['romance', 'charm', 'idealism'], uprightMeaning: 'Following the heart with genuine charm and idealism — leading with feeling rather than calculation.', reversedKeywords: ['moodiness', 'unrealistic expectations', 'disappointment'], reversedMeaning: 'Idealism running ahead of reality — expectations set too high for what’s actually there.', categories: ['love', 'relationships'], reflectionPrompts: ['Where is your heart genuinely leading you right now?', 'Are your expectations here realistic, or a little idealized?'], loveMeaning: 'Genuine romantic charm and idealism — worth pursuing with realistic eyes open.', careerMeaning: 'An idealistic, values-led approach to a professional opportunity.', financeMeaning: 'An emotionally appealing financial choice worth checking against realistic numbers.', selfMeaning: 'A romantic, idealistic pull worth following, with eyes open.' },
  { rank: 13, name: 'Queen of Cups', uprightKeywords: ['compassion', 'emotional security', 'intuition'], uprightMeaning: 'Deep emotional intelligence, offered generously — a steady, compassionate presence for others.', reversedKeywords: ['emotional insecurity', 'overwhelm', 'martyrdom'], reversedMeaning: 'Giving so much emotional care to others that there’s little left for yourself.', categories: ['relationships', 'self-reflection'], reflectionPrompts: ['Who has benefited from your steady emotional presence lately?', 'Is there enough of that same care left over for yourself?'], loveMeaning: 'Deep emotional presence and compassion offered generously to a partner.', careerMeaning: 'Emotional intelligence and steady empathy that genuinely help colleagues.', financeMeaning: 'An intuitive, values-led approach to shared or family finances.', selfMeaning: 'A reminder to offer yourself the same compassion you give others.' },
  { rank: 14, name: 'King of Cups', uprightKeywords: ['emotional balance', 'diplomacy', 'wisdom'], uprightMeaning: 'Calm command of strong feelings — wisdom that comes from having made peace with the full emotional range.', reversedKeywords: ['emotional manipulation', 'moodiness', 'volatility'], reversedMeaning: 'Emotional control slipping — moodiness or manipulation standing in for the balance that’s usually there.', categories: ['relationships', 'leadership'], reflectionPrompts: ['Where could calm, steady emotional leadership help right now?', 'Is your usual emotional balance holding, or slipping a little?'], loveMeaning: 'Calm, emotionally mature leadership within a relationship’s ups and downs.', careerMeaning: 'Steady, diplomatic emotional leadership that earns real trust.', financeMeaning: 'A calm, level-headed approach to a financial decision involving strong feelings.', selfMeaning: 'A genuinely earned emotional steadiness worth trusting.' },
];

const SWORDS_RANKS: MinorRankSeed[] = [
  { rank: 1, name: 'Ace of Swords', uprightKeywords: ['clarity', 'breakthrough', 'truth'], uprightMeaning: 'A moment of real mental clarity — a truth or idea cutting cleanly through confusion.', reversedKeywords: ['confusion', 'miscommunication', 'clouded judgment'], reversedMeaning: 'The clarity hasn’t arrived yet — thinking clouded, or a message getting lost in translation.', categories: ['choices', 'career'], reflectionPrompts: ['What truth is starting to cut through the confusion?', 'What would acting on this new clarity actually look like?'], loveMeaning: 'A clear, honest truth about a relationship coming into focus.', careerMeaning: 'A sharp, clarifying professional idea or decision worth acting on.', financeMeaning: 'A clear-eyed financial insight cutting through prior confusion.', selfMeaning: 'A genuine breakthrough in understanding your own situation.' },
  { rank: 2, name: 'Two of Swords', uprightKeywords: ['indecision', 'stalemate', 'a difficult choice'], uprightMeaning: 'Caught between two options, deliberately not choosing yet — sometimes a real pause is needed before deciding.', reversedKeywords: ['indecision resolved', 'information overload', 'forced choice'], reversedMeaning: 'The stalemate breaking, one way or another — often because avoiding the choice has stopped being possible.', categories: ['choices'], reflectionPrompts: ['What two options are you weighing, and what’s the real cost of waiting?', 'What information would actually help you decide?'], loveMeaning: 'A relationship decision being deliberately avoided — worth naming honestly.', careerMeaning: 'A professional choice being held at a standstill longer than it needs to be.', financeMeaning: 'A financial decision stuck between two options — worth deciding rather than stalling.', selfMeaning: 'An internal stalemate that deserves an honest look, not more avoidance.' },
  { rank: 3, name: 'Three of Swords', uprightKeywords: ['heartbreak', 'grief', 'painful truth'], uprightMeaning: 'A real, sharp emotional pain — the kind that comes from a truth or loss that can’t be softened.', reversedKeywords: ['healing', 'forgiveness', 'releasing pain'], reversedMeaning: 'The sharp edge of the pain beginning to soften — forgiveness or healing starting to take hold.', categories: ['loss', 'love', 'self-reflection'], reflectionPrompts: ['What painful truth deserves to be felt rather than avoided?', 'What would the beginning of healing here look like?'], loveMeaning: 'A real heartbreak or painful truth that deserves to be felt, not minimized.', careerMeaning: 'A difficult professional truth that’s painful but worth facing directly.', financeMeaning: 'A hard financial truth that’s painful to accept but important to face.', selfMeaning: 'A real grief that deserves acknowledgment on the way to healing.' },
  { rank: 4, name: 'Four of Swords', uprightKeywords: ['rest', 'recovery', 'contemplation'], uprightMeaning: 'A deliberate pause to recover — rest that’s necessary, not a retreat from what matters.', reversedKeywords: ['burnout', 'restlessness', 'forced rest'], reversedMeaning: 'Rest that’s being resisted, or forced by exhaustion that’s gone unacknowledged too long.', categories: ['health', 'self-reflection'], reflectionPrompts: ['What would genuine rest, not just a pause, look like right now?', 'Have you been ignoring signs that you need to slow down?'], loveMeaning: 'A relationship benefits from a deliberate pause to recover and reflect.', careerMeaning: 'A real need to rest before the next professional push, not push through it.', financeMeaning: 'A pause in financial decision-making to think clearly, not react.', selfMeaning: 'A genuine, necessary need for rest — worth honoring, not resisting.' },
  { rank: 5, name: 'Five of Swords', uprightKeywords: ['conflict', 'winning at a cost', 'tension'], uprightMeaning: 'A win that costs more than it’s worth — conflict where being right matters less than what’s lost along the way.', reversedKeywords: ['reconciliation', 'letting go of conflict', 'remorse'], reversedMeaning: 'Willingness to step back from a fight that was never going to end well for anyone.', categories: ['conflict', 'relationships'], reflectionPrompts: ['Is winning this actually worth what it might cost?', 'What would stepping back from this conflict look like?'], loveMeaning: 'A conflict where being right may cost more than it’s worth in the relationship.', careerMeaning: 'A professional dispute worth weighing against what a hollow win would cost.', financeMeaning: 'A financial disagreement where “winning” may not be worth the relationship cost.', selfMeaning: 'A reminder that not every fight needs to be won.' },
  { rank: 6, name: 'Six of Swords', uprightKeywords: ['transition', 'moving on', 'leaving hardship behind'], uprightMeaning: 'Moving away from a difficult period, even if the destination isn’t fully clear yet — forward motion after a hard stretch.', reversedKeywords: ['resistance to change', 'unresolved issues', 'feeling stuck'], reversedMeaning: 'Wanting to move on but still tethered to unresolved parts of what’s being left behind.', categories: ['change', 'growth'], reflectionPrompts: ['What difficult period are you genuinely ready to move on from?', 'What unresolved piece is still tethering you to it?'], loveMeaning: 'Moving forward from a difficult period in a relationship, even gradually.', careerMeaning: 'Transitioning away from a hard professional stretch toward calmer ground.', financeMeaning: 'Moving past a difficult financial period, with the worst part behind you.', selfMeaning: 'Real forward motion after a hard stretch, even without full clarity yet.' },
  { rank: 7, name: 'Seven of Swords', uprightKeywords: ['deception', 'strategy', 'going it alone'], uprightMeaning: 'Acting under the radar — sometimes a necessary strategy, sometimes a shortcut worth questioning.', reversedKeywords: ['coming clean', 'exposed deceit', 'guilt'], reversedMeaning: 'Something hidden coming to light — a moment to come clean rather than keep covering ground.', categories: ['conflict', 'career'], reflectionPrompts: ['Is a strategy you’re using genuinely necessary, or a shortcut worth questioning?', 'What would coming clean about this look like?'], loveMeaning: 'Something being kept quiet in a relationship that may be worth coming clean about.', careerMeaning: 'A strategic, low-profile approach at work — worth checking it stays honest.', financeMeaning: 'A financial shortcut worth double-checking before relying on it.', selfMeaning: 'An honest look at whether you’re being fully straightforward with yourself.' },
  { rank: 8, name: 'Eight of Swords', uprightKeywords: ['restriction', 'self-imposed limits', 'feeling trapped'], uprightMeaning: 'Feeling boxed in by a situation that, on closer look, has more room to move than it first appears.', reversedKeywords: ['release', 'new perspective', 'regaining control'], reversedMeaning: 'Recognizing that the trap was more a story than a wall — and starting to step out of it.', categories: ['self-reflection', 'growth'], reflectionPrompts: ['Where do you feel trapped, and how much of that is actually fixed?', 'What would one small step out of this feeling look like?'], loveMeaning: 'A relationship that feels stuck may have more room to move than it seems.', careerMeaning: 'A professional situation that feels boxed in likely has more options than it appears.', financeMeaning: 'A financial situation that feels trapped may have more flexibility than assumed.', selfMeaning: 'A self-imposed limit worth questioning rather than accepting as fixed.' },
  { rank: 9, name: 'Nine of Swords', uprightKeywords: ['anxiety', 'worry', 'mental anguish'], uprightMeaning: 'Real anxiety, often worse in the middle of the night than the situation warrants in daylight — worth naming rather than carrying alone.', reversedKeywords: ['releasing fear', 'hope after despair', 'reaching out'], reversedMeaning: 'The worst of the worry starting to lift, sometimes because it’s finally been shared with someone.', categories: ['health', 'self-reflection'], reflectionPrompts: ['What worry has felt heavier at night than in daylight?', 'Who could you share this worry with, rather than carrying it alone?'], loveMeaning: 'Anxiety about a relationship that may feel larger alone than it would if shared.', careerMeaning: 'Professional worry worth naming to someone rather than carrying silently.', financeMeaning: 'Financial anxiety that’s often worse imagined than the real numbers warrant.', selfMeaning: 'Real worry that deserves to be spoken, not carried alone.' },
  { rank: 10, name: 'Ten of Swords', uprightKeywords: ['painful ending', 'rock bottom', 'a hard truth'], uprightMeaning: 'A difficult, clear ending — painful, but with nowhere further down to go from here.', reversedKeywords: ['recovery', 'resisting an ending', 'gradual healing'], reversedMeaning: 'Beginning to recover from the worst of it, even if resistance to accepting the ending lingers.', categories: ['loss', 'change'], reflectionPrompts: ['What ending, however painful, might actually free you to move forward?', 'What would the first small step toward recovery look like?'], loveMeaning: 'A painful but real ending that, once accepted, allows genuine recovery.', careerMeaning: 'A hard professional ending that clears the way for something better.', financeMeaning: 'A difficult financial low point that marks the bottom, not the ongoing trend.', selfMeaning: 'A hard ending that, painful as it is, has nowhere further down to go.' },
  { rank: 11, name: 'Page of Swords', uprightKeywords: ['curiosity', 'mental energy', 'vigilance'], uprightMeaning: 'Alert, curious, and quick to notice details — mentally engaged and ready to learn.', reversedKeywords: ['gossip', 'scattered thoughts', 'all talk, no action'], reversedMeaning: 'Mental energy scattered into gossip or overthinking rather than aimed at something useful.', categories: ['career', 'creativity'], reflectionPrompts: ['What are you genuinely curious to learn or investigate right now?', 'Is your mental energy focused, or scattered into overthinking?'], loveMeaning: 'Genuine curiosity about getting to know someone more honestly.', careerMeaning: 'Sharp, curious mental energy well suited to learning something new.', financeMeaning: 'Careful research before a financial decision, rather than rushing in.', selfMeaning: 'An alert, curious mind worth pointing at something useful.' },
  { rank: 12, name: 'Knight of Swords', uprightKeywords: ['ambition', 'drive', 'fast, assertive action'], uprightMeaning: 'Moving fast and directly toward a goal, driven by conviction more than caution.', reversedKeywords: ['recklessness', 'impulsiveness', 'burnout'], reversedMeaning: 'Speed without direction — action taken so quickly it outruns good judgment.', categories: ['career', 'conflict'], reflectionPrompts: ['Where is fast, direct action genuinely called for right now?', 'Is this speed outrunning your own good judgment?'], loveMeaning: 'Direct, assertive pursuit of what you want in a relationship — worth some pacing.', careerMeaning: 'Fast, driven professional action, best paired with a quick sanity check.', financeMeaning: 'A fast financial move that could use one more careful look before committing.', selfMeaning: 'Strong drive and conviction, worth channeling rather than rushing.' },
  { rank: 13, name: 'Queen of Swords', uprightKeywords: ['independence', 'clear thinking', 'honesty'], uprightMeaning: 'Direct, honest communication backed by clear, independent thinking — no illusions, no sugarcoating.', reversedKeywords: ['coldness', 'harsh judgment', 'bitterness'], reversedMeaning: 'Honesty that’s curdled into coldness — clarity used to wound rather than to clarify.', categories: ['relationships', 'self-reflection'], reflectionPrompts: ['What honest truth needs to be said clearly, but kindly?', 'Is your clarity here helping, or being used to wound?'], loveMeaning: 'Direct, honest communication is what this relationship needs right now.', careerMeaning: 'Clear, independent thinking that cuts through professional confusion.', financeMeaning: 'A clear-eyed, unsentimental look at the real financial facts.', selfMeaning: 'A call for honest self-assessment, without unnecessary harshness.' },
  { rank: 14, name: 'King of Swords', uprightKeywords: ['authority', 'truth', 'intellectual clarity'], uprightMeaning: 'Leadership grounded in clear thinking and fairness — decisions made on facts, not feelings alone.', reversedKeywords: ['manipulation', 'abuse of power', 'cold logic'], reversedMeaning: 'Intellect and authority used to manipulate or dominate rather than to genuinely clarify.', categories: ['leadership', 'career'], reflectionPrompts: ['What decision here would benefit from clear, fact-based thinking?', 'Is authority being used here to clarify, or to control?'], loveMeaning: 'Fair, clear-headed communication that grounds a relationship’s big decisions.', careerMeaning: 'Fact-based, fair leadership that earns genuine professional trust.', financeMeaning: 'A rational, fact-based approach to an important financial decision.', selfMeaning: 'A call to lead your own decisions with clarity and fairness.' },
];

const PENTACLES_RANKS: MinorRankSeed[] = [
  { rank: 1, name: 'Ace of Pentacles', uprightKeywords: ['new opportunity', 'prosperity', 'security'], uprightMeaning: 'A tangible new opportunity — practical, grounded, and worth taking seriously.', reversedKeywords: ['missed opportunity', 'poor planning', 'scarcity mindset'], reversedMeaning: 'An opportunity that slipped by, often from planning too little or hesitating too long.', categories: ['career', 'money', 'new-beginnings'], reflectionPrompts: ['What tangible new opportunity is in front of you right now?', 'What practical first step would make the most of it?'], loveMeaning: 'A relationship built on a genuinely solid, practical foundation.', careerMeaning: 'A real, grounded new professional opportunity worth taking seriously.', financeMeaning: 'A tangible new financial opportunity, practical and worth pursuing.', selfMeaning: 'A grounded new beginning worth building on carefully.' },
  { rank: 2, name: 'Two of Pentacles', uprightKeywords: ['balance', 'adaptability', 'juggling priorities'], uprightMeaning: 'Managing multiple demands at once with real flexibility — not effortless, but manageable.', reversedKeywords: ['overwhelm', 'disorganization', 'dropped priorities'], reversedMeaning: 'Too many things in the air at once — the balance has genuinely slipped.', categories: ['career', 'money'], reflectionPrompts: ['What are you currently juggling, and is the balance holding?', 'What would need to change to make this more sustainable?'], loveMeaning: 'Balancing a relationship alongside other real priorities in your life.', careerMeaning: 'Juggling multiple professional demands — manageable, but worth monitoring.', financeMeaning: 'Balancing competing financial priorities without dropping any of them.', selfMeaning: 'A test of adaptability — worth checking the balance hasn’t slipped.' },
  { rank: 3, name: 'Three of Pentacles', uprightKeywords: ['collaboration', 'skill', 'craftsmanship'], uprightMeaning: 'Good work built with others, each contributing real skill toward something worth making well.', reversedKeywords: ['poor teamwork', 'misalignment', 'mediocrity'], reversedMeaning: 'Collaboration that isn’t clicking — effort going in without the coordination to make it count.', categories: ['career', 'creativity'], reflectionPrompts: ['What collaboration could genuinely benefit from clearer coordination?', 'What skill are you contributing that deserves more recognition?'], loveMeaning: 'A relationship built well through genuine teamwork and shared effort.', careerMeaning: 'Skilled collaboration producing genuinely good, well-made work.', financeMeaning: 'A shared financial project that benefits from clear coordination.', selfMeaning: 'Pride in real, well-honed skill worth continuing to build.' },
  { rank: 4, name: 'Four of Pentacles', uprightKeywords: ['security', 'control', 'holding on'], uprightMeaning: 'Holding tightly to what’s been earned — security that’s understandable, even if it’s starting to feel rigid.', reversedKeywords: ['letting go', 'generosity', 'loosening control'], reversedMeaning: 'Starting to loosen the grip on control or possessions — generosity returning.', categories: ['money', 'self-reflection'], reflectionPrompts: ['What are you holding onto tightly, and is that still necessary?', 'What would loosening your grip here, even slightly, feel like?'], loveMeaning: 'Holding tightly to control or certainty in a relationship — worth loosening a little.', careerMeaning: 'A cautious, protective stance professionally that may be tipping into rigidity.', financeMeaning: 'Holding tightly to financial security — reasonable, but worth checking it’s not excessive.', selfMeaning: 'A reminder that security doesn’t require gripping this tightly.' },
  { rank: 5, name: 'Five of Pentacles', uprightKeywords: ['hardship', 'financial loss', 'insecurity'], uprightMeaning: 'A genuinely hard stretch, materially or otherwise — worth remembering that support does exist nearby, even if it’s hard to see.', reversedKeywords: ['recovery', 'support found', 'improving circumstances'], reversedMeaning: 'The hardship starting to ease — help arriving, or circumstances slowly turning around.', categories: ['money', 'health'], reflectionPrompts: ['What support might be nearby that’s easy to overlook right now?', 'What’s one small sign that circumstances are starting to ease?'], loveMeaning: 'A hard stretch in a relationship — support may be closer than it feels.', careerMeaning: 'A genuinely difficult professional patch, with help likely available if sought.', financeMeaning: 'A real financial hardship — worth looking for support rather than facing it alone.', selfMeaning: 'A hard stretch that deserves acknowledgment, not isolation.' },
  { rank: 6, name: 'Six of Pentacles', uprightKeywords: ['generosity', 'giving and receiving', 'balance'], uprightMeaning: 'A healthy exchange — giving and receiving support in a way that feels fair to both sides.', reversedKeywords: ['strings attached', 'one-sided giving', 'debt'], reversedMeaning: 'Generosity that comes with conditions, or an exchange that’s become lopsided.', categories: ['money', 'relationships'], reflectionPrompts: ['Is the giving and receiving in this situation genuinely balanced?', 'What would a fairer exchange here look like?'], loveMeaning: 'A relationship where giving and receiving feel genuinely balanced.', careerMeaning: 'Fair, mutual professional support — worth checking it stays balanced.', financeMeaning: 'A financial exchange that should stay fair, without hidden strings.', selfMeaning: 'A reminder to notice whether you give and receive in fair measure.' },
  { rank: 7, name: 'Seven of Pentacles', uprightKeywords: ['patience', 'long-term view', 'assessment'], uprightMeaning: 'Taking stock of effort already invested and deciding, patiently, whether and how to keep going.', reversedKeywords: ['impatience', 'lack of reward', 'wasted effort'], reversedMeaning: 'Impatience for results that haven’t come yet, or effort that hasn’t paid off the way it should have.', categories: ['career', 'growth'], reflectionPrompts: ['What long-term effort deserves an honest progress check right now?', 'Is patience still serving you here, or is it time to adjust course?'], loveMeaning: 'Assessing long-term investment in a relationship with honest patience.', careerMeaning: 'A patient, honest review of a long-term project’s real progress.', financeMeaning: 'Reviewing a long-term financial investment with patience, not impatience.', selfMeaning: 'A moment to honestly assess whether patience is still paying off.' },
  { rank: 8, name: 'Eight of Pentacles', uprightKeywords: ['mastery', 'dedication', 'skill-building'], uprightMeaning: 'Steady, focused effort toward genuine skill — the kind of practice that compounds over time.', reversedKeywords: ['perfectionism', 'lack of focus', 'mediocrity'], reversedMeaning: 'Effort scattered, or perfectionism getting in the way of the steady progress that would actually help.', categories: ['career', 'growth', 'creativity'], reflectionPrompts: ['What skill would genuinely benefit from steady, focused practice?', 'Is perfectionism slowing progress that would otherwise compound?'], loveMeaning: 'Steady, dedicated effort to genuinely understand and grow with a partner.', careerMeaning: 'Focused skill-building that compounds real professional value over time.', financeMeaning: 'Steady, disciplined effort toward a financial skill or goal.', selfMeaning: 'A reminder that steady practice, not perfection, builds real mastery.' },
  { rank: 9, name: 'Nine of Pentacles', uprightKeywords: ['abundance', 'independence', 'self-sufficiency'], uprightMeaning: 'A comfortable, self-made kind of independence — enjoying what’s been built through your own steady effort.', reversedKeywords: ['overextension', 'financial setback', 'dependence'], reversedMeaning: 'The independence feeling shakier than it looks — overextended, or leaning on others more than usual.', categories: ['money', 'success'], reflectionPrompts: ['What have you built through your own steady effort that deserves enjoying?', 'Does your current independence feel as solid as it looks?'], loveMeaning: 'A comfortable independence that lets you show up in a relationship by choice, not need.', careerMeaning: 'A self-made professional standing worth genuinely enjoying.', financeMeaning: 'Comfortable financial independence, earned through steady effort.', selfMeaning: 'A well-earned self-sufficiency worth recognizing and enjoying.' },
  { rank: 10, name: 'Ten of Pentacles', uprightKeywords: ['legacy', 'family', 'long-term success'], uprightMeaning: 'Something built to last — family, wealth, or a legacy that extends well beyond the immediate moment.', reversedKeywords: ['family conflict', 'instability', 'loss of legacy'], reversedMeaning: 'The foundation feeling less stable than it should — family tension or instability undermining what was built.', categories: ['family', 'money', 'home'], reflectionPrompts: ['What are you building that’s meant to last beyond right now?', 'Is the foundation as stable as the long-term goal requires?'], loveMeaning: 'A relationship built with a genuine long-term, lasting foundation in mind.', careerMeaning: 'Professional work contributing to something built to last, not just today.', financeMeaning: 'Long-term financial planning aimed at lasting stability, not short-term gain.', selfMeaning: 'A sense of building something that outlasts the present moment.' },
  { rank: 11, name: 'Page of Pentacles', uprightKeywords: ['new opportunity', 'ambition', 'studiousness'], uprightMeaning: 'A practical new opportunity approached with real curiosity and a willingness to learn.', reversedKeywords: ['procrastination', 'lack of progress', 'unrealistic goals'], reversedMeaning: 'Good intentions that haven’t turned into action yet — plans still waiting to actually start.', categories: ['career', 'new-beginnings'], reflectionPrompts: ['What practical new opportunity are you genuinely curious about?', 'What’s kept a good intention here from becoming real action?'], loveMeaning: 'A grounded, genuine curiosity about building something real with someone.', careerMeaning: 'A practical new opportunity worth approaching with real study and effort.', financeMeaning: 'A grounded new financial goal worth researching before committing.', selfMeaning: 'Genuine ambition paired with a willingness to actually learn.' },
  { rank: 12, name: 'Knight of Pentacles', uprightKeywords: ['diligence', 'reliability', 'methodical progress'], uprightMeaning: 'Slow, steady, dependable progress — not flashy, but reliably getting the job done.', reversedKeywords: ['stagnation', 'boredom', 'stubbornness'], reversedMeaning: 'Steadiness that’s tipped into being stuck — routine without the progress it used to bring.', categories: ['career', 'stability'], reflectionPrompts: ['Where has steady, methodical effort quietly been paying off?', 'Has routine here tipped into stagnation rather than progress?'], loveMeaning: 'Reliable, steady commitment that quietly builds real trust over time.', careerMeaning: 'Methodical, dependable professional progress, even if it isn’t flashy.', financeMeaning: 'Steady, disciplined financial habits that compound reliably.', selfMeaning: 'A quiet reminder that steady effort is real progress, even unglamorously.' },
  { rank: 13, name: 'Queen of Pentacles', uprightKeywords: ['nurturing', 'practicality', 'resourcefulness'], uprightMeaning: 'Grounded, practical care — making sure the people and things that matter are genuinely looked after.', reversedKeywords: ['neglect', 'imbalance', 'financial insecurity'], reversedMeaning: 'Care that’s stretched too thin, or practical matters that have quietly gone neglected.', categories: ['home', 'family', 'money'], reflectionPrompts: ['What practical care are you providing that deserves recognition?', 'Has anything practical quietly gone neglected while caring for others?'], loveMeaning: 'Grounded, practical care that shows love through consistent action.', careerMeaning: 'Resourceful, practical competence that reliably gets things done.', financeMeaning: 'Practical, grounded management of shared or family finances.', selfMeaning: 'A reminder to extend your practical care to yourself too.' },
  { rank: 14, name: 'King of Pentacles', uprightKeywords: ['abundance', 'security', 'discipline'], uprightMeaning: 'Steady, disciplined leadership that has built real, lasting material security.', reversedKeywords: ['greed', 'stubbornness', 'poor financial decisions'], reversedMeaning: 'Security pursued at the expense of generosity or flexibility — discipline curdling into rigidity.', categories: ['money', 'leadership'], reflectionPrompts: ['What lasting security have you built through real discipline?', 'Has that discipline left enough room for generosity and flexibility?'], loveMeaning: 'Steady, dependable provision and security within a relationship.', careerMeaning: 'Disciplined, established professional leadership built on real results.', financeMeaning: 'Real, disciplined financial security built over time — worth maintaining flexibly.', selfMeaning: 'A well-earned sense of stability, worth holding without rigidity.' },
];

function suitToSlugPart(suit: 'WANDS' | 'CUPS' | 'SWORDS' | 'PENTACLES'): string {
  return suit.toLowerCase();
}

/** Minor Arcana Vietnamese names are fully derivable from rank + suit — no per-card authoring
 * needed, and no risk of the "Cups / Cốc / Ly" kind of inconsistency the completion audit
 * specifically checked for, since every card is generated from exactly one lookup table each. */
const SUIT_NAME_VI: Record<'WANDS' | 'CUPS' | 'SWORDS' | 'PENTACLES', string> = {
  WANDS: 'Gậy',
  CUPS: 'Cốc',
  SWORDS: 'Kiếm',
  PENTACLES: 'Tiền',
};

const RANK_NAME_VI: Record<number, string> = {
  1: 'Át', 2: 'Hai', 3: 'Ba', 4: 'Bốn', 5: 'Năm', 6: 'Sáu', 7: 'Bảy', 8: 'Tám', 9: 'Chín', 10: 'Mười',
  11: 'Thị Vệ', 12: 'Kỵ Sĩ', 13: 'Hoàng Hậu', 14: 'Vua',
};

function buildSuit(suit: 'WANDS' | 'CUPS' | 'SWORDS' | 'PENTACLES', element: string, ranks: MinorRankSeed[]): TarotCardSeed[] {
  return ranks.map((r) => {
    const paddedRank = String(r.rank).padStart(2, '0');
    const slug = `${suitToSlugPart(suit)}-${paddedRank}-${r.name.toLowerCase().replace(/ /g, '-')}`;
    return {
      slug,
      name: r.name,
      nameVi: `${RANK_NAME_VI[r.rank]} ${SUIT_NAME_VI[suit]}`,
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
      reflectionPrompts: r.reflectionPrompts,
      loveMeaning: r.loveMeaning,
      careerMeaning: r.careerMeaning,
      financeMeaning: r.financeMeaning,
      selfMeaning: r.selfMeaning,
      deckVersion: TAROT_DECK_VERSION,
    };
  });
}

const MAJOR_ARCANA: TarotCardSeed[] = MAJOR_ARCANA_SEED.map((m) => ({
  slug: m.slug,
  name: m.name,
  nameVi: m.nameVi,
  arcana: 'MAJOR' as const,
  suit: null,
  number: m.number,
  uprightKeywords: m.uprightKeywords,
  uprightMeaning: m.uprightMeaning,
  reversedKeywords: m.reversedKeywords,
  reversedMeaning: m.reversedMeaning,
  element: m.element,
  astrological: m.astrological,
  categories: m.categories,
  imageSlug: m.slug,
  reflectionPrompts: m.reflectionPrompts,
  loveMeaning: m.loveMeaning,
  careerMeaning: m.careerMeaning,
  financeMeaning: m.financeMeaning,
  selfMeaning: m.selfMeaning,
  deckVersion: TAROT_DECK_VERSION,
}));

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

const majorCount = TAROT_DECK.filter((c) => c.arcana === 'MAJOR').length;
if (majorCount !== 22) {
  throw new Error(`TAROT_DECK must contain exactly 22 Major Arcana cards, found ${majorCount}`);
}

for (const suit of ['WANDS', 'CUPS', 'SWORDS', 'PENTACLES'] as const) {
  const count = TAROT_DECK.filter((c) => c.suit === suit).length;
  if (count !== 14) {
    throw new Error(`TAROT_DECK must contain exactly 14 ${suit} cards, found ${count}`);
  }
}

const uniqueSlugs = new Set(TAROT_DECK.map((c) => c.slug));
if (uniqueSlugs.size !== TAROT_DECK.length) {
  throw new Error('TAROT_DECK contains duplicate slugs.');
}

for (const card of TAROT_DECK) {
  if (!card.nameVi.trim()) throw new Error(`TAROT_DECK: ${card.slug} is missing nameVi.`);
  if (card.reflectionPrompts.length < 2 || card.reflectionPrompts.length > 4) {
    throw new Error(`TAROT_DECK: ${card.slug} must have 2-4 reflectionPrompts, found ${card.reflectionPrompts.length}.`);
  }
  if (!card.loveMeaning.trim() || !card.careerMeaning.trim() || !card.financeMeaning.trim() || !card.selfMeaning.trim()) {
    throw new Error(`TAROT_DECK: ${card.slug} is missing a topic meaning.`);
  }
}
