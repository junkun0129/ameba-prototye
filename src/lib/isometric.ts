export const GRID_SIZE = 8;
export const TILE_W = 64;
export const TILE_H = 32;
export const ORIGIN_Y = 120;

export function gridToScreen(gx: number, gy: number, originX: number) {
    return {
        x: originX + (gx - gy) * (TILE_W / 2),
        y: ORIGIN_Y + (gx + gy) * (TILE_H / 2),
    };
}

export function screenToGrid(sx: number, sy: number, originX: number) {
    const dx = sx - originX;
    const dy = sy - ORIGIN_Y;
    const u = dx / (TILE_W / 2);
    const v = dy / (TILE_H / 2);
    return {
        x: (u + v) / 2,
        y: (v - u) / 2,
    };
}

export function clampGrid(value: number) {
    return Math.max(0, Math.min(GRID_SIZE - 1, value));
}
