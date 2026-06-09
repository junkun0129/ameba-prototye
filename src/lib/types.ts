export type Direction = 'FL' | 'FR' | 'BL' | 'BR';
export type AvatarState = 'idle' | 'walking' | 'sitting' | 'sleeping' | 'wave' | 'dance' | 'jump';
export type AvatarExpression = 'normal' | 'smile' | 'angry' | 'sad' | 'wink';
export type EyeStyle = 'round' | 'sparkle' | 'cool' | 'droop';
export type MouthStyle = 'smile' | 'dot' | 'ho' | 'cat';
export type HairStyle = 'bob' | 'long' | 'twin' | 'pony' | 'spiky' | 'none';
export type ShirtStyle = 'tshirt' | 'longsleeve' | 'tanktop' | 'hoodie' | 'bear';
export type PantsStyle = 'shorts' | 'pants' | 'skirt';
export type TabId = 'chat' | 'avatar' | 'actions' | 'room' | 'outing' | 'farming';

export type CropType = 'tomato' | 'carrot' | 'pumpkin' | 'eggplant' | 'corn';

export type FarmPlot = {
    id: string;
    gx: number;
    gy: number;
    crop: CropType | null;
    plantedAt: number | null;
    wateredCount: number;
};

export type DailyCounters = {
    localDateKey: string;
    helperWaterCount: number;
    kitaYoCount: number;
    dailyLoginClaimed: boolean;
};

export type QuestProgress = {
    harvestedCount: number;
    helperWaterCount: number;
    claimedHarvestQuest: boolean;
    claimedHelperQuest: boolean;
};

export type Inventory = {
    crops: Record<CropType, number>;
    rareMaterial: number;
};

export type FarmingState = {
    gardenPlots: FarmPlot[];
    selectedPlotId: string | null;
    inFarmingRoom: boolean;
    selectedSeed: CropType;
    stamina: number;
    points: number;
    inventory: Inventory;
    daily: DailyCounters;
    quest: QuestProgress;
    isVisitingMode: boolean;
    farmNotice: string | null;
    lastStaminaRefillAt: number;
};

export type NatStatus = 'unknown' | 'detecting' | 'open' | 'symmetric_nat' | 'udp_blocked';

export type RoomInfo = {
    id: string;
    name: string;
    occupants: number;
    capacity: number;
};

export type AvatarAppearance = {
    expression: AvatarExpression;
    eyeStyle: EyeStyle;
    mouthStyle: MouthStyle;
    hairStyle: HairStyle;
    shirtStyle: ShirtStyle;
    pantsStyle: PantsStyle;
    skinColor: string;
    hairColor: string;
    shirtColor: string;
    pantsColor: string;
    shoeColor: string;
    glasses: boolean;
    nekomimi: boolean;
};

export type AvatarModel = AvatarAppearance & {
    x: number;
    y: number;
    targetX: number;
    targetY: number;
    dir: Direction;
    state: AvatarState;
    actionTimer: number;
    walkCycle: number;
    blinkTimer: number;
    blinkFrames: number;
    watering: boolean;
    queueSit: boolean;
    queueWater: boolean;
};

export type FurnitureId = 'sofa' | 'plant' | 'pet';

export type FurnitureItem = {
    id: FurnitureId;
    gx: number;
    gy: number;
    width: number;
    height: number;
};

export type PetState = {
    x: number;
    y: number;
    bounceTimer: number;
};

export type Stamp = {
    id: string;
    emoji: string;
    gx: number;
    gy: number;
};

export type NetworkState = {
    natStatus: NatStatus;
    natErrorMessage: string | null;
    isNatChecking: boolean;
    currentRoomId: string | null;
    isRoomHost: boolean;
    pollingEnabled: boolean;
    rooms: RoomInfo[];
};

export type RoomTheme = {
    wallLeft: string;
    wallRight: string;
    wallTrim: string;
    floorStyle: 'carpet' | 'wood';
};
