import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';
import { MvPage, MvPageHeader } from '@/components/ui/mv-page';

export const metadata: Metadata = buildMetadata({
  title: 'Contact',
  description: 'Get in touch with the Tử Vi Tarot team with questions or feedback.',
  path: '/contact',
});

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-content px-4 py-16 desktop:px-8">
      <MvPage>
        <MvPageHeader eyebrow="Liên hệ" title="Gửi phản hồi cho Tử Vi Tarot" description="Câu hỏi, góp ý sản phẩm hoặc yêu cầu hỗ trợ đều có thể bắt đầu từ đây." />
        <p className="text-body-md text-text-secondary">
        Reach us at{' '}
        <a href="mailto:hello@beaconvie.local" className="text-insight underline">
          hello@beaconvie.local
        </a>
        .
      </p>
      </MvPage>
    </main>
  );
}
