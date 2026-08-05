import { InsightDataSourceService } from './insight-data-source.service';
import type { PrismaService } from '../../prisma/prisma.service';
import { makeReflection, makeSourceRef } from '../test-fixtures';

const OWNER = 'user-1';

function makePrisma(reflections: ReturnType<typeof makeReflection>[], sourcesByReflection: Map<string, ReturnType<typeof makeSourceRef>[]>, memories: { id: string; importanceScore: number }[]) {
  return {
    reflectionCandidate: {
      findMany: jest.fn(async ({ where }: { where: { state?: unknown } }) => {
        // EXPIRED must be structurally excluded — verified by inspecting the where clause itself.
        expect(where.state).toEqual({ not: 'EXPIRED' });
        return reflections.map((r) => ({ ...r, sources: sourcesByReflection.get(r.id) ?? [] }));
      }),
    },
    memory: {
      findMany: jest.fn(async ({ where }: { where: { id: { in: string[] } } }) => memories.filter((m) => where.id.in.includes(m.id))),
    },
  };
}

describe('InsightDataSourceService', () => {
  it('fetches reflections with an EXPIRED-excluding query and returns memory importance for MEMORY sources', async () => {
    const r1 = makeReflection({ id: 'r1' });
    const sources = new Map([['r1', [makeSourceRef({ sourceType: 'MEMORY', sourceId: 'm1', reflectionCandidateId: 'r1' })]]]);
    const prisma = makePrisma([r1], sources, [{ id: 'm1', importanceScore: 72 }]);
    const service = new InsightDataSourceService(prisma as unknown as PrismaService);

    const data = await service.fetch(OWNER);

    expect(data.reflections).toHaveLength(1);
    expect(data.memoryImportanceById.get('m1')).toBe(72);
  });

  it('returns an empty memory-importance map when no reflection cites a Memory source', async () => {
    const r1 = makeReflection({ id: 'r1' });
    const sources = new Map([['r1', [makeSourceRef({ sourceType: 'JOURNAL', sourceId: 'j1', reflectionCandidateId: 'r1' })]]]);
    const prisma = makePrisma([r1], sources, []);
    const service = new InsightDataSourceService(prisma as unknown as PrismaService);

    const data = await service.fetch(OWNER);

    expect(data.memoryImportanceById.size).toBe(0);
    expect(prisma.memory.findMany).not.toHaveBeenCalled();
  });
});
