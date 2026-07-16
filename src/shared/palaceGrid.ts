import type { BranchId } from '@/domain/zwdsTypes';

// ── Explicit, tested 4×4 perimeter layout ──────────────────
// The traditional ZWDS chart fixes each Earthly Branch to a
// geometric cell. Palace roles are then placed into the cell
// that holds their branch. The 2×2 centre stays empty.
//
//   SI   WU   WEI  SHEN
//   CHEN  ·    ·   YOU
//   MAO   ·    ·   XU
//   YIN  CHOU  ZI   HAI

export interface GridCell {
  branchId: BranchId;
  col: number; // 1-based grid-column
  row: number; // 1-based grid-row
}

export const PALACE_GRID_LAYOUT: readonly GridCell[] = Object.freeze([
  Object.freeze({ branchId: 'SI', col: 1, row: 1 }),
  Object.freeze({ branchId: 'WU', col: 2, row: 1 }),
  Object.freeze({ branchId: 'WEI', col: 3, row: 1 }),
  Object.freeze({ branchId: 'SHEN', col: 4, row: 1 }),
  Object.freeze({ branchId: 'CHEN', col: 1, row: 2 }),
  Object.freeze({ branchId: 'YOU', col: 4, row: 2 }),
  Object.freeze({ branchId: 'MAO', col: 1, row: 3 }),
  Object.freeze({ branchId: 'XU', col: 4, row: 3 }),
  Object.freeze({ branchId: 'YIN', col: 1, row: 4 }),
  Object.freeze({ branchId: 'CHOU', col: 2, row: 4 }),
  Object.freeze({ branchId: 'ZI', col: 3, row: 4 }),
  Object.freeze({ branchId: 'HAI', col: 4, row: 4 }),
]);

export function cellForBranch(branchId: BranchId): GridCell {
  const cell = PALACE_GRID_LAYOUT.find((c) => c.branchId === branchId);
  if (!cell) throw new Error(`No grid cell for branch ${branchId}`);
  return cell;
}

// ── Adjacency-invariant helpers (shared by UI and tests) ──

/** The 12 perimeter ring neighbours in clockwise order. */
export const RING_ORDER: readonly BranchId[] = Object.freeze([
  'SI', 'WU', 'WEI', 'SHEN', 'YOU', 'XU', 'HAI', 'ZI', 'CHOU', 'YIN', 'MAO', 'CHEN',
]);

/** Branch opposite on the ring (6 steps away). */
export function oppositeBranch(branchId: BranchId): BranchId {
  const i = RING_ORDER.indexOf(branchId);
  if (i === -1) throw new Error(`Unknown branch ${branchId}`);
  return RING_ORDER[(i + 6) % 12];
}

/** The two trine (Sān Fāng) partners: 4 steps either way. */
export function trineBranches(branchId: BranchId): [BranchId, BranchId] {
  const i = RING_ORDER.indexOf(branchId);
  if (i === -1) throw new Error(`Unknown branch ${branchId}`);
  return [RING_ORDER[(i + 4) % 12], RING_ORDER[(i + 8) % 12]];
}
