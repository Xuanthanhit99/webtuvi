import { screen } from '@testing-library/react';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AiInterpretation } from './ai-interpretation';

describe('AiInterpretation', () => {
  it('labels AI-generated text as AI Interpretation, distinct from the deterministic result above it', () => {
    render(<AiInterpretation interpretation="A grounded reflection." isGenerating={false} onGenerate={jest.fn()} />);
    expect(screen.getByText('Diễn giải AI')).toBeInTheDocument();
    expect(screen.getByText('A grounded reflection.')).toBeInTheDocument();
    expect(screen.getByText(/AI không chọn hay thay đổi kết quả/)).toBeInTheDocument();
  });

  it('shows a not-ready state with a retry action when there is no interpretation yet', async () => {
    const onGenerate = jest.fn();
    const user = userEvent.setup();
    render(<AiInterpretation interpretation={null} isGenerating={false} onGenerate={onGenerate} />);
    expect(screen.getByText('Phần diễn giải chưa sẵn sàng.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Tạo diễn giải' }));
    expect(onGenerate).toHaveBeenCalled();
  });

  it('shows a distinct generating state while a retry is in flight', () => {
    render(<AiInterpretation interpretation={null} isGenerating onGenerate={jest.fn()} />);
    expect(screen.getByText('Đang viết phần diễn giải…')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tạo diễn giải' })).toHaveAttribute('aria-busy', 'true');
  });
});
