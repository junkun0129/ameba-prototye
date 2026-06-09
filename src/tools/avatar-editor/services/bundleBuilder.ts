import { CANVAS_SIZE } from '@/tools/avatar-editor/constants';
import type {
    AvatarRigConfig,
    BodyPartAsset,
    EditorAtlasBundle,
    EditorAtlasFrame,
    FacingMode,
    SavedAvatarRig,
} from '@/tools/avatar-editor/types';
import { getOverlayAnchorPoint, sortRenderableParts } from './helpers';
import { createPlaceholderDataUrl } from '../rendering/pixiRenderer';

export function buildAtlasBundle(rig: AvatarRigConfig): EditorAtlasBundle {
    const frames: Record<string, EditorAtlasFrame> = {};
    const facingEntries = Object.entries(rig.facing) as Array<[FacingMode, AvatarRigConfig['facing'][FacingMode]]>;
    let cursorX = 0;
    let rowHeight = 0;
    const gap = 4;

    facingEntries.forEach(([facing, layer]) => {
        const ordered = sortRenderableParts(layer.bodyParts, layer.overlays);
        ordered.forEach(part => {
            const width = Math.max(1, Math.round(part.width));
            const height = Math.max(1, Math.round(part.height));
            const sourcePosition = 'position' in part
                ? part.position
                : {
                    x: getOverlayAnchorPoint(part, layer.bones, layer.bodyParts).x + part.relativePosition.x,
                    y: getOverlayAnchorPoint(part, layer.bones, layer.bodyParts).y + part.relativePosition.y,
                };
            frames[`${facing}:${part.atlasFrameId}`] = {
                frame: { x: cursorX, y: 0, w: width, h: height },
                rotated: false,
                trimmed: true,
                spriteSourceSize: {
                    x: Math.round(sourcePosition.x - width / 2),
                    y: Math.round(sourcePosition.y - height / 2),
                    w: width,
                    h: height,
                },
                sourceSize: { w: CANVAS_SIZE, h: CANVAS_SIZE },
                anchor: { x: 0.5, y: 0.5 },
            };
            cursorX += width + gap;
            rowHeight = Math.max(rowHeight, height);
        });
    });

    return {
        frames,
        meta: {
            image: 'avatar-spritesheet.png',
            format: 'RGBA8888',
            size: { w: Math.max(cursorX - gap, 1), h: Math.max(rowHeight, 1) },
            scale: '1',
        },
    };
}

export function buildBundle(rig: AvatarRigConfig): SavedAvatarRig {
    const nextRig = {
        ...rig,
        exportedAt: new Date().toISOString(),
    };
    return {
        atlas: buildAtlasBundle(nextRig),
        rig: nextRig,
    };
}

export function withPlaceholderAssets(rig: AvatarRigConfig): AvatarRigConfig {
    const placeholders = {
        head: { fill: '#f5d781', stroke: '#d8a843', detail: '#fef8e7' },
        torso: { fill: '#a1d26e', stroke: '#6ba02a', detail: '#e4f9bb' },
        leftArm: { fill: '#f5a85e', stroke: '#ce7825', detail: '#fdd9b5' },
        rightArm: { fill: '#f5a85e', stroke: '#ce7825', detail: '#fdd9b5' },
        leftLeg: { fill: '#8c82dd', stroke: '#4c4399', detail: '#e6e2ff' },
        rightLeg: { fill: '#8c82dd', stroke: '#4c4399', detail: '#e6e2ff' },
        pants: { fill: '#8c82dd', stroke: '#4c4399', detail: '#e6e2ff' },
    };

    const replacer = (part: BodyPartAsset) => {
        if (part.src) return part;
        const placeholder = placeholders[part.type as keyof typeof placeholders];
        return placeholder ? { ...part, src: createPlaceholderDataUrl(part.type, placeholder) } : part;
    };

    return {
        ...rig,
        facing: {
            front: {
                ...rig.facing.front,
                bodyParts: rig.facing.front.bodyParts.map(replacer),
            },
            back: {
                ...rig.facing.back,
                bodyParts: rig.facing.back.bodyParts.map(replacer),
            },
        },
    };
}
