# Tarot 78-Card — Card-Specific Production Prompts

Every entry below is a **CARD-SPECIFIC COMPOSITION** block. The actual generation prompt for any
card is assembled as:

```
GLOBAL_ART_STYLE (docs/design/tarot-image-generation-master-prompt.md)
+
[this card's composition block below]
+
GLOBAL_NEGATIVE_RULES (same file)
+
OUTPUT_CONSTRAINTS (same file)
```

The global blocks are never repeated below — copy them from the master prompt file verbatim each
time, per that document's own explicit instruction. Core symbolism/keywords/tone below are drawn
directly from this card's own already-authored canonical content in
`apps/api/prisma/data/tarot-deck.ts` (never re-invented separately from the product's own meanings).

**78 entries total** (22 Major + 56 Minor). The Star is marked `REFERENCE_ALREADY_APPROVED` — do
not regenerate it.

---

## MAJOR ARCANA (22)

### 0 — The Fool (`major-00-the-fool`)
**Core symbolism:** new beginnings, spontaneity, a leap of faith. **Main subject:** a young
traveler figure, light-footed, mid-step at a cliff's edge, looking upward/outward rather than down.
**Scene:** dawn-toned edge of a mountain path, small bundle/satchel over one shoulder, a
star-patterned cloak catching the light. **Required objects:** a cliff edge, a small white/gold
animal companion at the figure's feet (traditional Fool motif), a distant sunrise glow blended into
the celestial palette. **Composition:** figure slightly off-center, open sky dominating the upper
frame to convey open possibility. **Lighting:** warm dawn-gold light source from the horizon.
**Secondary accent:** none (Major Arcana stays on the core purple-gold palette). **Emotional tone:**
light, hopeful, unafraid. **Do not omit:** the cliff-edge; the upward gaze. **Do not include:** any
sense of danger/falling, no dark storm.
**QA checklist:** figure reads as beginning a journey, not falling; companion animal present; no
text; frame/border matches system; 768×1280.

### I — The Magician (`major-01-the-magician`)
**Core symbolism:** manifestation, willpower, inspired action. **Main subject:** a poised figure
standing at a small altar/table, one hand raised toward the sky, one pointing to the ground
(traditional "as above, so below" gesture). **Scene:** the four suit emblems (a wand, a cup, a
sword, a pentacle/coin) arranged on the altar before them. **Required objects:** the infinity
symbol motif subtly worked into the halo/light above the figure's head; the four suit emblems.
**Composition:** centered, altar at chest height, confident upright stance. **Lighting:** a focused
downward beam meeting an upward glow at the raised hand. **Secondary accent:** none. **Emotional
tone:** focused, capable, resolute. **Do not omit:** all four suit emblems; the dual-gesture pose.
**Do not include:** any sense of trickery/sleight-of-hand deception.

### II — The High Priestess (`major-02-the-high-priestess`)
**Core symbolism:** intuition, hidden knowledge, quiet inner knowing. **Main subject:** a seated,
composed figure between two pillars (echoing The Star's own pillar motif — a deliberate deck-wide
callback), a crescent moon at her feet or headdress. **Scene:** a veiled space behind her hinting at
concealed knowledge, not revealing it. **Required objects:** twin pillars (one lighter, one darker
— traditional duality symbolism); a scroll or book held loosely, mostly closed. **Composition:**
symmetric, seated, calm frontal pose. **Lighting:** soft, diffused moonlight rather than a single
sharp source. **Secondary accent:** none. **Emotional tone:** still, mysterious, receptive.
**Do not omit:** the twin-pillar motif. **Do not include:** an open/fully revealed book — the
knowledge stays partially veiled.

### III — The Empress (`major-03-the-empress`)
**Core symbolism:** abundance, nurturing, creative growth. **Main subject:** a seated, regal figure
in a lush setting, relaxed and warm rather than rigid. **Scene:** a flowing garden or grove with
star-touched foliage, a small stream. **Required objects:** a wheat/grain motif or ripe fruit
nearby (traditional fertility/abundance symbol); a heart-shaped or Venus-symbol accent worked
subtly into her setting. **Composition:** reclined or gently seated, open inviting posture.
**Lighting:** warm and soft, no harsh shadow. **Secondary accent:** none. **Emotional tone:** warm,
generous, at ease. **Do not omit:** the abundant-garden setting. **Do not include:** any barren or
withered plant life.

### IV — The Emperor (`major-04-the-emperor`)
**Core symbolism:** authority, structure, stable leadership. **Main subject:** a seated figure on a
stone/gold throne, upright and commanding posture. **Scene:** a fortress or mountain backdrop
conveying permanence. **Required objects:** a ram's-head motif on the throne (traditional Aries/
Emperor symbol) worked into the gold ornamentation; a scepter or orb held with quiet authority.
**Composition:** frontal, symmetrical, throne fills a large portion of the frame. **Lighting:**
strong, direct, minimal softness — conveys firmness. **Secondary accent:** none. **Emotional tone:**
resolute, grounded, unshaken. **Do not omit:** the throne; the ram motif. **Do not include:** any
overt cruelty or menace in the figure's expression — authority, not tyranny.

