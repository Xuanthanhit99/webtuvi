import { landingCopy } from '@/content/landing-copy';
import { Constellation } from './constellation';

export function ProblemSolution() {
  const { problem, solution } = landingCopy;
  return (
    <section aria-labelledby="problem-heading" className="border-b border-border-subtle py-16 desktop:py-24">
      <h2 id="problem-heading" className="sr-only">
        The problem BeaconVie solves
      </h2>
      <div className="mx-auto grid max-w-content gap-6 px-4 desktop:grid-cols-2 desktop:px-8">
        {problem.lines.map((line) => (
          <p key={line} className="text-heading-md font-display text-text-primary">
            {line}
          </p>
        ))}
      </div>
      <div className="relative mx-auto mt-16 max-w-reading px-4 text-center desktop:px-8">
        <Constellation density="low" />
        <p className="relative text-body-lg text-text-secondary">{solution.text}</p>
      </div>
    </section>
  );
}
