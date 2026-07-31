import Link from 'next/link';
import { landingCopy } from '@/content/landing-copy';
import { Logo } from '@/components/ui/logo';

export function Footer() {
  const { footer } = landingCopy;
  return (
    <footer className="border-t border-border-subtle py-12">
      <div className="mx-auto flex max-w-content flex-col gap-8 px-4 desktop:flex-row desktop:justify-between desktop:px-8">
        <Logo />
        <div className="grid grid-cols-2 gap-8 desktop:grid-cols-3">
          <FooterColumn title="Product" links={footer.productLinks} />
          <FooterColumn title="Company" links={footer.companyLinks} />
          <FooterColumn title="Legal" links={footer.legalLinks} />
        </div>
      </div>
      <p className="mt-8 text-center text-caption text-text-disabled">{footer.copyright}</p>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: readonly { label: string; href: string }[] }) {
  return (
    <div>
      <p className="mb-3 text-body-sm font-semibold text-text-primary">{title}</p>
      <ul className="flex flex-col gap-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="text-body-sm text-text-secondary hover:text-text-primary">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