### V — The Hierophant (`major-05-the-hierophant`)
**Core symbolism:** tradition, mentorship, shared belief. **Main subject:** a seated, elder-coded
figure in ceremonial dress between two shorter attendant figures or two ornate pillars, hand raised
in a teaching/blessing gesture. **Scene:** a temple-like interior, gold archways. **Required
objects:** a crossed-staff or triple-tiered crown motif (traditional Hierophant regalia), two keys
crossed at the base of the throne. **Composition:** centered, elevated slightly above the viewer's
eye line to convey authority-through-wisdom rather than force. **Lighting:** warm interior glow,
candle/gold-toned. **Secondary accent:** none. **Emotional tone:** solemn, wise, welcoming rather
than cold. **Do not omit:** the crossed-keys motif. **Do not include:** any specific real-world
religious iconography (keep it archetypal/tarot-traditional, not tied to a real faith).

### VI — The Lovers (`major-06-the-lovers`)
**Core symbolism:** genuine alignment, a meaningful choice, harmony. **Main subject:** two figures
facing each other or standing side by side beneath a radiant celestial presence above them (a large
star or angelic light, echoing traditional Lovers-card angel imagery reinterpreted celestially).
**Scene:** a garden setting with a mountain visible between/behind the two figures. **Required
objects:** the overhead radiant presence blessing the scene. **Composition:** two figures
balanced left-right, the celestial light centered above and between them. **Lighting:** the
overhead light is the dominant source, warm and unifying. **Secondary accent:** none. **Emotional
tone:** tender, genuine, unforced. **Do not omit:** the overhead celestial presence; two distinct
figures. **Do not include:** overt romantic/sexual content — the tone is alignment and choice, not
physical intimacy.

### VII — The Chariot (`major-07-the-chariot`)
**Core symbolism:** willpower, determination, victory through focus. **Main subject:** a
disciplined figure standing in/on an ornate gold chariot, reins held with calm control. **Scene:** a
starlit road or open celestial plain. **Required objects:** two contrasting creatures or forces
pulling the chariot (traditional light/dark sphinx or steed pairing) held in balance by the figure's
will. **Composition:** the chariot facing forward/toward the viewer, dynamic but controlled motion.
**Lighting:** directional, suggesting forward momentum. **Secondary accent:** none. **Emotional
tone:** focused, victorious, unshaken. **Do not omit:** the two-force pairing under the figure's
control. **Do not include:** chaos or a runaway/out-of-control feeling.

### VIII — Strength (`major-08-strength`)
**Core symbolism:** courage through gentleness, quiet inner strength. **Main subject:** a calm
figure gently closing or holding the jaws/mane of a large lion, without force or fear on either
side. **Scene:** an open natural setting under a starlit sky. **Required objects:** the lion,
rendered powerful but calm, not menacing; an infinity-symbol motif above the figure's head (deck
callback to The Magician). **Composition:** figure and lion close together, centered, gentle
contact rather than a struggle. **Lighting:** soft, warm, non-dramatic — this is not a battle scene.
**Secondary accent:** none. **Emotional tone:** serene, quietly powerful, compassionate. **Do not
omit:** the lion; the gentle (not forceful) contact. **Do not include:** any sense of violence,
whips, weapons, or fear in either figure's posture.

### IX — The Hermit (`major-09-the-hermit`)
**Core symbolism:** introspection, solitary inner guidance. **Main subject:** a lone, cloaked
figure standing on a high, quiet peak, holding aloft a single glowing lantern/star-lamp.
**Scene:** a vast, empty mountain vista beneath a deep star field — solitude, not loneliness.
**Required objects:** the raised lantern as the singular light source, its glow rendered as a
small radiant star. **Composition:** small figure against a large, quiet landscape — scale conveys
solitude. **Lighting:** the lantern is the only warm light; everything else is cool and dim.
**Secondary accent:** none. **Emotional tone:** contemplative, still, unafraid of the quiet. **Do
not omit:** the raised lantern. **Do not include:** any other figures or signs of company.

