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
    headline: 'Một AI thực sự ghi nhớ bạn.',
    headlineHighlight: 'ghi nhớ bạn',
    subheadline:
      'Mệnh Vi bắt đầu bằng một lượt rút Tarot thật để làm quen với bạn — rồi mang theo những gì đã học được, qua từng cuộc trò chuyện, để bạn không bao giờ phải bắt đầu lại từ đầu.',
    primaryCta: 'Gặp Người bạn đồng hành của bạn',
    secondaryCta: 'Xem cách hoạt động',
  },
  trust: {
    notTitle: 'Chúng tôi KHÔNG PHẢI là',
    not: ['Một ứng dụng xem tử vi', 'Một chatbot AI thông thường', 'Một ứng dụng trị liệu tâm lý', 'Một mạng xã hội'],
    areTitle: 'Chúng tôi LÀ',
    are: [
      'Một Người bạn đồng hành AI ghi nhớ những gì bạn chia sẻ',
      'Một thói quen chiêm nghiệm, bắt đầu bằng một lượt rút Tarot thật',
      'Riêng tư theo mặc định, bạn có thể xuất hoặc xóa bất cứ lúc nào',
    ],
  },
  problem: {
    lines: [
      'Các ứng dụng xem tử vi quên bạn ngay khi bạn đóng ứng dụng.',
      'Chatbot không có lý do để hỏi điều thực sự quan trọng.',
    ],
  },
  solution: {
    text: 'Mệnh Vi bắt đầu bằng một lượt rút Tarot thật và mang theo những gì bạn chia sẻ. Mỗi cuộc trò chuyện đều bổ sung thêm vào những gì Người bạn đồng hành của bạn biết. Không có gì bị mất giữa các lần ghé thăm.',
  },
  howItWorks: {
    steps: [
      {
        number: 1,
        text: 'Bắt đầu với một lượt rút Tarot thật, một lượt đọc Thần số học, Bản đồ sao, hoặc tính toán Ngũ Hành Phương Đông.',
      },
      { number: 2, text: 'Trò chuyện về điều đó với Người bạn đồng hành của bạn.' },
      { number: 3, text: 'Quay lại — nó vẫn nhớ, và bức tranh trở nên rõ ràng hơn.' },
    ],
  },
  discoverySystems: [
    { title: 'Tarot', description: 'Một lượt rút thật, xác định, từ bộ 78 lá bài — đang hoạt động ngay hôm nay.', comingSoon: false, href: '/discover/tarot' },
    {
      title: 'Bản đồ sao',
      description: 'Một bản đồ sao thật, xác định, được tính từ ngày, giờ và nơi sinh của bạn — đang hoạt động ngay hôm nay.',
      comingSoon: false,
      href: '/discover/natal-chart',
    },
    {
      title: 'Ngũ Hành Phương Đông',
      description: 'Một phép tính Con giáp và Ngũ Hành thật, xác định — đang hoạt động ngay hôm nay.',
      comingSoon: false,
      href: '/discover/eastern-horoscope',
    },
    {
      title: 'Thần số học',
      description: 'Những con số vốn đã có trong cuộc sống của bạn, được nhìn lại một lần nữa — không con số nào do AI chọn hay bịa ra.',
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
    label: 'Người bạn đồng hành AI',
    exampleUser: 'Mình không biết phải làm gì.',
    exampleCompanion:
      'Một năm trước, bạn từng nói với mình rằng bạn cảm thấy y hệt như vậy trước khi đổi việc. Bây giờ điều gì đang khác đi?',
    memoryLabel: 'Ký ức từ 3/11/2023',
  },
  memory: {
    text: 'Ba tuần trước, có người đã nói với Người bạn đồng hành của họ rằng họ lo lắng về việc đổi việc. Tuần này, không cần được hỏi, nó đã nhắc lại điều đó — vì nó đã ghi nhớ.',
  },
  reportsLine:
    'Khi đã có Bản đồ sao và một lượt đọc Thần số học, Báo cáo Vận mệnh Cá nhân của bạn sẽ kết hợp chúng lại thành một bài tường thuật dài — một tính năng Premium, sẵn sàng ngay hôm nay.',
  communityLine: 'Khi càng nhiều người chiêm nghiệm, các quy luật càng hiện rõ — luôn được ẩn danh, không bao giờ là một bảng tin công khai.',
  security: {
    privacy: 'nhật ký của bạn riêng tư theo mặc định, và bạn có thể xuất hoặc xóa mọi thứ, bất cứ lúc nào',
    security: 'được mã hóa, không bao giờ bán, không bao giờ dùng để huấn luyện AI nếu không có sự đồng ý',
  },
  testimonials: [
    { quote: 'Mình không ngờ nó lại thực sự nhắc lại điều đó.', attribution: 'Người dùng sớm' },
    { quote: 'Nó không giống một ứng dụng, mà giống như có ai đó thực sự đang lắng nghe.', attribution: 'Người dùng sớm' },
    { quote: 'Lượt rút Tarot chỉ là cánh cửa mở đầu — những cuộc trò chuyện mới là lý do mình ở lại.', attribution: 'Người dùng sớm' },
  ],
  pricing: {
    free: {
      name: 'Miễn phí',
      description: 'Truy cập đầy đủ Khám phá, và một Người bạn đồng hành ghi nhớ trong phạm vi mỗi cuộc trò chuyện.',
    },
    premium: {
      name: 'Premium',
      description:
        'Một lượt mua một lần, 30 ngày — không phải gói đăng ký định kỳ. Ghi nhớ xuyên suốt mọi cuộc trò chuyện, giới hạn Khám phá cao hơn, lịch sử lượt đọc không giới hạn, và Báo cáo Vận mệnh Cá nhân của bạn.',
    },
    // Pre-Live Product Experience Completion Audit finding #7: no exact price is shown pre-login.
    // The real price lives only in backend config (`PREMIUM_PRICE_VND`, single source of truth) and
    // is currently explicitly disclosed there as `isMvpTestPrice: true` — unvalidated, not yet
    // finalized. Advertising an explicitly-unfinalized number on public marketing copy risks
    // publishing a price that changes before launch. Until it's finalized, the honest choice is to
    // be transparent about pricing *structure* (one-time, 30-day, no subscription) and exactly where
    // the real number is shown — not to duplicate or fetch a number that isn't final yet. Revisit
    // once the price is signed off (see docs/architecture/premium-entitlements.md).
    priceNote: 'Xem mức giá chính xác hiện tại — xem miễn phí, không cần thẻ — ngay sau khi bạn đăng ký.',
    cta: 'Gặp Người bạn đồng hành của bạn',
  },
  faq: [
    {
      question: 'Đây có phải là ứng dụng xem tử vi không?',
      answer:
        'Không. Một lượt rút Tarot thật là cách Mệnh Vi bắt đầu làm quen với bạn — chứ không phải thứ nó bán cho bạn. Người bạn đồng hành và ký ức của nó về bạn mới chính là sản phẩm thực sự.',
    },
    {
      question: 'Dữ liệu của tôi có riêng tư không?',
      answer:
        'Có. Nhật ký và các cuộc trò chuyện của bạn riêng tư theo mặc định. Bạn có thể xuất hoặc xóa mọi thứ, bất cứ lúc nào.',
    },
    {
      question: 'Đây có phải là trị liệu tâm lý không?',
      answer:
        'Không. Mệnh Vi là một người bạn đồng hành chiêm nghiệm, không phải dịch vụ y tế hay lâm sàng, và không chẩn đoán hay điều trị bất cứ điều gì.',
    },
    {
      question: 'Premium thực sự thêm những gì?',
      answer:
        'Ghi nhớ liên tục xuyên suốt mọi cuộc trò chuyện, không chỉ trong ngày hôm nay, giới hạn Khám phá cao hơn, và Báo cáo Vận mệnh Cá nhân của bạn — một bài đọc dài được xây dựng từ Bản đồ sao và Thần số học của bạn.',
    },
  ],
  finalCta: {
    text: 'Một AI thực sự ghi nhớ bạn.',
    cta: 'Gặp Người bạn đồng hành của bạn',
  },
  footer: {
    productLinks: [
      { label: 'Cách hoạt động', href: '#how-it-works' },
      { label: 'Khám phá', href: '#discovery' },
      { label: 'Giá', href: '#pricing' },
    ],
    companyLinks: [{ label: 'Giới thiệu', href: '/about' }],
    legalLinks: [
      { label: 'Quyền riêng tư', href: '/privacy' },
      { label: 'Điều khoản', href: '/terms' },
      { label: 'Liên hệ', href: '/contact' },
    ],
    copyright: `© ${new Date().getFullYear()} Mệnh Vi. Bảo lưu mọi quyền.`,
  },
} as const;
