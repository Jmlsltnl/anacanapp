// Birləşdir — match-3 level configuration (20 starting levels, 3 comfortable tiers).

export const TOTAL_LEVELS = 20;
export const BOARD_ROWS = 8;
export const BOARD_COLS = 8;

export interface BirlesdirLevelConfig {
  level: number;
  movesLimit: number;
  targetScore: number;
  tileTypesCount: number;
  tierName: string;
  // Per-tier score multiplier applied on top of raw clear/combo scoring, so the
  // displayed target-score curve climbs smoothly across all 20 levels even
  // though higher tiers use more tile types (which makes matches rarer and
  // raw achievable scores lower). Calibrated against random-playthrough
  // simulation so an average round lands around the 1-star mark with room
  // for skilled/lucky play to reach 2-3 stars.
  scoreMultiplier: number;
}

interface Tier {
  name: string;
  minLevel: number;
  maxLevel: number;
  movesBase: number;
  movesStep: number;
  tileTypesCount: number;
  scoreMultiplier: number;
}

// Smooth, always-increasing target curve across all 20 levels (independent of
// tier so the numbers always feel like real progression to the player).
const TARGET_BASE = 800;
const TARGET_STEP = 150;

const TIERS: Tier[] = [
  { name: 'Asan', minLevel: 1, maxLevel: 7, movesBase: 24, movesStep: 1, tileTypesCount: 5, scoreMultiplier: 0.47 },
  { name: 'Orta', minLevel: 8, maxLevel: 14, movesBase: 26, movesStep: 1, tileTypesCount: 6, scoreMultiplier: 1.34 },
  { name: 'Çətin', minLevel: 15, maxLevel: 20, movesBase: 28, movesStep: 1, tileTypesCount: 7, scoreMultiplier: 1.94 },
];

export const TIER_NAMES = TIERS.map((t) => t.name);

function getTier(level: number): Tier {
  return TIERS.find((t) => level >= t.minLevel && level <= t.maxLevel) || TIERS[TIERS.length - 1];
}

export function getLevelConfig(level: number): BirlesdirLevelConfig {
  const lvl = Math.min(Math.max(level, 1), TOTAL_LEVELS);
  const tier = getTier(lvl);
  const offset = lvl - tier.minLevel;

  return {
    level: lvl,
    movesLimit: tier.movesBase + tier.movesStep * offset,
    targetScore: Math.round(TARGET_BASE + TARGET_STEP * (lvl - 1)),
    tileTypesCount: tier.tileTypesCount,
    tierName: tier.name,
    scoreMultiplier: tier.scoreMultiplier,
  };
}

export function getLevelSections(): { label: string; levels: number[] }[] {
  return TIERS.map((tier) => ({
    label: tier.name,
    levels: Array.from({ length: tier.maxLevel - tier.minLevel + 1 }, (_, i) => tier.minLevel + i),
  }));
}

export function getStarsForScore(score: number, targetScore: number): 0 | 1 | 2 | 3 {
  if (score < targetScore) return 0;
  if (score >= targetScore * 1.5) return 3;
  if (score >= targetScore * 1.2) return 2;
  return 1;
}