### X — Wheel of Fortune (`major-10-wheel-of-fortune`)
**Core symbolism:** cycles, turning points, change in motion. **Main subject:** a large ornate gold
wheel, mid-turn, centered in the frame, inscribed with subtle celestial/astrological glyphs around
its rim. **Scene:** the wheel suspended in a starry void, radiant light emanating from its hub.
**Required objects:** four small figures or symbolic creatures at the wheel's corners (traditional
four-fixed-sign motif), rendered celestially rather than literally. **Composition:** the wheel
fills the central frame, radial symmetry. **Lighting:** glow emanating outward from the wheel's
center. **Secondary accent:** none. **Emotional tone:** dynamic, fated, in motion. **Do not omit:**
visible rotational motion (blur/streak on the rim is acceptable). **Do not include:** any single
figure being crushed or victimized by the wheel.

### XI — Justice (`major-11-justice`)
**Core symbolism:** fairness, truth, honest accountability. **Main subject:** an upright, composed
seated figure holding a raised gold sword in one hand and a balanced set of scales in the other.
**Scene:** a formal, symmetrical hall or twin-pillar setting (echoing The High Priestess/Star pillar
motif). **Required objects:** the sword (upright, not swung); the scales, held level and balanced.
**Composition:** perfectly symmetrical, centered. **Lighting:** even, clear, unflattering-in-a-good-
way — no dramatic shadow hiding anything. **Secondary accent:** none. **Emotional tone:** clear-eyed,
impartial, calm. **Do not omit:** both the sword and the scales, both clearly balanced/upright.
**Do not include:** a blindfold obscuring the eyes entirely (keep the figure's clear-eyed gaze
visible — this deck's Justice sees plainly, per the card's own meaning).

### XII — The Hanged Man (`major-12-the-hanged-man`)
**Core symbolism:** surrender, a new perspective gained by pausing. **Main subject:** a figure
suspended calmly upside-down by one foot from a simple wooden/gold beam, expression peaceful, not
distressed. **Scene:** a quiet starlit grove. **Required objects:** a subtle halo or radiant glow
around the figure's head (traditional enlightenment-through-pause motif). **Composition:** figure
inverted but centered and calm, arms often loosely crossed or relaxed. **Lighting:** a soft glow
around the head specifically. **Secondary accent:** none. **Emotional tone:** peaceful, patient,
unresisting. **Do not omit:** the calm/peaceful expression — never distressed or in pain. **Do not
include:** any implication of punishment or violence.

### XIII — Death (`major-13-death`)
**Core symbolism:** a real ending that clears the way for something new — transformation, not
literal harm. **Main subject:** a cloaked, skeletal-but-not-gory rider or figure on a pale horse,
moving calmly through a landscape, rendered symbolically/archetypally rather than graphically.
**Scene:** a transitional landscape — a setting sun behind, a new dawn or fresh growth visible ahead
(traditional "life continues" detail). **Required objects:** a banner or flag with a rose/star
motif (traditional Death-card banner, reinterpreted celestially); visible signs of renewal in the
distance. **Composition:** the figure moves left-to-right or toward a visible horizon of renewal.
**Lighting:** dusk-to-dawn transitional lighting. **Secondary accent:** none. **Emotional tone:**
solemn but not frightening — inevitable, cyclical, ultimately hopeful. **Do not omit:** the visible
renewal/new-growth detail ahead. **Do not include:** graphic gore, real skulls/bones rendered
realistically, or a horror tone.

