import Link from 'next/link';
import { Logo } from '@/components/ui/logo';

/**
 * Only real routes are linked here (checked apps/web/app/(marketing)/**): /about, /contact,
 * /terms, /privacy, and the real /discover/* Discovery pages. "Hướng dẫn sử dụng", "Câu hỏi
 * thường gặp", "Góp ý", and "Cộng đồng" from the reference footer have no shipped destination —
 * omitted rather than linked to a page that doesn't exist or mislabeling /contact for all of them.
 */
const FOOTER_COLUMNS = [
  {
    title: 'Khám phá',
    links: [
      { label: 'Tarot', href: '/discover/tarot' },
      { label: 'Lá số Tử Vi', href: '/discover/tu-vi' },
      { label: 'Bản đồ sao', href: '/discover/natal-chart' },
      { label: 'Thần số học', href: '/discover/numerology' },
      { label: 'Ngũ hành phương Đông', href: '/discover/eastern-horoscope' },
      { label: 'Khám phá', href: '/discover' },
    ],
  },
  {
    title: 'Hỗ trợ',
    links: [{ label: 'Liên hệ', href: '/contact' }],
  },
  {
    title: 'Về Mệnh Vi',
    links: [
      { label: 'Giới thiệu', href: '/about' },
      { label: 'Điều khoản sử dụng', href: '/terms' },
      { label: 'Chính sách bảo mật', href: '/privacy' },
    ],
  },
] as const;

export function HomeFooter() {
  return (
    <footer className="border-t border-white/10 pt-8">
      <div className="grid gap-8 tablet:grid-cols-[1.2fr_1fr_1fr_1fr]">
        <div className="max-w-xs">
          <Link href="/" aria-label="Mệnh Vi" className="flex items-center gap-3">
            <Logo withWordmark={false} />
            <span className="font-display text-body-lg font-semibold text-[#f2eee5]">Mệnh Vi</span>
          </Link>
          <p className="mt-3 text-body-sm leading-relaxed text-[#a6a7ac]">
            Mệnh Vi đồng hành cùng bạn trên hành trình khám phá bản thân và vận mệnh.
          </p>
        </div>
        {FOOTER_COLUMNS.map((column) => (
          <div key={column.title}>
            <p className="text-body-sm font-semibold text-[#f2eee5]">{column.title}</p>
            <ul className="mt-3 flex flex-col gap-2">
              {column.links.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-body-sm text-[#a6a7ac] hover:text-[#f2eee5]">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p className="mt-8 border-t border-white/[0.06] py-6 text-center text-caption text-text-secondary">
        © {new Date().getFullYear()} Mệnh Vi. Bảo lưu mọi quyền.
      </p>
    </footer>
  );
}
