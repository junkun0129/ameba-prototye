import type {
    BodyPartAsset,
    BodyPartType,
    BoneDefinition,
    FacingMode,
    OverlayPartAsset,
    OverlayPartType,
    WalkCycleConfig,
} from '@/tools/avatar-editor/types';

export const CANVAS_SIZE = 200;

export const BODY_PART_ORDER: BodyPartType[] = ['leftLeg', 'rightLeg', 'torso', 'leftArm', 'rightArm', 'head'];

export const OVERLAY_PART_ORDER: OverlayPartType[] = [
    'backHair',
    'pants',
    'clothes',
    'shoes',
    'eyebrows',
    'eyes',
    'nose',
    'mouth',
    'frontHair',
];

export const OVERLAY_PARENT_OPTIONS: Record<OverlayPartType, BodyPartType[]> = {
    backHair: ['head'],
    frontHair: ['head'],
    eyes: ['head'],
    eyebrows: ['head'],
    nose: ['head'],
    mouth: ['head'],
    clothes: ['torso', 'leftArm', 'rightArm'],
    pants: ['torso', 'leftLeg', 'rightLeg'],
    shoes: ['leftLeg', 'rightLeg'],
};

export const BODY_PART_LABELS: Record<BodyPartType, string> = {
    head: '頭',
    torso: '胴体',
    leftArm: '左腕',
    rightArm: '右腕',
    leftLeg: '左足',
    rightLeg: '右足',
};

export const OVERLAY_PART_LABELS: Record<OverlayPartType, string> = {
    backHair: '後ろ髪',
    frontHair: '前髪',
    eyes: '目',
    eyebrows: '眉毛',
    nose: '鼻',
    mouth: '口',
    clothes: '服',
    pants: 'ズボン',
    shoes: '靴',
};

export const FACING_LABELS: Record<FacingMode, string> = {
    front: '前向き',
    back: '後ろ向き',
};

export const DEFAULT_BODY_PARTS: BodyPartAsset[] = [
    { id: 'head-default', type: 'head', name: '頭 default', width: 78, height: 76, src: '', atlasFrameId: 'head-default', zIndex: 60, pivot: { x: 100, y: 56 }, position: { x: 100, y: 54 } },
    { id: 'torso-default', type: 'torso', name: '胴体 default', width: 82, height: 74, src: '', atlasFrameId: 'torso-default', zIndex: 40, pivot: { x: 100, y: 96 }, position: { x: 100, y: 110 } },
    { id: 'leftArm-default', type: 'leftArm', name: '左腕 default', width: 38, height: 78, src: '', atlasFrameId: 'leftArm-default', zIndex: 30, pivot: { x: 88, y: 86 }, position: { x: 74, y: 108 } },
    { id: 'rightArm-default', type: 'rightArm', name: '右腕 default', width: 38, height: 78, src: '', atlasFrameId: 'rightArm-default', zIndex: 50, pivot: { x: 112, y: 86 }, position: { x: 126, y: 108 } },
    { id: 'leftLeg-default', type: 'leftLeg', name: '左足 default', width: 36, height: 84, src: '', atlasFrameId: 'leftLeg-default', zIndex: 10, pivot: { x: 92, y: 128 }, position: { x: 91, y: 152 } },
    { id: 'rightLeg-default', type: 'rightLeg', name: '右足 default', width: 36, height: 84, src: '', atlasFrameId: 'rightLeg-default', zIndex: 20, pivot: { x: 108, y: 128 }, position: { x: 109, y: 152 } },
];