### XIV — Temperance (`major-14-temperance`)
**Core symbolism:** balance, patient blending of opposites. **Main subject:** a calm winged or
haloed figure pouring liquid fluidly between two gold vessels (deliberate echo of The Star's own
two-vessel pouring gesture — the deck's visual rhyme for "balance/flow between two things").
**Scene:** one foot on solid ground, one touching still water — literal balance between two
elements. **Required objects:** the two vessels; the water's-edge stance. **Composition:**
centered, calm, the poured liquid forming a smooth unbroken arc between the vessels. **Lighting:**
even, harmonious, no single dramatic source. **Secondary accent:** none. **Emotional tone:**
patient, harmonious, unhurried. **Do not omit:** the two-vessel pour; the one-foot-on-land/one-in-
water stance. **Do not include:** any spillage or imbalance in the pour.

### XV — The Devil (`major-15-the-devil`)
**Core symbolism:** restriction, an old pattern that looks heavier than it is. **Main subject:** a
large horned, celestial-toned (not literally demonic/red) figure seated above two smaller bound
figures, rendered so the "chains" are visibly loose. **Scene:** a dim, shadowed cavern-like space
lit by cold purple light rather than fire. **Required objects:** loose (not tight) chains on the two
smaller figures — the traditional "the bondage is optional" detail must be visible. **Composition:**
the large figure centered/elevated, the two smaller figures below. **Lighting:** dim, cold, low-
contrast — the darkest card in the deck, but still within the purple-gold palette, never red/orange
hellfire. **Secondary accent:** none. **Emotional tone:** heavy, but not menacing — a weight that
can be set down. **Do not omit:** the visibly loose chains. **Do not include:** literal red/fire
"hell" imagery, graphic horror, or a genuinely frightening/gory tone.

### XVI — The Tower (`major-16-the-tower`)
**Core symbolism:** sudden upheaval that clears ground needing to be cleared. **Main subject:** a
tall gold-crowned tower struck by a bolt of radiant light, its upper structure breaking apart.
**Scene:** two small falling figures (traditional Tower-card detail) rendered so their fall reads as
dramatic release rather than tragedy. **Required objects:** the lightning/radiant bolt striking the
crown of the tower; visible falling debris. **Composition:** the tower dominates the vertical frame,
diagonal energy from the strike. **Lighting:** a sudden, sharp burst of white-gold light against the
dark sky — the single most dramatic lighting moment in the deck. **Secondary accent:** none.
**Emotional tone:** dramatic, sudden, ultimately clarifying rather than purely destructive. **Do not
omit:** the lightning strike; the crown breaking off. **Do not include:** realistic human injury or
a horror tone.

### XVII — The Star (`major-17-the-star`)
**Status: `REFERENCE_ALREADY_APPROVED` — do not regenerate.** Already in place at
`/assets/tarot/cards/major/major-17-the-star.webp`. Full analysis in
`docs/design/tarot-78-art-bible.md`. Included here only for completeness of the 22-entry Major
Arcana list.

### XVIII — The Moon (`major-18-the-moon`)
**Core symbolism:** uncertainty, intuition over incomplete information. **Main subject:** a large,
detailed crescent-and-full moon hybrid motif (traditional Moon-card face-in-the-moon detail,
rendered celestially) presiding over a winding path. **Scene:** two distant pillar-like towers
flanking the path (deck callback), a pool of water in the foreground with a creature partially
emerging (traditional crayfish/subconscious-emergence motif, rendered symbolically). **Required
objects:** the winding path leading toward the horizon; the emerging water-creature silhouette.
**Composition:** the moon dominates the upper frame, the path leads the eye from foreground to
horizon. **Lighting:** cool, silvery-gold moonlight, hazier/softer-focus than other cards to convey
uncertainty. **Secondary accent:** none. **Emotional tone:** dreamlike, uncertain, quietly
watchful. **Do not omit:** the winding path; the moon's dominant presence. **Do not include:** any
overtly frightening creature design — the emergence should read as mysterious, not monstrous.

### XIX — The Sun (`major-19-the-sun`)
**Core symbolism:** joy, vitality, unqualified clarity. **Main subject:** a radiant, oversized
golden sun dominating the sky above a joyful figure (often a child or youthful figure in
traditional imagery) in an open sunflower-lined field. **Scene:** the brightest, warmest card in the
deck — even within the purple-gold palette, this card should feel like the deck's "daylight"
moment. **Required objects:** sunflowers or star-shaped bright blooms; a low garden wall. **Composition:**
the sun fills a large portion of the upper frame, the figure open and unguarded below. **Lighting:**
the single warmest, brightest card — gold and white-gold dominate over purple here more than on any
other card. **Secondary accent:** none. **Emotional tone:** joyful, open, genuinely bright. **Do not
omit:** the dominant sun; an open, unguarded figure posture. **Do not include:** any shadow or
somber element that would undercut the card's unqualified brightness.

### XX — Judgement (`major-20-judgement`)
**Core symbolism:** honest self-evaluation, an awakening call. **Main subject:** a radiant angelic/
celestial figure in the sky sounding a gold trumpet or horn, figures below rising with arms
outstretched to meet the call. **Scene:** graves or resting places opening below (traditional
Judgement imagery, rendered symbolically/celestially rather than literally morbid). **Required
objects:** the trumpet/horn; at least one rising figure with an open, answering posture. **Composition:**
vertical energy, celestial figure above, rising figures below, connected by light. **Lighting:** a
radiant downward cascade from the celestial figure. **Secondary accent:** none. **Emotional tone:**
awakening, honest, momentous. **Do not omit:** the trumpet call; the rising/answering figures. **Do
not include:** graphic grave/death imagery — keep it symbolic, not morbid.

### XXI — The World (`major-21-the-world`)
**Core symbolism:** completion, wholeness, a full circle closing. **Main subject:** a graceful
figure at the center of a large radiant wreath/ring (traditional World-card laurel wreath,
reinterpreted as a celestial ring of stars and gold laurel), holding a wand or star-tipped staff in
each hand, in a balanced, dance-like pose. **Scene:** the ring floats in a starlit void, four small
symbolic figures/motifs at the ring's four corners (traditional four-fixed-sign echo, matching the
Wheel of Fortune's own corner motif — a deliberate deck-wide callback marking these two cards as
thematically related). **Required objects:** the encircling wreath/ring; the four corner motifs.
**Composition:** perfectly centered, radial symmetry, the figure in mid-graceful-motion within the
ring. **Lighting:** even, celebratory, radiant from all sides rather than one direction — the "most
resolved" lighting in the deck. **Secondary accent:** none. **Emotional tone:** accomplished,
complete, joyfully resolved. **Do not omit:** the encircling ring/wreath; the four corner motifs
(deck callback to the Wheel of Fortune). **Do not include:** any sense of an ending that feels sad
or incomplete — this is the deck's triumphant close.

