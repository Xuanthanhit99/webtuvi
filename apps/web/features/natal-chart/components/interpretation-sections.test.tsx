import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { NatalChartInterpretationSectionsDto } from '@beaconvie/types';
import { InterpretationSections } from './interpretation-sections';

const sections: NatalChartInterpretationSectionsDto = {
  overview: 'A grounded, exploratory chart.',
  corePersonality: 'Curious and adaptable.',
  emotionalWorld: 'Feels most at home when moving between ideas.',
  communication: 'Talks things through out loud.',
  loveAndRelationships: 'Values variety and honest exchange.',
  motivation: 'Driven by learning something new.',
  careerDirection: 'Drawn toward roles with variety.',
  strengths: 'Quick to see multiple angles.',
  challenges: 'Can scatter focus across too many threads.',
  keyAspects: 'Sun conjunct Venus — warmth comes easily.',
};

describe('InterpretationSections', () => {
  it('shows a "not ready yet" state with a Generate button when there is no interpretation', () => {
    const onGenerate = jest.fn();
    render(<InterpretationSections interpretation={null} isGenerating={false} onGenerate={onGenerate} />);
    expect(screen.getByText(/interpretation isn.t ready yet/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /generate interpretation/i })).toBeInTheDocument();
  });

  it('shows a generating state', () => {
    render(<InterpretationSections interpretation={null} isGenerating onGenerate={jest.fn()} />);
    expect(screen.getByText(/writing your interpretation/i)).toBeInTheDocument();
  });

  it('the Overview section is expanded by default; the other nine start collapsed', () => {
    render(<InterpretationSections interpretation={sections} isGenerating={false} onGenerate={jest.fn()} />);
    expect(screen.getByText(sections.overview)).toBeInTheDocument();
    expect(screen.queryByText(sections.corePersonality)).not.toBeInTheDocument();
  });

  it('expanding a section reveals its real generated text, never invented client-side', async () => {
    const user = userEvent.setup();
    render(<InterpretationSections interpretation={sections} isGenerating={false} onGenerate={jest.fn()} />);
    await user.click(screen.getByRole('button', { name: 'Core Personality' }));
    expect(screen.getByText(sections.corePersonality)).toBeInTheDocument();
  });

  it('always labels the block as AI-written, distinct from calculated chart data', () => {
    render(<InterpretationSections interpretation={sections} isGenerating={false} onGenerate={jest.fn()} />);
    expect(screen.getByText('AI Interpretation')).toBeInTheDocument();
    expect(screen.getByText(/written by ai/i)).toBeInTheDocument();
  });
});
