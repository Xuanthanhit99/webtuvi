import { landingCopy } from './landing-copy';

describe('landing-copy — Reports honesty regression', () => {
  it('never describes the shipped Personal Destiny Report as unshipped/future', () => {
    const reportsCopy = [landingCopy.reportsLine, landingCopy.faq.find((q) => /Premium/i.test(q.question))?.answer].join(
      ' ',
    );

    expect(reportsCopy).not.toMatch(/on its way/i);
    expect(reportsCopy).not.toMatch(/v1\.5/i);
    expect(reportsCopy).not.toMatch(/coming soon/i);
  });

  it('describes the Personal Destiny Report as a real, present-tense Premium feature', () => {
    expect(landingCopy.reportsLine).toMatch(/Personal Destiny Report/i);
    expect(landingCopy.reportsLine).toMatch(/Premium/i);
    expect(landingCopy.reportsLine).toMatch(/today/i);
  });
});

describe('landing-copy — brand consistency regression', () => {
  it('never references the retired BeaconVie brand name', () => {
    expect(JSON.stringify(landingCopy)).not.toMatch(/BeaconVie/);
  });

  it('uses the current brand name in the hero subheadline', () => {
    expect(landingCopy.hero.subheadline).toMatch(/Tử Vi Tarot/);
  });
});

describe('landing-copy — pricing honesty regression', () => {
  it('does not duplicate the backend-owned PREMIUM_PRICE_VND value (79000) in marketing copy', () => {
    const pricingCopy = JSON.stringify(landingCopy.pricing);
    expect(pricingCopy).not.toMatch(/79[,.]?000/);
    expect(pricingCopy).not.toMatch(/\bVND\b/);
  });

  it('discloses pricing structure (one-time, 30-day, not a subscription) and where the real price is shown', () => {
    expect(landingCopy.pricing.premium.description).toMatch(/30-day/i);
    expect(landingCopy.pricing.premium.description).toMatch(/not a subscription/i);
    expect(landingCopy.pricing.priceNote).toMatch(/sign up/i);
  });
});
