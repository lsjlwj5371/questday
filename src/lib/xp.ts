// XP & Level calculation utilities

const DAILY_XP_CAP = 100;
const BASE_MISSION_XP = 10;

/** Calculate XP for completing a mission with streak bonus */
export function calculateMissionXP(streakDays: number): number {
  const streakBonus = streakDays * 2;
  return BASE_MISSION_XP + streakBonus;
}

/** Check if daily XP cap has been reached */
export function canEarnMoreXP(todayXP: number): boolean {
  return todayXP < DAILY_XP_CAP;
}

/** Calculate actual XP to award (respecting daily cap) */
export function awardXP(todayXP: number, earned: number): number {
  const remaining = DAILY_XP_CAP - todayXP;
  if (remaining <= 0) return 0;
  return Math.min(earned, remaining);
}

/** Calculate level from total XP. Level N requires 50 * N * (N+1) cumulative XP */
export function calculateLevel(totalXP: number): number {
  let level = 1;
  while (50 * level * (level + 1) <= totalXP) {
    level++;
  }
  return level;
}

/** XP needed for next level */
export function xpForNextLevel(currentLevel: number): number {
  return 50 * currentLevel * (currentLevel + 1);
}

/** XP progress toward next level (0-100%) */
export function levelProgress(totalXP: number): number {
  const level = calculateLevel(totalXP);
  const currentLevelXP = level > 1 ? 50 * (level - 1) * level : 0;
  const nextLevelXP = 50 * level * (level + 1);
  const progress = ((totalXP - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
  return Math.min(100, Math.max(0, progress));
}

export { DAILY_XP_CAP, BASE_MISSION_XP };
