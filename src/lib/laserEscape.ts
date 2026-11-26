export type LaserDifficulty = "easy" | "normal" | "hard";

export type LaserDifficultyConfig = {
  id: LaserDifficulty;
  waves: number;
  reward: number;
  enemyScale: number;
  bossHp: number;
  labelKey: "easyDifficulty" | "normalDifficulty" | "hardDifficulty";
  descriptionKey: "easyDifficultyDesc" | "normalDifficultyDesc" | "hardDifficultyDesc";
};

export const LASER_DIFFICULTIES: Record<LaserDifficulty, LaserDifficultyConfig> = {
  easy: {
    id: "easy",
    waves: 3,
    reward: 250,
    enemyScale: 0.72,
    bossHp: 22,
    labelKey: "easyDifficulty",
    descriptionKey: "easyDifficultyDesc",
  },
  normal: {
    id: "normal",
    waves: 5,
    reward: 500,
    enemyScale: 1,
    bossHp: 38,
    labelKey: "normalDifficulty",
    descriptionKey: "normalDifficultyDesc",
  },
  hard: {
    id: "hard",
    waves: 6,
    reward: 750,
    enemyScale: 1.38,
    bossHp: 66,
    labelKey: "hardDifficulty",
    descriptionKey: "hardDifficultyDesc",
  },
};
