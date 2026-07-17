import { describe, expect, it } from 'vitest';
import { shouldApplyOnlineRevision } from './syncPolicy';

describe('online synchronization policy', () => {
  it('accepts a newer shared state', () => {
    expect(shouldApplyOnlineRevision(4, 5, false)).toBe(true);
  });

  it('rejects stale and duplicate states during normal play', () => {
    expect(shouldApplyOnlineRevision(4, 3, false)).toBe(false);
    expect(shouldApplyOnlineRevision(4, 4, false)).toBe(false);
  });

  it('accepts the current server revision when recovering a failed write', () => {
    expect(shouldApplyOnlineRevision(4, 4, true)).toBe(true);
  });
});
