/**
 * MOCK DATA — Mệnh Vi exploration only.
 *
 * This route is an isolated design exploration (docs/design/menh-vi-reference-breakdown.md),
 * not wired to a real API. No astrology/numerology/tarot backend exists for this product
 * identity, so this file is the single, clearly-labeled source of placeholder content for the
 * home page. Do not import this into any BeaconVie route.
 */

export const mvUser = {
  firstName: 'Thành',
};

export const mvEnergyToday = {
  score: 78,
  label: 'Khá thuận lợi',
  dimensions: [
    { key: 'love', label: 'Tình cảm', score: 82 },
    { key: 'career', label: 'Sự nghiệp', score: 73 },
    { key: 'wealth', label: 'Tài lộc', score: 76 },
    { key: 'inner', label: 'Nội tâm', score: 68 },
  ],
};

export const mvSpotlight = {
  title: 'Một cuộc trò chuyện tưởng như bình thường có thể mở ra một hướng đi mới cho bạn.',
};

export const mvDimensionDetails = [
  { key: 'love', label: 'Tình cảm', score: 82, note: 'Có điều chưa nói ra...' },
  { key: 'career', label: 'Sự nghiệp', score: 73, note: 'Đừng quyết định...' },
  { key: 'wealth', label: 'Tài chính', score: 76, note: 'Cơ hội cải thiện...' },
  { key: 'inner', label: 'Nội tâm', score: 68, note: 'Bạn cần nghỉ ngơi...' },
];

export const mvEvents = [
  { date: '14/08', title: 'Trăng Tròn Bảo Bình', note: 'Ảnh hưởng mạnh đến cảm xúc' },
  { date: '18/08', title: 'Sao Kim đi vào Xử Nữ', note: 'Thuận lợi cho tình cảm & tài chính' },
  { date: '22/08', title: 'Ngày tốt để bắt đầu', note: 'Công việc mới, dự án mới' },
];

export const mvDestinyTools = [
  {
    key: 'la-so',
    title: 'Tử Vi Lá Số',
    tagline: 'Bức tranh vận mệnh của riêng bạn',
    href: '/menh-vi/la-so',
    // docs/design/menh-vi-generated-asset-audit.md — asset-01.png, accepted.
    asset: { filename: 'feature-tu-vi.webp', width: 480, height: 480, ready: true },
  },
  {
    key: 'tarot',
    title: 'Tarot',
    tagline: 'Một thông điệp đang chờ bạn',
    href: '/menh-vi/tarot',
    // docs/design/menh-vi-generated-asset-audit.md — asset-02.png, accepted.
    asset: { filename: 'feature-tarot.webp', width: 480, height: 480, ready: true },
  },
  {
    key: 'ban-do-sao',
    title: 'Bản Đồ Sao',
    tagline: 'Hiểu bầu trời lúc bạn sinh ra',
    href: '/menh-vi/ban-do-sao',
    // Round 3: real alpha confirmed programmatically, cropped to square — see audit doc.
    asset: { filename: 'feature-star-map.webp', width: 480, height: 480, ready: true },
  },
  {
    key: 'than-so-hoc',
    title: 'Thần Số Học',
    tagline: 'Những con số kể gì về bạn?',
    href: '/menh-vi/than-so-hoc',
    // Round 2: correctly-transparent numerology mandala accepted — see audit doc.
    asset: { filename: 'feature-numerology.webp', width: 480, height: 480, ready: true },
  },
];

export const mvCompatibility = {
  you: { name: 'Thành', sign: 'Kim Ngưu' },
  partner: { name: 'Lan', sign: 'Xử Nữ' },
  score: 86,
  label: 'Rất hòa hợp',
};

export const mvLifeTimeline = [
  { year: '2000', label: 'Sinh' },
  { year: '2018', label: 'Chuyển vận' },
  { year: '2024', label: 'Đại vận' },
  { year: '2026', label: 'Hiện tại', current: true },
  { year: '2030', label: 'Tương lai' },
];
