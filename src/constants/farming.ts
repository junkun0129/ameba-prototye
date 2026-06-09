import type { CropType } from '@/lib/types';

export const FARM_GRID_SIZE = 3;
export const CROP_GROWTH_MS = 15 * 60 * 1000;

export const MAX_STAMINA = 50;
export const STAMINA_RECOVERY_MS = 60 * 1000;

export const DAILY_HELPER_WATER_LIMIT = 20;
export const DAILY_KITAYO_LIMIT = 10;

export const WATER_YIELD_BONUS_PER = 0.08;
export const WATER_RARE_BONUS_PER = 0.03;
export const WATER_BONUS_CAP = 10;

export const BASE_HARVEST_POINT = 10;
export const BASE_PLANT_POINT = 1;
export const BASE_HELPER_WATER_POINT = 3;
export const BASE_KITAYO_POINT = 1;
export const BASE_DAILY_LOGIN_POINT = 50;

export const QUEST_HARVEST_TARGET = 5;
export const QUEST_HELPER_TARGET = 10;
export const QUEST_HARVEST_REWARD = 200;
export const QUEST_HELPER_REWARD = 220;

export const SELL_PRICE: Record<CropType, number> = {
    tomato: 14,
    carrot: 12,
    pumpkin: 18,
    eggplant: 16,
    corn: 15,
};

export const CROP_DEFS: Record<
    CropType,
    {
        name: string;
        stages: [string, string, string, string];
        harvestEmoji: string;
    }
> = {
    tomato: {
        name: 'トマト',
        stages: ['🌱', '🌿', '🌼', '🍅'],
        harvestEmoji: '🍅',
    },
    carrot: {
        name: 'にんじん',
        stages: ['🌱', '🌿', '🌸', '🥕'],
        harvestEmoji: '🥕',
    },
    pumpkin: {
        name: 'かぼちゃ',
        stages: ['🌱', '🌿', '🌼', '🎃'],
        harvestEmoji: '🎃',
    },
    eggplant: {
        name: 'なす',
        stages: ['🌱', '🌿', '🌸', '🍆'],
        harvestEmoji: '🍆',
    },
    corn: {
        name: 'とうもろこし',
        stages: ['🌱', '🌾', '🌼', '🌽'],
        harvestEmoji: '🌽',
    },
};

export function getLocalDateKey(now = new Date()): string {
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

export function cropGrowthStage(plantedAt: number, now = Date.now()): 0 | 1 | 2 | 3 {
    const elapsed = Math.max(0, now - plantedAt);
    const ratio = Math.min(1, elapsed / CROP_GROWTH_MS);
    if (ratio < 0.25) return 0;
    if (ratio < 0.5) return 1;
    if (ratio < 0.75) return 2;
    return 3;
}

export function cropIsMature(plantedAt: number, now = Date.now()): boolean {
    return now - plantedAt >= CROP_GROWTH_MS;
}

export function wateringBonusMultiplier(wateredCount: number): number {
    const effective = Math.min(wateredCount, WATER_BONUS_CAP);
    return 1 + effective * WATER_YIELD_BONUS_PER;
}

export function rareDropChance(wateredCount: number): number {
    const base = 0.08;
    const effective = Math.min(wateredCount, WATER_BONUS_CAP);
    return Math.min(0.6, base + effective * WATER_RARE_BONUS_PER);
}
