import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';
import { MvPage, MvPageHeader } from '@/components/ui/mv-page';

export const metadata: Metadata = buildMetadata({
  title: 'Terms of Service',
  description: 'The terms governing your use of Mệnh Vi.',
  path: '/terms',
});

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-content px-4 py-16 desktop:px-8">
      <MvPage>
        <MvPageHeader eyebrow="Điều khoản" title="Terms of Service" description="The terms governing your use of Mệnh Vi." />
      <div className="flex flex-col gap-4 text-body-md text-text-secondary">
        <p>
          Mệnh Vi is a reflection and self-discovery product. It is not a medical, psychological, or financial advice service,
          and it does not diagnose or treat any condition. If you&rsquo;re in crisis, please contact a local emergency
          service or a crisis line in your region.
        </p>
        <p>
          By creating an account, you agree to use Mệnh Vi in good faith and not to misuse the service to
          harm others.
        </p>
        <p className="text-body-sm text-text-tertiary">
          This is a placeholder summary for Sprint 1. Complete legal Terms of Service will be published before
          general availability.
        </p>
      </div>
      </MvPage>
    </main>
  );
}
