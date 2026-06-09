export type BodyPartType = 'head' | 'torso' | 'leftArm' | 'rightArm' | 'leftLeg' | 'rightLeg';

export type OverlayPartType =
    | 'backHair'
    | 'frontHair'
    | 'eyes'
    | 'eyebrows'
    | 'nose'
    | 'mouth'
    | 'clothes'
    | 'pants'
    | 'shoes';

export type FacingMode = 'front' | 'back';

export type PartType = BodyPartType | OverlayPartType;

export type BoneName =
    | 'root'
    | 'neck'
    | 'headTop'
    | 'leftShoulder'
    | 'rightShoulder'
    | 'leftElbow'
    | 'rightElbow'
    | 'leftHand'
    | 'rightHand'
    | 'hip'
    | 'leftKnee'
    | 'rightKnee'
    | 'leftFoot'
    | 'rightFoot';

export type Point = {
    x: number;
    y: number;
};

export type BoneDefinition = {
    name: BoneName;
    parent: BoneName | null;
    partType: BodyPartType;
    point: Point;
};

export type BodyPartAsset = {
    id: string;
    type: BodyPartType;
    name: string;
    width: number;
    height: number;
    src: string;
    atlasFrameId: string;
    zIndex: number;
    visible?: boolean;
    pivot: Point;
    position: Point;
};

export type OverlayBindingTarget = {
    partType: BodyPartType;
    boneName?: BoneName;
};

export type OverlayPartAsset = {
    id: string;
    type: OverlayPartType;
    name: string;
    width: number;
    height: number;
    src: string;
    atlasFrameId: string;
    zIndex: number;
    visible?: boolean;
    defaultTarget: OverlayBindingTarget;
    selectedTarget: OverlayBindingTarget;
    relativePosition: Point;
};

export type FacingRigLayer = {
    bodyParts: BodyPartAsset[];
    overlays: OverlayPartAsset[];
    bones: BoneDefinition[];
};

export type WalkCycleConfig = {
    speed: number;
    armSwing: number;
    legSwing: number;
    bodyBounce: number;
};

export type PreviewSelection = {
    bodyPartIds: Partial<Record<BodyPartType, string>>;
    overlayPartIds: Partial<Record<OverlayPartType, string>>;
};

export type EditorAtlasFrame = {
    frame: { x: number; y: number; w: number; h: number };
    rotated: false;
    trimmed: true;
    spriteSourceSize: { x: number; y: number; w: number; h: number };
    sourceSize: { w: number; h: number };
    anchor: { x: number; y: number };
};

export type EditorAtlasBundle = {
    frames: Record<string, EditorAtlasFrame>;
    meta: {
        image: string;
        format: 'RGBA8888';
        size: { w: number; h: number };
        scale: '1';
    };
};

export type AvatarRigConfig = {
    version: 1;
    canvasSize: number;
    facing: Record<FacingMode, FacingRigLayer>;
    parentMap: Record<OverlayPartType, BodyPartType[]>;
    walkCycle: WalkCycleConfig;
    previewSelection: PreviewSelection;
    activeFacing: FacingMode;
    exportedAt: string;
};

export type SavedAvatarRig = {
    atlas: EditorAtlasBundle;
    rig: AvatarRigConfig;
};

export type SavedOverlayFacingConfig = {
    imageUrl: string;
    width: number;
    height: number;
    relativePosition: Point;
    zIndex: number;
    visible?: boolean;
    selectedTarget: OverlayBindingTarget;
};

export type SavedOverlayConfig = {
    version: 1;
    partType: OverlayPartType;
    name: string;
    slug: string;
    front?: SavedOverlayFacingConfig;
    back?: SavedOverlayFacingConfig;
    thumbnailFacing: FacingMode;
    updatedAt: string;
};

export type SavedOverlayCatalogEntry = {
    partType: OverlayPartType;
    name: string;
    slug: string;
    configUrl: string;
    thumbnailUrl: string;
    frontImageUrl?: string;
    backImageUrl?: string;
    updatedAt: string;
};

export type SavedBodyBundleCatalogEntry = {
    name: string;
    slug: string;
    bundleUrl: string;
    updatedAt: string;
};

export type JsonPreviewMode = 'rig' | 'atlas' | 'bundle';

export type UploadKind = 'body' | 'overlay';

export type SettingsTabId = 'assets' | 'bones' | 'overlays' | 'json';