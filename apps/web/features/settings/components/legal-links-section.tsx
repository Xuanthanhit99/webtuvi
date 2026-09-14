import Link from 'next/link';
import { Card } from '@/components/ui/card';

// Pre-Live Product Experience Completion Audit finding #8: Privacy/Terms/Contact were reachable
// pre-login (marketing footer) but had no path from inside the authenticated app. This is the
// smallest fix — three plain links, no new navigation system, matching the existing
// text-insight/underline convention already used for the same links in register-form.tsx.
export function LegalLinksSection() {
  return (
    <Card>
      <p className="mb-3 text-body-sm font-semibold text-text-secondary">Pháp lý và hỗ trợ</p>
      <ul className="flex flex-col gap-2 text-body-sm">
        <li>
          <Link href="/privacy" className="text-insight underline">
            Chính sách riêng tư
          </Link>
        </li>
        <li>
          <Link href="/terms" className="text-insight underline">
            Điều khoản
          </Link>
        </li>
        <li>
          <Link href="/contact" className="text-insight underline">
            Liên hệ
          </Link>
        </li>
      </ul>
    </Card>
  );
}
