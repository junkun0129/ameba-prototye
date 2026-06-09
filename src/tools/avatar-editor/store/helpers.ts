import type { AvatarRigConfig, BodyPartAsset, BodyPartType, FacingMode, OverlayPartAsset, OverlayPartType } from '@/tools/avatar-editor/types';

export function updateRigBodyPart(rig: AvatarRigConfig, partType: BodyPartType, updater: (part: BodyPartAsset) => BodyPartAsset, facing: FacingMode = rig.activeFacing) {
    return {
        ...rig,
        facing: {
            ...rig.facing,
            [facing]: {
                ...rig.facing[facing],
                bodyParts: rig.facing[facing].bodyParts.map(part => (part.type === partType ? updater(part) : part)),
            },
        },
    };
}

export function updateRigOverlay(rig: AvatarRigConfig, overlayType: OverlayPartType, updater: (part: OverlayPartAsset) => OverlayPartAsset, facing: FacingMode = rig.activeFacing) {
    return {
        ...rig,
        facing: {
            ...rig.facing,
            [facing]: {
                ...rig.facing[facing],
                overlays: rig.facing[facing].overlays.map(part => (part.type === overlayType ? updater(part) : part)),
            },
        },
    };
}

export function mergeBodyRig(current: AvatarRigConfig, incoming: AvatarRigConfig): AvatarRigConfig {
    return {
        ...current,
        canvasSize: incoming.canvasSize || current.canvasSize,
        walkCycle: incoming.walkCycle || current.walkCycle,
        parentMap: incoming.parentMap || current.parentMap,
        activeFacing: 'front', // bundle 適用後は常に front に戻す
        previewSelection: {
            bodyPartIds: incoming.previewSelection?.bodyPartIds || current.previewSelection.bodyPartIds,
            overlayPartIds: current.previewSelection.overlayPartIds,
        },
        facing: {
            front: {
                ...current.facing.front,
                bodyParts: incoming.facing.front.bodyParts,
                bones: incoming.facing.front.bones,
                overlays: current.facing.front.overlays,
            },
            back: {
                ...current.facing.back,
                bodyParts: incoming.facing.back.bodyParts,
                bones: incoming.facing.back.bones,
                overlays: current.facing.back.overlays,
            },
        },
    };
}

export function stripOverlaysFromRig(rig: AvatarRigConfig, currentOverlays?: AvatarRigConfig['facing']) {
    return {
        ...rig,
        facing: {
            front: {
                ...rig.facing.front,
                overlays: currentOverlays?.front.overlays ?? rig.facing.front.overlays,
            },
            back: {
                ...rig.facing.back,
                overlays: currentOverlays?.back.overlays ?? rig.facing.back.overlays,
            },
        },
    } satisfies AvatarRigConfig;
}
