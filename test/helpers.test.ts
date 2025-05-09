import { describe, it, expect } from 'vitest';
import { buildRollupCaches } from '../src/helpers';

// This test will clone a repo and read files, so it may be slow and require network access.
describe('buildRollupCaches', () => {
  it('should build the rollup cache and match the snapshot', async () => {
    const result = await buildRollupCaches();
    expect(result).toMatchSnapshot();
  });
});
