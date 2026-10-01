import catalog from './catalog.json';
import { getLevelProfile, makeLevel, normalizeLevel, rulesForProfile, type ColorSortLevel } from './difficulty';
import { pour, replaySolution, validateBoard, type Board, type Move } from './engine';
import { permuteLevel } from './generator';

export const BUNDLED_LEVELS: ColorSortLevel[] = catalog.map(item => makeLevel(getLevelProfile(item.level), item.seed, item.board,
  item.solution.map(([from, to]) => ({ from, to }))));
const CACHE_PREFIX = 'anacan_colorsort_level_v1_';

export function validateLevel(value: unknown, expectedLevel: number): value is ColorSortLevel {
  if (!value || typeof value !== 'object') return false;
  const level = value as ColorSortLevel, profile = getLevelProfile(expectedLevel);
  return level.version === 1 && level.level === profile.level && Number.isInteger(level.seed)
    && level.colors === profile.colors && level.emptyTubes === profile.emptyTubes && level.lockedTubes === profile.lockedTubes
    && level.hiddenTubes === profile.hiddenTubes && level.hiddenDepth === profile.hiddenDepth && level.difficulty === profile.difficulty
    && level.limitedMoves === profile.limitedMoves && level.rules?.capacity === 4 && Array.isArray(level.rules.locks)
    && level.rules.locks.length === profile.lockedTubes && validateBoard(level.board, level.colors, level.rules)
    && JSON.stringify(level.rules.locks.map(lock => lock.after).sort()) === JSON.stringify(rulesForProfile(profile).locks.map(lock => lock.after).sort())
    && level.board.length === profile.colors + profile.emptyTubes + profile.lockedTubes
    && level.rules.locks.every(lock => level.board[lock.tube].length === 0)
    && Array.isArray(level.solution) && level.solution.length > 0 && level.solution.length <= 120
    && level.solution.every(move => move && Number.isInteger(move.from) && Number.isInteger(move.to))
    && level.parMoves === level.solution.length
    && (profile.limitedMoves ? Number.isInteger(level.moveLimit) && level.moveLimit! >= level.parMoves && level.moveLimit! <= 240 : level.moveLimit === null)
    && !!replaySolution(level.board, level.rules, level.solution);
}

export function getCachedLevel(input: number): ColorSortLevel | null {
  const level = normalizeLevel(input);
  const bundled = BUNDLED_LEVELS.find(item => item.level === level);
  if (bundled) return structuredClone(bundled);
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_PREFIX + level) || 'null');
    if (validateLevel(cached, level)) return cached;
  } catch { /* Offline/private storage failure does not block play. */ }
  return null;
}

export function cacheLevel(level: ColorSortLevel): void {
  try { localStorage.setItem(CACHE_PREFIX + level.level, JSON.stringify(level)); } catch { /* memory-only play */ }
}

export function getFallbackLevel(input: number): ColorSortLevel {
  const level = normalizeLevel(input);
  const bundled = BUNDLED_LEVELS.find(item => item.level === level);
  if (bundled) return structuredClone(bundled);
  const templates = BUNDLED_LEVELS.filter(item => item.level >= 28);
  return permuteLevel(templates[(level - 31) % templates.length], level);
}

export function knownSolutionMove(definition: ColorSortLevel, board: Board): Move | null {
  const expected = JSON.stringify(board);
  let current = definition.board;
  for (const move of definition.solution) {
    if (JSON.stringify(current) === expected) return move;
    const result = pour(current, definition.rules, move);
    if (!result) break;
    current = result.board;
  }
  return null;
}
