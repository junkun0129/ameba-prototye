import {
    BODY_PART_ORDER,
    CANVAS_SIZE,
    DEFAULT_WALK_CYCLE,
    OVERLAY_PART_ORDER,
    OVERLAY_PARENT_OPTIONS,
    createDefaultBodyParts,
    createDefaultBones,
    createDefaultOverlayParts,
} from '@/tools/avatar-editor/constants';
import type {
    AvatarRigConfig,
    BodyPartAsset,
    FacingMode,
    OverlayPartAsset,
    PreviewSelection,
} from '@/tools/avatar-editor/types';

export function createDefaultPreviewSelection(): PreviewSelection {
    return {
        bodyPartIds: Object.fromEntries(createDefaultBodyParts().map(part => [part.type, part.id])) as PreviewSelection['bodyPartIds'],
        overlayPartIds: Object.fromEntries(createDefaultOverlayParts().map(part => [part.type, part.id])) as PreviewSelection['overlayPartIds'],
    };
}

export function createDefaultRig(): AvatarRigConfig {
    return {
        version: 1,
        canvasSize: CANVAS_SIZE,
        facing: {
            front: {
                bodyParts: createDefaultBodyParts(),
                overlays: createDefaultOverlayParts().map(part => ({
                    ...part,
                    visible: true,
                })),
                bones: createDefaultBones(),
            },
            back: {
                bodyParts: createDefaultBodyParts().map(part => ({
                    ...part,
                    zIndex: part.type === 'head' ? 58 : part.zIndex,
                })),
                overlays: createDefaultOverlayParts().map(part => ({
                    ...part,
                    relativePosition: part.type === 'backHair' ? { x: 0, y: -2 } : part.relativePosition,
                    zIndex: part.type === 'backHair' ? 84 : part.zIndex,
                    visible: true,
                })),
                bones: createDefaultBones(),
            },
        },
        parentMap: structuredClone(OVERLAY_PARENT_OPTIONS),
        walkCycle: structuredClone(DEFAULT_WALK_CYCLE),
        previewSelection: createDefaultPreviewSelection(),
        activeFacing: 'front',
        exportedAt: new Date().toISOString(),
    };
}

export function getFacingLayer(rig: AvatarRigConfig, facing: FacingMode) {
    return rig.facing[facing];
}

export function sortRenderableParts(bodyParts: BodyPartAsset[], overlays: OverlayPartAsset[]) {
    const orderedBody = BODY_PART_ORDER.map(type => bodyParts.find(part => part.type === type)).filter((part): part is BodyPartAsset => part !== undefined && part.visible !== false);
    const orderedOverlay = OVERLAY_PART_ORDER.map(type => overlays.find(part => part.type === type)).filter((part): part is OverlayPartAsset => part !== undefined && part.visible !== false);
    return [...orderedBody, ...orderedOverlay].sort((left, right) => left.zIndex - right.zIndex);
}

export { getOverlayAnchorPoint } from './poseMath';