export const DEFAULT_OVERLAY_PARTS: OverlayPartAsset[] = [
    { id: 'backHair-default', type: 'backHair', name: '後ろ髪 default', width: 84, height: 88, src: '', atlasFrameId: 'backHair-default', zIndex: 55, defaultTarget: { partType: 'head', boneName: 'neck' }, selectedTarget: { partType: 'head', boneName: 'neck' }, relativePosition: { x: 0, y: -8 } },
    { id: 'frontHair-default', type: 'frontHair', name: '前髪 default', width: 78, height: 38, src: '', atlasFrameId: 'frontHair-default', zIndex: 80, defaultTarget: { partType: 'head', boneName: 'headTop' }, selectedTarget: { partType: 'head', boneName: 'headTop' }, relativePosition: { x: 0, y: -4 } },
    { id: 'eyes-default', type: 'eyes', name: '目 default', width: 36, height: 16, src: '', atlasFrameId: 'eyes-default', zIndex: 82, defaultTarget: { partType: 'head', boneName: 'neck' }, selectedTarget: { partType: 'head', boneName: 'neck' }, relativePosition: { x: 0, y: -4 } },
    { id: 'eyebrows-default', type: 'eyebrows', name: '眉毛 default', width: 40, height: 12, src: '', atlasFrameId: 'eyebrows-default', zIndex: 83, defaultTarget: { partType: 'head', boneName: 'headTop' }, selectedTarget: { partType: 'head', boneName: 'headTop' }, relativePosition: { x: 0, y: -14 } },
    { id: 'nose-default', type: 'nose', name: '鼻 default', width: 10, height: 14, src: '', atlasFrameId: 'nose-default', zIndex: 84, defaultTarget: { partType: 'head', boneName: 'neck' }, selectedTarget: { partType: 'head', boneName: 'neck' }, relativePosition: { x: 0, y: 8 } },
    { id: 'mouth-default', type: 'mouth', name: '口 default', width: 18, height: 12, src: '', atlasFrameId: 'mouth-default', zIndex: 85, defaultTarget: { partType: 'head', boneName: 'neck' }, selectedTarget: { partType: 'head', boneName: 'neck' }, relativePosition: { x: 0, y: 18 } },
    { id: 'clothes-default', type: 'clothes', name: '服 default', width: 96, height: 88, src: '', atlasFrameId: 'clothes-default', zIndex: 65, defaultTarget: { partType: 'torso', boneName: 'root' }, selectedTarget: { partType: 'torso', boneName: 'root' }, relativePosition: { x: 0, y: 0 } },
    { id: 'pants-default', type: 'pants', name: 'ズボン default', width: 88, height: 82, src: '', atlasFrameId: 'pants-default', zIndex: 25, defaultTarget: { partType: 'torso', boneName: 'hip' }, selectedTarget: { partType: 'torso', boneName: 'hip' }, relativePosition: { x: 0, y: 22 } },
    { id: 'shoes-default', type: 'shoes', name: '靴 default', width: 64, height: 24, src: '', atlasFrameId: 'shoes-default', zIndex: 26, defaultTarget: { partType: 'leftLeg', boneName: 'leftFoot' }, selectedTarget: { partType: 'leftLeg', boneName: 'leftFoot' }, relativePosition: { x: 0, y: 22 } },
];

export const DEFAULT_BONES: BoneDefinition[] = [
    { name: 'root', parent: null, partType: 'torso', point: { x: 100, y: 100 } },
    { name: 'neck', parent: 'root', partType: 'head', point: { x: 100, y: 68 } },
    { name: 'headTop', parent: 'neck', partType: 'head', point: { x: 100, y: 34 } },
    { name: 'leftShoulder', parent: 'root', partType: 'leftArm', point: { x: 74, y: 92 } },
    { name: 'rightShoulder', parent: 'root', partType: 'rightArm', point: { x: 126, y: 92 } },
    { name: 'leftElbow', parent: 'leftShoulder', partType: 'leftArm', point: { x: 60, y: 122 } },
    { name: 'rightElbow', parent: 'rightShoulder', partType: 'rightArm', point: { x: 140, y: 122 } },
    { name: 'leftHand', parent: 'leftElbow', partType: 'leftArm', point: { x: 52, y: 152 } },
    { name: 'rightHand', parent: 'rightElbow', partType: 'rightArm', point: { x: 148, y: 152 } },
    { name: 'hip', parent: 'root', partType: 'torso', point: { x: 100, y: 128 } },
    { name: 'leftKnee', parent: 'hip', partType: 'leftLeg', point: { x: 92, y: 154 } },
    { name: 'rightKnee', parent: 'hip', partType: 'rightLeg', point: { x: 108, y: 154 } },
    { name: 'leftFoot', parent: 'leftKnee', partType: 'leftLeg', point: { x: 92, y: 188 } },
    { name: 'rightFoot', parent: 'rightKnee', partType: 'rightLeg', point: { x: 108, y: 188 } },
];

export const DEFAULT_WALK_CYCLE: WalkCycleConfig = {
    speed: 2.2,
    armSwing: 0.3,
    legSwing: 0.42,
    bodyBounce: 3.2,
};

export const DEFAULT_FILE_NAME = 'avatar-rig.json';

export const DEFAULT_ATLAS_FILE_NAME = 'avatar-atlas.json';

export const DEFAULT_BUNDLE_FILE_NAME = 'avatar-bundle.json';

export function createDefaultBodyParts(): BodyPartAsset[] {
    return structuredClone(DEFAULT_BODY_PARTS);
}

export function createDefaultOverlayParts(): OverlayPartAsset[] {
    return structuredClone(DEFAULT_OVERLAY_PARTS);
}

export function createDefaultBones(): BoneDefinition[] {
    return structuredClone(DEFAULT_BONES);
}