---

## MINOR ARCANA (56)

Each suit shares one **suit environment** and **secondary accent** (from the Art Bible §J), applied
consistently across all 14 cards of that suit. Per-rank symbolism is specified individually — pip
cards visually reference their traditional count/meaning (brief §15's own explicit requirement),
never a generic "pretty figure" repeated with a different number.

### WANDS — Fire · warm amber / subtle crimson accent · environment: sunlit highlands, embers, forges, open flame motifs woven into the celestial gold linework

- **Ace of Wands** (`wands-01-ace-of-wands`) — a single hand emerging from a celestial cloud, holding one radiant, budding wand aloft — pure potential igniting. Emotional tone: sparking, eager. Do not omit: the single wand with visible budding/sprouting detail.
- **Two of Wands** (`wands-02-two-of-wands`) — a figure standing at a high vantage point, one wand held, one mounted beside them, gazing out over a distant vista — surveying future possibility. Do not omit: the vista view; two wands visible.
- **Three of Wands** (`wands-03-three-of-wands`) — a figure viewed from behind, standing among three planted wands, watching ships/journeys depart on a distant horizon — early success, expansion. Do not omit: three wands; a distant horizon with visible movement (ships or travelers).
- **Four of Wands** (`wands-04-four-of-wands`) — four wands forming a garlanded archway/gate, figures celebrating beneath it — a homecoming, a milestone. Do not omit: the four-wand archway with garland/celestial-star decoration.
- **Five of Wands** (`wands-05-five-of-wands`) — five figures each holding a wand in a chaotic but non-violent clash of poses — competing energies, unresolved tension. Do not omit: five distinct wands in active, clashing (not harmonious) poses.
- **Six of Wands** (`wands-06-six-of-wands`) — a figure riding proudly forward, one wand raised in visible victory, surrounded by five other wands carried by a small procession — public recognition. Do not omit: the raised/victorious central wand; a procession of five more.
- **Seven of Wands** (`wands-07-seven-of-wands`) — a figure standing on higher ground, one wand braced defensively, six more wands rising from below — holding a position under pressure. Do not omit: the elevated defensive stance; seven total wands.
- **Eight of Wands** (`wands-08-eight-of-wands`) — eight wands flying swiftly through an open sky, streaking toward a destination — rapid, aligned movement. Do not omit: all eight wands in visible motion/flight, no figure required.
- **Nine of Wands** (`wands-09-nine-of-wands`) — a weary but resolute figure standing guard before eight planted wands, one more held ready — resilience near the finish. Do not omit: nine total wands; a visibly tired-but-standing posture.
- **Ten of Wands** (`wands-10-ten-of-wands`) — a figure bent under the visible weight of carrying all ten wands bundled together toward a distant home — burden, responsibility carried alone. Do not omit: all ten wands bundled and visibly heavy; a strained but forward-moving posture.
- **Page of Wands** (`wands-11-page-of-wands`) — a youthful figure examining a single budding wand with open curiosity, standing at the edge of an open desert/highland vista. Do not omit: the single wand; an exploratory, curious posture (not a throne, not authority).
- **Knight of Wands** (`wands-12-knight-of-wands`) — a figure mid-charge on a rearing steed, one wand raised forward, cloak streaking with motion — bold, fast pursuit. Do not omit: visible forward motion/speed; one raised wand.
- **Queen of Wands** (`wands-13-queen-of-wands`) — a seated, confident figure on a modest gold throne, one wand held upright, a small sunflower or warm-bloom motif nearby, direct/warm gaze toward the viewer. Do not omit: the upright wand; a warm, confident (not cold) expression.
- **King of Wands** (`wands-14-king-of-wands`) — a standing (not seated) commanding figure holding a wand like a scepter, salamander or flame-echo motif subtly worked into the throne/backdrop — visionary leadership in motion, not static rule. Do not omit: a standing (active) rather than passive seated pose; the wand held with clear authority.

### CUPS — Water · blue / aqua / moonlight accent · environment: still water, reflective pools, gentle shorelines, moon-on-water motifs

- **Ace of Cups** (`cups-01-ace-of-cups`) — a single hand emerging from a celestial cloud holding one overflowing gold cup, a dove or small radiant bird descending toward it — an open heart, new emotional beginning. Do not omit: the overflowing cup; the descending bird/dove.
- **Two of Cups** (`cups-02-two-of-cups`) — two figures facing each other, each offering a cup toward the other in a mutual exchange — genuine two-way connection. Do not omit: two figures, two cups, an exchanging (not one-sided) gesture.
- **Three of Cups** (`cups-03-three-of-cups`) — three figures raising cups together in a circle of celebration, light fabric mid-twirl — joy shared in community. Do not omit: exactly three figures, three raised cups, visible celebration/motion.
- **Four of Cups** (`cups-04-four-of-cups`) — a seated figure under a tree, arms crossed, gazing past three cups on the ground while a fourth cup is offered from a cloud above, unnoticed — apathy missing an opportunity. Do not omit: the unnoticed fourth offered cup; a withdrawn, inward-facing posture.
- **Five of Cups** (`cups-05-five-of-cups`) — a cloaked figure looking down at three spilled cups, while two full upright cups stand behind them, unnoticed — grief that hasn't yet seen what remains. Do not omit: three spilled + two upright cups; the figure's gaze fixed only on the spilled ones.
- **Six of Cups** (`cups-06-six-of-cups`) — two small figures in a quiet garden courtyard, one offering a flower-filled cup to the other, among several more cups — nostalgic warmth, a simpler time. Do not omit: a courtyard/garden setting; a giving gesture between two figures.
- **Seven of Cups** (`cups-07-seven-of-cups`) — a silhouetted figure facing seven cups floating in the clouds, each containing a different symbolic vision (a star, a jewel, a shrouded figure, etc.) — many appealing but uncertain choices. Do not omit: exactly seven distinct cups with visibly different contents/visions inside each.
- **Eight of Cups** (`cups-08-eight-of-cups`) — a cloaked figure walking away, back to the viewer, from eight stacked cups toward distant mountains under a moon — leaving what no longer satisfies. Do not omit: eight stacked cups being left behind; a departing (walking-away) figure.
- **Nine of Cups** (`cups-09-nine-of-cups`) — a seated, content figure with arms comfortably crossed, nine cups arranged in a proud arc behind them — earned satisfaction. Do not omit: nine cups in an arc; a relaxed, satisfied (not smug) posture.
- **Ten of Cups** (`cups-10-ten-of-cups`) — a small family group beneath a radiant arc of ten cups in the sky, arms raised in shared joy, a home visible in the distance — lasting emotional fulfillment. Do not omit: ten cups forming an arc/rainbow shape; a family/group scene, not a single figure.
- **Page of Cups** (`cups-11-page-of-cups`) — a youthful figure at a shoreline holding a cup from which a small fish or bird playfully emerges, looking at it with open surprise — curious emotional openness. Do not omit: the cup with the emerging creature; a shoreline setting.
- **Knight of Cups** (`cups-12-knight-of-cups`) — a graceful figure on a calm, steady steed, one cup extended forward like an offering, moving unhurried beside a quiet river — romantic idealism in motion. Do not omit: the extended cup offering; a calm (not rushed) steed/motion.
- **Queen of Cups** (`cups-13-queen-of-cups`) — a seated figure at the edge of still water, an ornate closed cup held with both hands, her own reflection visible in the water — deep emotional intuition. Do not omit: the closed/ornate cup; a visible reflection in water.
- **King of Cups** (`cups-14-king-of-cups`) — a seated figure on a throne that appears to float on calm open water, one cup held steady in one hand, unshaken by the water's motion around the throne — emotional mastery amid feeling. Do not omit: the throne on/near water; a steady, unshaken posture despite the water setting.

### SWORDS — Air · cool indigo / silver-blue light accent (frame metal stays gold) · environment: high windswept clouds, storm-light, sharp geometric air currents

- **Ace of Swords** (`swords-01-ace-of-swords`) — a single hand emerging from a cloud gripping one upright, radiant sword, a crown or laurel motif at its tip — a moment of cutting clarity. Do not omit: the single upright sword; a crown/laurel accent at the blade's tip.
- **Two of Swords** (`swords-02-two-of-swords`) — a seated figure, eyes covered or closed, holding two crossed swords balanced before them, calm water visible behind — a deliberate, unresolved pause. Do not omit: two crossed/balanced swords; a covered or closed-eyed figure.
- **Three of Swords** (`swords-03-three-of-swords`) — three swords piercing a single radiant heart-shaped light, storm clouds and rain behind — sharp, real heartbreak. Do not omit: exactly three swords through one central heart-shaped form; visible storm/rain.
- **Four of Swords** (`swords-04-four-of-swords`) — a still, resting figure lying in quiet repose, three swords mounted on the wall above and one sword laid beside them — deliberate recovery, not defeat. Do not omit: a resting (not fallen/wounded) figure; four total swords, three mounted + one laid beside.
- **Five of Swords** (`swords-05-five-of-swords`) — a figure gathering up several swords with a guarded expression, two distant figures walking away in the background — a hollow win. Do not omit: the gathering figure; two departing background figures.
- **Six of Swords** (`swords-06-six-of-swords`) — figures in a small boat being ferried across calm water toward a distant, calmer shore, six swords standing upright in the boat — moving on from hardship. Do not omit: the boat/ferry crossing; six upright swords within it.
- **Seven of Swords** (`swords-07-seven-of-swords`) — a figure moving stealthily away from a camp at dusk, carrying five swords while two remain planted behind — a strategic, quiet exit. Do not omit: the figure carrying multiple swords while leaving some behind; a stealthy/low posture.
- **Eight of Swords** (`swords-08-eight-of-swords`) — a bound, blindfolded figure standing amid eight swords loosely planted around them in a loose enclosure, with a visible gap in the ring of swords — a trap that has more room to move than it appears. Do not omit: exactly eight swords; a visible gap/opening in their arrangement.
- **Nine of Swords** (`swords-09-nine-of-swords`) — a figure sitting upright in the dark, head in hands, nine swords mounted on the wall behind in a row — anxiety heavier at night than by day. Do not omit: nine swords in a row on the wall; a distressed but seated (not harmed) figure.
- **Ten of Swords** (`swords-10-ten-of-swords`) — a figure lying at dawn's first light with ten swords laid along their back in a final, symbolic (never gory) arrangement, the horizon beginning to brighten behind — a hard bottom, with sunrise already starting. Do not omit: ten swords; a visible brightening horizon/dawn light.
- **Page of Swords** (`swords-11-page-of-swords`) — a youthful figure standing alert atop a windswept hill, one sword held ready, gaze scanning the horizon, wind visibly moving cloak/hair — vigilant curiosity. Do not omit: the alert stance; visible wind motion.
- **Knight of Swords** (`swords-12-knight-of-swords`) — a figure charging forward on a fast steed through a storm, sword thrust ahead, cloak and mane whipped by wind — fast, driven action. Do not omit: visible storm/wind; forward-thrust sword.
- **Queen of Swords** (`swords-13-queen-of-swords`) — a seated figure on a high-backed throne among clouds, one sword held upright, one hand raised in a clear, direct gesture, expression composed and honest. Do not omit: the upright sword; a clear-eyed, direct (not cold) expression.
- **King of Swords** (`swords-14-king-of-swords`) — a seated figure on a throne carved with butterfly/air motifs, sword held upright and steady, gaze level and fair. Do not omit: the upright sword; a level, fair (not harsh) expression.

### PENTACLES — Earth · emerald / earth-tone accent · environment: fertile gardens, stone paths, orchards, coin/disc motifs in gold

- **Ace of Pentacles** (`pentacles-01-ace-of-pentacles`) — a single hand emerging from a cloud holding one radiant gold coin/pentacle above a lush garden gate — tangible new opportunity. Do not omit: the single coin/pentacle; a garden setting below.
- **Two of Pentacles** (`pentacles-02-two-of-pentacles`) — a figure balancing two coins joined by an infinity-shaped ribbon, weight shifting between them with practiced ease, ships on gentle waves behind — juggling priorities with real skill. Do not omit: the infinity-ribbon connecting two coins; a balanced (not stumbling) stance.
- **Three of Pentacles** (`pentacles-03-three-of-pentacles`) — three figures collaborating at a stone archway under construction — a builder examining plans, others contributing — skilled collaborative work. Do not omit: three distinct figures collaborating; visible craftsmanship/construction.
- **Four of Pentacles** (`pentacles-04-four-of-pentacles`) — a seated figure gripping one coin tightly to their chest, one balanced on their head, two more under each foot — holding on tightly to security. Do not omit: four coins in this specific held/balanced/underfoot arrangement.
- **Five of Pentacles** (`pentacles-05-five-of-pentacles`) — two weary figures walking through snow past a lit stained-glass window they don't notice, coins scattered faintly in the frame — hardship, with unseen support nearby. Do not omit: the lit window; two figures who appear not to notice it.
- **Six of Pentacles** (`pentacles-06-six-of-pentacles`) — a standing figure holding a small balanced scale in one hand, distributing coins to two kneeling figures with the other — fair giving and receiving. Do not omit: the scale; the act of giving to more than one recipient.
- **Seven of Pentacles** (`pentacles-07-seven-of-pentacles`) — a figure leaning on a tool, studying a vine heavy with seven pentacle-shaped fruit, weighing whether the harvest is ready — patient assessment. Do not omit: exactly seven pentacle/coin-shaped fruit on the vine; a contemplative (not idle) posture.
- **Eight of Pentacles** (`pentacles-08-eight-of-pentacles`) — a focused figure at a workbench, carefully carving/engraving one pentacle while six completed ones hang finished nearby and one more waits — dedicated skill-building. Do not omit: multiple completed pentacles plus one in active progress; focused hands-on work.
- **Nine of Pentacles** (`pentacles-09-nine-of-pentacles`) — a serene figure standing in a private, abundant vineyard garden, nine pentacles woven into the surrounding vines, a small bird resting on one gloved hand — self-made, comfortable independence. Do not omit: nine pentacles in the vines; the resting bird.
- **Ten of Pentacles** (`pentacles-10-ten-of-pentacles`) — an elder figure with family members of different ages gathered beneath an archway, ten pentacles arranged into the family crest/archway design — legacy, lasting stability. Do not omit: multiple generations/family figures; ten pentacles worked into the architecture.
- **Page of Pentacles** (`pentacles-11-page-of-pentacles`) — a youthful figure standing in an open field, holding one pentacle up and studying it intently, as if learning its full meaning — practical curiosity. Do not omit: the single studied pentacle; an attentive, learning posture.
- **Knight of Pentacles** (`pentacles-12-knight-of-pentacles`) — a figure seated calmly on a sturdy, unmoving steed in a plowed field, one pentacle held steady, patient and grounded rather than fast-moving — methodical, reliable progress. Do not omit: a calm/still (not galloping) steed; a plowed-field or cultivated setting.
- **Queen of Pentacles** (`pentacles-13-queen-of-pentacles`) — a seated figure in a lush garden throne surrounded by ripe fruit and small animals at ease nearby, one pentacle held gently in her lap — grounded, practical nurturing. Do not omit: the garden/fruit abundance; the pentacle held with visible care.
- **King of Pentacles** (`pentacles-14-king-of-pentacles`) — a seated figure on a throne carved with grapevines and bull motifs, one pentacle resting on a raised knee, an orchard visible behind — steady, disciplined material mastery. Do not omit: the vine/orchard motif; the resting (not gripped) pentacle conveying earned ease.

---

## Summary

- 22 Major Arcana entries (1 marked `REFERENCE_ALREADY_APPROVED`, 21 requiring production).
- 56 Minor Arcana entries (all 56 requiring production).
- **Total: 78 entries, 77 requiring production, matching the checklist's 77 `PENDING_ARTWORK` count
  exactly.**
