/**
 * Landing page copy. Headline, subheadline, CTAs, problem/solution, how-it-works,
 * companion example, memory example, privacy/security lines, one testimonial, and
 * the community one-liner are quoted verbatim from docs/reference Module 5 —
 * "Landing Experience". Where Module 5 describes a section's *intent* without
 * providing exact copy (Trust "We are NOT/We ARE" bullets, two of three
 * testimonials, FAQ answer sentences, the Reports supporting line), copy below is
 * original text written to match the documented tone/content rules — never
 * lorem ipsum, always marked here so it's easy to revisit against real
 * testimonials/FAQ copy later.
 */

export const landingCopy = {
  hero: {
    headline: 'An AI that actually remembers you.',
    headlineHighlight: 'remembers you',
    subheadline:
      "Mệnh Vi starts with a real Tarot draw as a way to get to know you — then carries what it learns forward, conversation after conversation, so you're never starting over.",
    primaryCta: 'Meet your Companion',
    secondaryCta: 'See how it works',
  },
  trust: {
    notTitle: 'We are NOT',
    not: ['A horoscope app', 'A generic AI chatbot', 'A therapy app', 'A social network'],
    areTitle: 'We ARE',
    are: [
      'An AI Companion that remembers what you share',
      'A reflection practice, starting with a real Tarot draw',
      'Private by default, yours to export or delete anytime',
    ],
  },
  problem: {
    lines: [
      'Horoscope apps forget you the moment you close them.',
      "Chatbots don't have a reason to ask what really matters.",
    ],
  },
  solution: {
    text: 'Mệnh Vi starts with a real Tarot draw and carries what you share forward. Every conversation adds to what your Companion knows. Nothing is lost between visits.',
  },
  howItWorks: {
    steps: [
      {
        number: 1,
        text: 'Start with a real Tarot draw, Numerology reading, Natal Chart, or Eastern Horoscope calculation.',
      },
      { number: 2, text: 'Talk it through with your Companion.' },
      { number: 3, text: 'Come back — it remembers, and the picture gets clearer.' },
    ],
  },
  discoverySystems: [
    { title: 'Tarot', description: 'A real, deterministic 78-card draw — live today.', comingSoon: false, href: '/discover/tarot' },
    {
      title: 'Natal Chart',
      description: 'A real, deterministic birth chart calculated from your birth date, time, and place — live today.',
      comingSoon: false,
      href: '/discover/natal-chart',
    },
    {
      title: 'Eastern Horoscope',
      description: 'A real, deterministic Chinese Zodiac and Five Elements calculation — live today.',
      comingSoon: false,
      href: '/discover/eastern-horoscope',
    },
    {
      title: 'Numerology',
      description: 'The numbers already in your life, given a second look — no number ever chosen or invented by AI.',
      comingSoon: false,
      href: '/discover/numerology',
    },
  ],
  // Module 5 describes this section's shape (a short, credible 2-3 message
  // exchange) without providing exact copy — the example dialogue below is the
  // one given directly in the Sprint 1 brief, reused here since it fits the
  // doc's tone rules and stays thematically consistent with the Memory section's
  // "job change" example just below it.
  companion: {
    label: 'AI Companion',
    exampleUser: "I don't know what to do.",
    exampleCompanion:
      'A year ago, you told me you felt exactly the same before changing jobs. What feels different now?',
    memoryLabel: 'Memory from Nov 3, 2023',
  },
  memory: {
    text: 'Three weeks ago, someone told their Companion they were nervous about a job change. This week, without being asked, it brought it up again — because it remembered.',
  },
  reportsLine:
    'Once you have a Natal Chart and Numerology reading, your Personal Destiny Report brings them together into one long-form narrative — a Premium feature, ready today.',
  communityLine: 'As more people reflect, patterns emerge — always anonymized, never a public feed.',
  security: {
    privacy: 'your journal is private by default, and you can export or delete everything, anytime',
    security: 'encrypted, never sold, never used to train on without consent',
  },
  testimonials: [
    { quote: "I didn't expect it to actually bring that up again.", attribution: 'Early user' },
    { quote: 'It felt less like an app and more like someone who was actually listening.', attribution: 'Early user' },
    { quote: "The tarot pull was the doorway — the conversations are why I stayed.", attribution: 'Early user' },
  ],
  pricing: {
    free: {
      name: 'Free',
      description: 'Full Discovery access, and a Companion that remembers within each conversation.',
    },
    premium: {
      name: 'Premium',
      description:
        'A one-time, 30-day pass — not a subscription. Memory across every conversation, higher Discovery limits, unlimited reading history, and your Personal Destiny Report.',
    },
    // Pre-Live Product Experience Completion Audit finding #7: no exact price is shown pre-login.
    // The real price lives only in backend config (`PREMIUM_PRICE_VND`, single source of truth) and
    // is currently explicitly disclosed there as `isMvpTestPrice: true` — unvalidated, not yet
    // finalized. Advertising an explicitly-unfinalized number on public marketing copy risks
    // publishing a price that changes before launch. Until it's finalized, the honest choice is to
    // be transparent about pricing *structure* (one-time, 30-day, no subscription) and exactly where
    // the real number is shown — not to duplicate or fetch a number that isn't final yet. Revisit
    // once the price is signed off (see docs/architecture/premium-entitlements.md).
    priceNote: 'See the exact current price — free to look, no card required — right after you sign up.',
    cta: 'Meet your Companion',
  },
  faq: [
    {
      question: 'Is this a horoscope app?',
      answer:
        "No. A real Tarot draw is how Mệnh Vi starts getting to know you — not what it sells you. The Companion and its memory of you are the actual product.",
    },
    {
      question: 'Is my data private?',
      answer:
        'Yes. Your journal and conversations are private by default. You can export or delete everything, anytime.',
    },
    {
      question: 'Is this therapy?',
      answer:
        "No. Mệnh Vi is a reflection companion, not a clinical or medical service, and it doesn't diagnose or treat anything.",
    },
    {
      question: 'What does Premium actually add?',
      answer:
        'Persistent memory across every conversation, not just today’s, higher Discovery limits, and your Personal Destiny Report — a long-form reading built from your Natal Chart and Numerology.',
    },
  ],
  finalCta: {
    text: 'An AI that actually remembers you.',
    cta: 'Meet your Companion',
  },
  footer: {
    productLinks: [
      { label: 'How it works', href: '#how-it-works' },
      { label: 'Discovery', href: '#discovery' },
      { label: 'Pricing', href: '#pricing' },
    ],
    companyLinks: [{ label: 'About', href: '/about' }],
    legalLinks: [
      { label: 'Privacy', href: '/privacy' },
      { label: 'Terms', href: '/terms' },
      { label: 'Contact', href: '/contact' },
    ],
    copyright: `© ${new Date().getFullYear()} Mệnh Vi. All rights reserved.`,
  },
} as const;
