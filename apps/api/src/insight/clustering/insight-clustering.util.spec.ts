import { clusterReflections, SINGLETON_MIN_SCORE, type ClusterEdge } from './insight-clustering.util';

describe('clusterReflections', () => {
  it('groups directly-connected reflections into one cluster', () => {
    const edges: ClusterEdge[] = [{ reflectionAId: 'r1', reflectionBId: 'r2', type: 'SUPPORTS', reason: 'x' }];
    const clusters = clusterReflections(['r1', 'r2'], new Map([['r1', 10], ['r2', 10]]), edges);
    expect(clusters).toHaveLength(1);
    expect(clusters[0]!.reflectionIds.sort()).toEqual(['r1', 'r2']);
    expect(clusters[0]!.edges).toHaveLength(1);
  });

  it('transitively groups a chain of relationships into a single cluster', () => {
    const edges: ClusterEdge[] = [
      { reflectionAId: 'r1', reflectionBId: 'r2', type: 'SUPPORTS', reason: 'x' },
      { reflectionAId: 'r2', reflectionBId: 'r3', type: 'CONTINUES', reason: 'y' },
    ];
    const clusters = clusterReflections(['r1', 'r2', 'r3'], new Map([['r1', 10], ['r2', 10], ['r3', 10]]), edges);
    expect(clusters).toHaveLength(1);
    expect(clusters[0]!.reflectionIds.sort()).toEqual(['r1', 'r2', 'r3']);
    expect(clusters[0]!.edges).toHaveLength(2);
  });

  it('never merges two reflections with no connecting edge', () => {
    const clusters = clusterReflections(['r1', 'r2'], new Map([['r1', 10], ['r2', 10]]), []);
    expect(clusters).toHaveLength(0); // both below the singleton floor, no edges -> no clusters at all
  });

  it('includes a standalone reflection as its own cluster only when its score meets the singleton floor', () => {
    const strong = clusterReflections(['r1'], new Map([['r1', SINGLETON_MIN_SCORE]]), []);
    expect(strong).toHaveLength(1);
    expect(strong[0]!.reflectionIds).toEqual(['r1']);
    expect(strong[0]!.edges).toEqual([]);

    const weak = clusterReflections(['r1'], new Map([['r1', SINGLETON_MIN_SCORE - 1]]), []);
    expect(weak).toHaveLength(0);
  });

  it('ignores an edge referencing a reflection outside the current snapshot', () => {
    const edges: ClusterEdge[] = [{ reflectionAId: 'r1', reflectionBId: 'expired-r', type: 'SUPPORTS', reason: 'x' }];
    const clusters = clusterReflections(['r1'], new Map([['r1', SINGLETON_MIN_SCORE]]), edges);
    expect(clusters).toHaveLength(1);
    expect(clusters[0]!.reflectionIds).toEqual(['r1']);
    expect(clusters[0]!.edges).toEqual([]);
  });
});
