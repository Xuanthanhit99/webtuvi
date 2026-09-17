import { render, screen } from '@testing-library/react';
import TermsPage, { metadata } from './page';

// Legal Content Completion — proves the Sprint 1 placeholder is gone and the real terms cover the
// required topics, without asserting exact prose (which will keep evolving with founder/legal
// input) so this test doesn't become brittle against wording tweaks.
describe('TermsPage', () => {
  it('no longer contains the Sprint 1 placeholder disclaimer', () => {
    render(<TermsPage />);
    expect(screen.queryByText(/placeholder summary for Sprint 1/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/plain-language summary for Sprint 1/i)).not.toBeInTheDocument();
  });

  it('never shows stale brand names', () => {
    render(<TermsPage />);
    expect(screen.queryByText(/BeaconVie/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Tử Vi Tarot/)).not.toBeInTheDocument();
  });

  it('keeps the not-medical/psychological/financial-advice and crisis-line disclaimer', () => {
    render(<TermsPage />);
    expect(screen.getByText(/không phải là dịch vụ tư vấn y tế, tâm lý, tài chính hoặc pháp lý/i)).toBeInTheDocument();
    expect(screen.getByText(/đường dây hỗ trợ khủng hoảng/i)).toBeInTheDocument();
  });

  it('never promises a guaranteed prediction, and discloses AI-generated content limitations', () => {
    render(<TermsPage />);
    expect(screen.getByText(/dự đoán được đảm bảo/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /nội dung do ai tạo ra/i })).toBeInTheDocument();
  });

  it('describes Premium as a one-time, non-recurring purchase, not a subscription', () => {
    render(<TermsPage />);
    expect(screen.getByText(/không phải là gói đăng ký định kỳ/i)).toBeInTheDocument();
  });

  it('does not invent a refund policy or governing law — flags them for founder/legal instead', () => {
    render(<TermsPage />);
    expect(screen.getAllByText(/Cần Chủ sở hữu\/Pháp lý xác nhận/i).length).toBeGreaterThan(0);
    expect(screen.getByRole('heading', { name: /luật áp dụng và giải quyết tranh chấp/i })).toBeInTheDocument();
  });

  it('has real, production-oriented metadata', () => {
    expect(metadata.title).toBe('Điều khoản dịch vụ');
    expect(metadata.description).not.toMatch(/placeholder/i);
  });
});
