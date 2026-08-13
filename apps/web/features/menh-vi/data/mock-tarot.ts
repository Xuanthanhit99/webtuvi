/** MOCK DATA — see mock-dashboard.ts header. Isolated to the /menh-vi/tarot exploration page. */

export const mvTarotTopics = [
  { key: 'love', label: 'Tình yêu' },
  { key: 'work', label: 'Công việc' },
  { key: 'money', label: 'Tiền bạc' },
  { key: 'decision', label: 'Một quyết định' },
  { key: 'daily', label: 'Thông điệp hôm nay' },
] as const;

export const mvTarotReveal = {
  name: 'THE STAR',
  nameVi: 'Ngôi Sao',
  interpretation:
    'Bạn không cần biết toàn bộ con đường để bắt đầu bước tiếp. Hôm nay là lúc tin vào trực giác của mình và cho phép mọi thứ diễn ra tự nhiên hơn.',
};
