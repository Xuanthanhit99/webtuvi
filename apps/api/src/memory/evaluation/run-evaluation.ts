/**
 * Phase 8 CLI entry point — runs MemoryEvaluationService against its checked-in fixtures and
 * writes the resulting report as JSON. Run with:
 *   pnpm --filter api exec ts-node src/memory/evaluation/run-evaluation.ts
 *
 * No database, no NestJS app bootstrap required — the service depends only on pure,
 * in-process logic and fixtures. Output path defaults to
 * docs/progress/sprint-3b-evaluation-report.json (repo root), overridable via argv[2].
 */
import { writeFileSync } from 'fs';
import { resolve } from 'path';
import { MemoryEvaluationService } from './memory-evaluation.service';

function main(): void {
  const outputPath = process.argv[2] ?? resolve(__dirname, '../../../../../docs/progress/sprint-3b-evaluation-report.json');
  const report = new MemoryEvaluationService().run();
  writeFileSync(outputPath, JSON.stringify(report, null, 2) + '\n', 'utf-8');
  // eslint-disable-next-line no-console
  console.log(`Wrote evaluation report to ${outputPath}`);
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(report, null, 2));
}

main();
