import { screen } from '@testing-library/react';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AiInterpretation } from './ai-interpretation';

describe('AiInterpretation', () => {
  it('labels AI-generated text as AI Interpretation, distinct from the deterministic result above it', () => {
    render(<AiInterpretation interpretation="A grounded reflection." isGenerating={false} onGenerate={jest.fn()} />);
    expect(screen.getByText('AI Interpretation')).toBeInTheDocument();
    expect(screen.getByText('A grounded reflection.')).toBeInTheDocument();
    expect(screen.getByText(/never chooses or changes it/)).toBeInTheDocument();
  });

  it('shows a not-ready state with a retry action when there is no interpretation yet', async () => {
    const onGenerate = jest.fn();
    const user = userEvent.setup();
    render(<AiInterpretation interpretation={null} isGenerating={false} onGenerate={onGenerate} />);
    expect(screen.getByText('Interpretation isn’t ready yet.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Generate interpretation' }));
    expect(onGenerate).toHaveBeenCalled();
  });

  it('shows a distinct generating state while a retry is in flight', () => {
    render(<AiInterpretation interpretation={null} isGenerating onGenerate={jest.fn()} />);
    expect(screen.getByText('Writing your interpretation…')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Generate interpretation' })).toHaveAttribute('aria-busy', 'true');
  });
});
