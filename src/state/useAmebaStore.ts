import { create } from 'zustand';
import {
    BASE_DAILY_LOGIN_POINT,
    BASE_HARVEST_POINT,
    BASE_HELPER_WATER_POINT,
    BASE_KITAYO_POINT,
    BASE_PLANT_POINT,
    DAILY_HELPER_WATER_LIMIT,
    DAILY_KITAYO_LIMIT,
    FARM_GRID_SIZE,
    MAX_STAMINA,
    QUEST_HARVEST_REWARD,
    QUEST_HARVEST_TARGET,
    QUEST_HELPER_REWARD,
    QUEST_HELPER_TARGET,
    SELL_PRICE,
    STAMINA_RECOVERY_MS,
    cropIsMature,
    getLocalDateKey,
    rareDropChance,
    wateringBonusMultiplier,
} from '@/constants/farming';
import type {
    AvatarExpression,
    AvatarModel,
    CropType,
    DailyCounters,
    FarmingState,
    EyeStyle,
    Inventory,
    FurnitureId,
    FurnitureItem,
    HairStyle,
    MouthStyle,
    NatStatus,
    NetworkState,
    PantsStyle,
    PetState,
    RoomInfo,
    RoomTheme,
    ShirtStyle,
    Stamp,
    TabId,
} from '@/lib/types';
import type {
    AvatarRigConfig,
    OverlayPartAsset,
    OverlayPartType,
    SavedAvatarRig,
    SavedOverlayCatalogEntry,
    SavedOverlayConfig,
} from '@/tools/avatar-editor/types';
import { createDefaultRig } from '@/tools/avatar-editor/utils';

type AmebaStore = NetworkState & {
    setNatStatus: (status: NatStatus, errorMessage?: string | null) => void;
    setNatChecking: (checking: boolean) => void;
    setRooms: (rooms: RoomInfo[]) => void;
    joinRoom: (roomId: string, isHost: boolean) => void;
    leaveRoom: () => void;
    setPollingEnabled: (enabled: boolean) => void;
} & {
    farming: FarmingState;
    selectPlot: (plotId: string | null) => void;
    setSelectedSeed: (crop: CropType) => void;
    plantSeed: (plotId: string) => void;
    waterPlot: (plotId: string) => void;
    harvestPlot: (plotId: string) => void;
    claimDailyLogin: () => void;
    sendKitaYo: () => void;
    sellCrop: (crop: CropType, amount: number) => void;
    claimHarvestQuest: () => void;
    claimHelperQuest: () => void;
    setVisitingMode: (visiting: boolean) => void;
    enterFarmingRoom: () => void;
    leaveFarmingRoom: () => void;
    triggerWaterAnimation: (plotId: string) => void;
    triggerHarvestAnimation: (plotId: string) => void;
    clearFarmNotice: () => void;
    avatar: AvatarModel;
    avatarBundle: SavedAvatarRig | null;
    savedOverlayCatalog: SavedOverlayCatalogEntry[];
    selectedOverlaySlugs: Partial<Record<OverlayPartType, string>>;
    loadAvatarBundle: (file: File) => Promise<void>;
    loadDefaultAvatarBundle: () => Promise<void>;
    refreshSavedOverlayCatalog: () => Promise<void>;
    selectOverlaySet: (partType: OverlayPartType, slug: string) => Promise<void>;
    clearAvatarBundle: () => void;
    furniture: FurnitureItem[];
    pet: PetState;
    activeTab: TabId;
    roomTheme: RoomTheme;
    chatMessage: string;
    chatVisible: boolean;
    stamps: Stamp[];
    audioEnabled: boolean;
    setActiveTab: (tab: TabId) => void;
    setChatMessage: (message: string) => void;
    hideChat: () => void;
    setEyeStyle: (style: EyeStyle) => void;
    setMouthStyle: (style: MouthStyle) => void;
    setExpression: (expression: AvatarExpression) => void;
    setHairStyle: (style: HairStyle) => void;
    setHairColor: (color: string) => void;
    setSkinColor: (color: string) => void;
    setShirtStyle: (style: ShirtStyle) => void;
    setShirtColor: (color: string) => void;
    setPantsStyle: (style: PantsStyle) => void;
    setPantsColor: (color: string) => void;
    setShoeColor: (color: string) => void;
    toggleAccessory: (type: 'glasses' | 'nekomimi') => void;
    setRoomWall: (wallLeft: string, wallRight: string, wallTrim: string) => void;
    setFloorStyle: (floorStyle: 'carpet' | 'wood') => void;
    toggleAudio: () => void;
    walkTo: (gx: number, gy: number) => void;
    triggerAction: (action: 'wave' | 'dance' | 'jump' | 'sleep') => void;
    interactFurniture: (id: FurnitureId) => void;
    addStamp: (emoji: string, gx?: number, gy?: number) => void;
    removeStamp: (id: string) => void;
    tick: () => void;
};

const createInitialPlots = () =>
    Array.from({ length: FARM_GRID_SIZE * FARM_GRID_SIZE }, (_, index) => ({
        id: `plot-${index}`,
        gx: Math.floor(index / FARM_GRID_SIZE),
        gy: index % FARM_GRID_SIZE,
        crop: null,
        plantedAt: null,
        wateredCount: 0,
    }));

const initialDaily = (): DailyCounters => ({
    localDateKey: getLocalDateKey(),
    helperWaterCount: 0,
    kitaYoCount: 0,
    dailyLoginClaimed: false,
});

const initialInventory = (): Inventory => ({
    crops: {
        tomato: 0,
        carrot: 0,
        pumpkin: 0,
        eggplant: 0,
        corn: 0,
    },
    rareMaterial: 0,
});

const initialFarming: FarmingState = {
    gardenPlots: createInitialPlots(),
    selectedPlotId: null,
    inFarmingRoom: false,
    selectedSeed: 'tomato',
    stamina: MAX_STAMINA,
    points: 0,
    inventory: initialInventory(),
    daily: initialDaily(),
    quest: {
        harvestedCount: 0,
        helperWaterCount: 0,
        claimedHarvestQuest: false,
        claimedHelperQuest: false,
    },
    isVisitingMode: false,
    farmNotice: null,
    lastStaminaRefillAt: Date.now(),
};

function normalizeDaily(farming: FarmingState): FarmingState {
    const dateKey = getLocalDateKey();
    if (farming.daily.localDateKey === dateKey) {
        return farming;
    }
    return {
        ...farming,
        daily: {
            localDateKey: dateKey,
            helperWaterCount: 0,
            kitaYoCount: 0,
            dailyLoginClaimed: false,
        },
        farmNotice: '日付が変わったのでデイリー制限をリセットしました。',
    };
}

function consumeStamina(farming: FarmingState): FarmingState | null {
    if (farming.stamina <= 0) {
        return {
            ...farming,
            farmNotice: 'スタミナが不足しています。',
        };
    }
    return {
        ...farming,
        stamina: farming.stamina - 1,
    };
}

const initialAvatar: AvatarModel = {
    x: 3,
    y: 3,
    targetX: 3,
    targetY: 3,
    dir: 'FL',
    state: 'idle',
    expression: 'normal',
    eyeStyle: 'round',
    mouthStyle: 'smile',
    hairStyle: 'bob',
    shirtStyle: 'tshirt',
    pantsStyle: 'shorts',
    skinColor: '#ffebd9',
    hairColor: '#a1785e',
    shirtColor: '#3b82f6',
    pantsColor: '#f59e0b',
    shoeColor: '#10b981',
    glasses: false,
    nekomimi: false,
    actionTimer: 0,
    walkCycle: 0,
    blinkTimer: 120,
    blinkFrames: 0,
    watering: false,
    queueSit: false,
    queueWater: false,
};

const initialFurniture: FurnitureItem[] = [
    { id: 'sofa', gx: 0, gy: 3, width: 2, height: 1 },
    { id: 'plant', gx: 0, gy: 0, width: 1, height: 1 },
    { id: 'pet', gx: 5, gy: 1, width: 1, height: 1 },
];

function resetActions(avatar: AvatarModel): AvatarModel {
    return {
        ...avatar,
        state: 'idle',
        watering: false,
        queueSit: false,
        queueWater: false,
    };
}

const DEFAULT_OVERLAY_TEMPLATE = createDefaultRig().facing;

function withRuntimeOverlaySlots(rig: AvatarRigConfig, previousRig?: AvatarRigConfig | null): AvatarRigConfig {
    const previousFront = previousRig?.facing.front.overlays;
    const previousBack = previousRig?.facing.back.overlays;
    return {
        ...rig,
        facing: {
            front: {
                ...rig.facing.front,
                overlays: structuredClone(previousFront?.length ? previousFront : DEFAULT_OVERLAY_TEMPLATE.front.overlays),
            },
            back: {
                ...rig.facing.back,
                overlays: structuredClone(previousBack?.length ? previousBack : DEFAULT_OVERLAY_TEMPLATE.back.overlays),
            },
        },
    };
}

function upsertOverlay(overlays: OverlayPartAsset[], partType: OverlayPartType, fallback: OverlayPartAsset) {
    const existingIndex = overlays.findIndex(overlay => overlay.type === partType);
    if (existingIndex >= 0) {
        return { overlays: [...overlays], index: existingIndex };
    }
    return {
        overlays: [...overlays, structuredClone(fallback)],
        index: overlays.length,
    };
}

function applyOverlayConfigToBundle(
    bundle: SavedAvatarRig,
    partType: OverlayPartType,
    config: SavedOverlayConfig,
) {
    const frontFallback = DEFAULT_OVERLAY_TEMPLATE.front.overlays.find(overlay => overlay.type === partType);
    const backFallback = DEFAULT_OVERLAY_TEMPLATE.back.overlays.find(overlay => overlay.type === partType);
    if (!frontFallback || !backFallback) return bundle;

    const nextRig: AvatarRigConfig = {
        ...bundle.rig,
        facing: {
            front: {
                ...bundle.rig.facing.front,
                overlays: [...bundle.rig.facing.front.overlays],
            },
            back: {
                ...bundle.rig.facing.back,
                overlays: [...bundle.rig.facing.back.overlays],
            },
        },
    };

    {
        const { overlays, index } = upsertOverlay(nextRig.facing.front.overlays, partType, frontFallback);
        nextRig.facing.front.overlays = overlays;
        const current = nextRig.facing.front.overlays[index];
        if (config.front) {
            nextRig.facing.front.overlays[index] = {
                ...current,
                name: config.name,
                src: config.front.imageUrl,
                width: config.front.width,
                height: config.front.height,
                relativePosition: config.front.relativePosition,
                zIndex: config.front.zIndex,
                selectedTarget: config.front.selectedTarget,
                visible: config.front.visible ?? true,
            };
        }
    }

    {
        const { overlays, index } = upsertOverlay(nextRig.facing.back.overlays, partType, backFallback);
        nextRig.facing.back.overlays = overlays;
        const current = nextRig.facing.back.overlays[index];
        if (config.back) {
            nextRig.facing.back.overlays[index] = {
                ...current,
                name: config.name,
                src: config.back.imageUrl,
                width: config.back.width,
                height: config.back.height,
                relativePosition: config.back.relativePosition,
                zIndex: config.back.zIndex,
                selectedTarget: config.back.selectedTarget,
                visible: config.back.visible ?? true,
            };
        }
    }

    return {
        ...bundle,
        rig: nextRig,
    };
}

export const useAmebaStore = create<AmebaStore>((set, get) => ({
    avatar: initialAvatar,
    avatarBundle: null,
    savedOverlayCatalog: [],
    selectedOverlaySlugs: {},
    loadAvatarBundle: async file => {
        try {
            const text = await file.text();
            const parsed = JSON.parse(text) as Partial<SavedAvatarRig>;
            if (!parsed.rig) {
                console.error('[loadAvatarBundle] rig フィールドが見つかりません');
                return;
            }
            set(state => ({
                avatarBundle: {
                    ...(parsed as SavedAvatarRig),
                    rig: withRuntimeOverlaySlots(parsed.rig!, state.avatarBundle?.rig),
                },
            }));
        } catch (error) {
            console.error('[loadAvatarBundle] 読み込みに失敗しました', error);
        }
    },
    loadDefaultAvatarBundle: async () => {
        try {
            const listResponse = await fetch('/__avatar-editor/body-bundles/list');
            if (!listResponse.ok) throw new Error(await listResponse.text());
            const listPayload = (await listResponse.json()) as {
                entries: Array<{ slug: string; bundleUrl: string }>;
                defaultSlug: string | null;
            };
            if (!listPayload.defaultSlug) return;

            const target = listPayload.entries.find(entry => entry.slug === listPayload.defaultSlug);
            if (!target) return;

            const bundleResponse = await fetch(`${target.bundleUrl}?v=${Date.now()}`);
            if (!bundleResponse.ok) throw new Error(await bundleResponse.text());
            const parsed = (await bundleResponse.json()) as Partial<SavedAvatarRig>;
            if (!parsed.rig) return;
            set(state => ({
                avatarBundle: {
                    ...(parsed as SavedAvatarRig),
                    rig: withRuntimeOverlaySlots(parsed.rig!, state.avatarBundle?.rig),
                },
            }));
        } catch (error) {
            console.error('[loadDefaultAvatarBundle] 読み込みに失敗しました', error);
        }
    },
    refreshSavedOverlayCatalog: async () => {
        try {
            const response = await fetch('/__avatar-editor/overlays/list');
            if (!response.ok) throw new Error(await response.text());
            const payload = (await response.json()) as { entries: SavedOverlayCatalogEntry[] };
            set({ savedOverlayCatalog: payload.entries });
        } catch (error) {
            console.error('[refreshSavedOverlayCatalog] 読み込みに失敗しました', error);
        }
    },
    selectOverlaySet: async (partType, slug) => {
        set(state => ({
            selectedOverlaySlugs: {
                ...state.selectedOverlaySlugs,
                [partType]: slug,
            },
        }));

        try {
            const catalog = get().savedOverlayCatalog.find(entry => entry.partType === partType && entry.slug === slug);
            if (!catalog?.configUrl) return;

            const response = await fetch(`${catalog.configUrl}?v=${Date.now()}`);
            if (!response.ok) throw new Error(await response.text());
            const config = (await response.json()) as SavedOverlayConfig;

            set(state => {
                if (!state.avatarBundle) return state;
                return {
                    avatarBundle: applyOverlayConfigToBundle(state.avatarBundle, partType, config),
                };
            });
        } catch (error) {
            console.error(`[selectOverlaySet] ${partType}/${slug} の設定読み込みに失敗しました`, error);
        }
    },
    clearAvatarBundle: () => set({ avatarBundle: null }),
    furniture: initialFurniture,
    pet: { x: 5, y: 1, bounceTimer: 0 },
    activeTab: 'avatar',
    roomTheme: {
        wallLeft: '#fef08a',
        wallRight: '#fef9c3',
        wallTrim: '#eab308',
        floorStyle: 'carpet',
    },
    chatMessage: 'こんにちは！お部屋にようこそ！',
    chatVisible: true,
    stamps: [],
    audioEnabled: false,
    natStatus: 'unknown',
    natErrorMessage: null,
    isNatChecking: false,
    currentRoomId: null,
    isRoomHost: false,
    pollingEnabled: false,
    rooms: [],
    farming: initialFarming,
    setNatStatus: (status, errorMessage = null) => set({ natStatus: status, natErrorMessage: errorMessage }),
    setNatChecking: checking => set({ isNatChecking: checking }),
    setRooms: rooms => set({ rooms }),
    joinRoom: (roomId, isHost) => set({ currentRoomId: roomId, isRoomHost: isHost, pollingEnabled: isHost }),
    leaveRoom: () => set({ currentRoomId: null, isRoomHost: false, pollingEnabled: false }),
    setPollingEnabled: enabled => set({ pollingEnabled: enabled }),
    selectPlot: plotId => set(state => ({ farming: { ...state.farming, selectedPlotId: plotId } })),
    setSelectedSeed: crop => set(state => ({ farming: { ...state.farming, selectedSeed: crop } })),
    plantSeed: plotId =>
        set(state => {
            let farming = normalizeDaily(state.farming);
            const staminaState = consumeStamina(farming);
            if (!staminaState || staminaState.stamina === farming.stamina) {
                return { farming: staminaState ?? farming };
            }
            farming = staminaState;

            const index = farming.gardenPlots.findIndex(plot => plot.id === plotId);
            if (index < 0) {
                return { farming: { ...farming, farmNotice: '畑が見つかりません。' } };
            }

            const plot = farming.gardenPlots[index];
            if (plot.crop !== null) {
                return { farming: { ...farming, farmNotice: 'このマスには既に作物があります。' } };
            }

            const nextPlots = [...farming.gardenPlots];
            nextPlots[index] = {
                ...plot,
                crop: farming.selectedSeed,
                plantedAt: Date.now(),
                wateredCount: 0,
            };

            return {
                farming: {
                    ...farming,
                    points: farming.points + BASE_PLANT_POINT,
                    gardenPlots: nextPlots,
                    farmNotice: '種を植えました！ +1pt',
                },
            };
        }),
    waterPlot: plotId =>
        set(state => {
            let farming = normalizeDaily(state.farming);
            const staminaState = consumeStamina(farming);
            if (!staminaState || staminaState.stamina === farming.stamina) {
                return { farming: staminaState ?? farming };
            }
            farming = staminaState;

            const index = farming.gardenPlots.findIndex(plot => plot.id === plotId);
            if (index < 0) {
                return { farming: { ...farming, farmNotice: '畑が見つかりません。' } };
            }

            const plot = farming.gardenPlots[index];
            if (!plot.crop || !plot.plantedAt) {
                return { farming: { ...farming, farmNotice: 'まだ何も植わっていません。' } };
            }

            const nextPlots = [...farming.gardenPlots];
            nextPlots[index] = {
                ...plot,
                wateredCount: plot.wateredCount + 1,
            };

            const isHelper = farming.isVisitingMode;
            let points = farming.points;
            let helperWaterCount = farming.daily.helperWaterCount;
            let questHelper = farming.quest.helperWaterCount;
            let notice = '水やりしました。';

            if (isHelper) {
                if (farming.daily.helperWaterCount >= DAILY_HELPER_WATER_LIMIT) {
                    return { farming: { ...farming, farmNotice: '他人畑の水やり上限に達しています。' } };
                }
                points += BASE_HELPER_WATER_POINT;
                helperWaterCount += 1;
                questHelper += 1;
                notice = `お手伝い水やり！ +${BASE_HELPER_WATER_POINT}pt`;
            }

            return {
                farming: {
                    ...farming,
                    points,
                    gardenPlots: nextPlots,
                    daily: {
                        ...farming.daily,
                        helperWaterCount,
                    },
                    quest: {
                        ...farming.quest,
                        helperWaterCount: questHelper,
                    },
                    farmNotice: notice,
                },
                stamps: [
                    ...state.stamps,
                    { id: crypto.randomUUID(), emoji: '💧', gx: 3 + (index % 3), gy: 3 + Math.floor(index / 3) },
                ],
            };
        }),
    harvestPlot: plotId =>
        set(state => {
            let farming = normalizeDaily(state.farming);
            const staminaState = consumeStamina(farming);
            if (!staminaState || staminaState.stamina === farming.stamina) {
                return { farming: staminaState ?? farming };
            }
            farming = staminaState;

            const index = farming.gardenPlots.findIndex(plot => plot.id === plotId);
            if (index < 0) {
                return { farming: { ...farming, farmNotice: '畑が見つかりません。' } };
            }

            const plot = farming.gardenPlots[index];
            if (!plot.crop || !plot.plantedAt) {
                return { farming: { ...farming, farmNotice: '収穫できる作物がありません。' } };
            }

            if (!cropIsMature(plot.plantedAt)) {
                return { farming: { ...farming, farmNotice: 'まだ収穫できません。もう少し待ってください。' } };
            }

            const multiplier = wateringBonusMultiplier(plot.wateredCount);
            const yieldCount = Math.max(1, Math.floor(multiplier));
            const rareChance = rareDropChance(plot.wateredCount);
            const gotRare = Math.random() < rareChance;
            const bonusPoint = Math.random() < 0.25 ? 2 + Math.floor(Math.random() * 4) : 0;

            const nextPlots = [...farming.gardenPlots];
            nextPlots[index] = {
                ...plot,
                crop: null,
                plantedAt: null,
                wateredCount: 0,
            };

            const nextInventory = {
                ...farming.inventory,
                crops: {
                    ...farming.inventory.crops,
                    [plot.crop]: farming.inventory.crops[plot.crop] + yieldCount,
                },
                rareMaterial: farming.inventory.rareMaterial + (gotRare ? 1 : 0),
            };

            return {
                farming: {
                    ...farming,
                    points: farming.points + BASE_HARVEST_POINT + bonusPoint,
                    inventory: nextInventory,
                    gardenPlots: nextPlots,
                    quest: {
                        ...farming.quest,
                        harvestedCount: farming.quest.harvestedCount + yieldCount,
                    },
                    farmNotice: `収穫！ +${BASE_HARVEST_POINT + bonusPoint}pt / 収穫数+${yieldCount}${gotRare ? ' / レア素材+1' : ''}`,
                },
                stamps: [
                    ...state.stamps,
                    { id: crypto.randomUUID(), emoji: '✨', gx: 3 + (index % 3), gy: 3 + Math.floor(index / 3) },
                ],
            };
        }),
    claimDailyLogin: () =>
        set(state => {
            const farming = normalizeDaily(state.farming);
            if (farming.daily.dailyLoginClaimed) {
                return {
                    farming: {
                        ...farming,
                        farmNotice: '今日のログインボーナスは受取済みです。',
                    },
                };
            }
            return {
                farming: {
                    ...farming,
                    points: farming.points + BASE_DAILY_LOGIN_POINT,
                    daily: {
                        ...farming.daily,
                        dailyLoginClaimed: true,
                    },
                    farmNotice: `ログインボーナス +${BASE_DAILY_LOGIN_POINT}pt`,
                },
            };
        }),
    sendKitaYo: () =>
        set(state => {
            const farming = normalizeDaily(state.farming);
            if (farming.daily.kitaYoCount >= DAILY_KITAYO_LIMIT) {
                return {
                    farming: {
                        ...farming,
                        farmNotice: 'きたよの1日上限に達しました。',
                    },
                };
            }
            return {
                farming: {
                    ...farming,
                    points: farming.points + BASE_KITAYO_POINT,
                    daily: {
                        ...farming.daily,
                        kitaYoCount: farming.daily.kitaYoCount + 1,
                    },
                    farmNotice: `きたよ！ +${BASE_KITAYO_POINT}pt`,
                },
            };
        }),
    sellCrop: (crop, amount) =>
        set(state => {
            const farming = normalizeDaily(state.farming);
            const count = Math.max(1, Math.floor(amount));
            if (farming.inventory.crops[crop] < count) {
                return {
                    farming: {
                        ...farming,
                        farmNotice: '所持数が不足しています。',
                    },
                };
            }
            const earned = SELL_PRICE[crop] * count;
            return {
                farming: {
                    ...farming,
                    points: farming.points + earned,
                    inventory: {
                        ...farming.inventory,
                        crops: {
                            ...farming.inventory.crops,
                            [crop]: farming.inventory.crops[crop] - count,
                        },
                    },
                    farmNotice: `売却しました。 +${earned}pt`,
                },
            };
        }),
    claimHarvestQuest: () =>
        set(state => {
            const farming = normalizeDaily(state.farming);
            if (farming.quest.claimedHarvestQuest) {
                return { farming: { ...farming, farmNotice: '収穫クエスト報酬は受取済みです。' } };
            }
            if (farming.quest.harvestedCount < QUEST_HARVEST_TARGET) {
                return { farming: { ...farming, farmNotice: '収穫数が目標に達していません。' } };
            }
            return {
                farming: {
                    ...farming,
                    points: farming.points + QUEST_HARVEST_REWARD,
                    quest: {
                        ...farming.quest,
                        claimedHarvestQuest: true,
                    },
                    farmNotice: `クエスト達成！ +${QUEST_HARVEST_REWARD}pt`,
                },
            };
        }),
    claimHelperQuest: () =>
        set(state => {
            const farming = normalizeDaily(state.farming);
            if (farming.quest.claimedHelperQuest) {
                return { farming: { ...farming, farmNotice: 'お手伝いクエスト報酬は受取済みです。' } };
            }
            if (farming.quest.helperWaterCount < QUEST_HELPER_TARGET) {
                return { farming: { ...farming, farmNotice: 'お手伝い回数が目標に達していません。' } };
            }
            return {
                farming: {
                    ...farming,
                    points: farming.points + QUEST_HELPER_REWARD,
                    quest: {
                        ...farming.quest,
                        claimedHelperQuest: true,
                    },
                    farmNotice: `クエスト達成！ +${QUEST_HELPER_REWARD}pt`,
                },
            };
        }),
    setVisitingMode: visiting =>
        set(state => ({
            farming: {
                ...state.farming,
                isVisitingMode: visiting,
                farmNotice: visiting ? '訪問モード: 他人畑への水やりで3pt獲得可能です。' : '自分の畑モードに戻りました。',
            },
        })),
    enterFarmingRoom: () =>
        set(state => ({
            farming: {
                ...state.farming,
                inFarmingRoom: true,
                farmNotice: '栽培部屋に移動しました。',
            },
        })),
    leaveFarmingRoom: () =>
        set(state => ({
            farming: {
                ...state.farming,
                inFarmingRoom: false,
                selectedPlotId: null,
                farmNotice: '通常の部屋に戻りました。',
            },
        })),
    triggerWaterAnimation: plotId =>
        set(state => ({
            stamps: [
                ...state.stamps,
                { id: crypto.randomUUID(), emoji: '💧', gx: 3 + (parseInt(plotId.split('-')[1]) % 3), gy: 3 + Math.floor(parseInt(plotId.split('-')[1]) / 3) },
            ],
        })),
    triggerHarvestAnimation: plotId =>
        set(state => ({
            stamps: [
                ...state.stamps,
                { id: crypto.randomUUID(), emoji: '✨', gx: 3 + (parseInt(plotId.split('-')[1]) % 3), gy: 3 + Math.floor(parseInt(plotId.split('-')[1]) / 3) },
            ],
        })),
    clearFarmNotice: () => set(state => ({ farming: { ...state.farming, farmNotice: null } })),
    setActiveTab: activeTab => set({ activeTab }),
    setChatMessage: chatMessage => set({ chatMessage, chatVisible: true }),
    hideChat: () => set({ chatVisible: false }),
    setEyeStyle: eyeStyle => set(state => ({ avatar: { ...state.avatar, eyeStyle } })),
    setMouthStyle: mouthStyle => set(state => ({ avatar: { ...state.avatar, mouthStyle } })),
    setExpression: expression => set(state => ({ avatar: { ...state.avatar, expression } })),
    setHairStyle: hairStyle => set(state => ({ avatar: { ...state.avatar, hairStyle } })),
    setHairColor: hairColor => set(state => ({ avatar: { ...state.avatar, hairColor } })),
    setSkinColor: skinColor => set(state => ({ avatar: { ...state.avatar, skinColor } })),
    setShirtStyle: shirtStyle => set(state => ({ avatar: { ...state.avatar, shirtStyle } })),
    setShirtColor: shirtColor => set(state => ({ avatar: { ...state.avatar, shirtColor } })),
    setPantsStyle: pantsStyle => set(state => ({ avatar: { ...state.avatar, pantsStyle } })),
    setPantsColor: pantsColor => set(state => ({ avatar: { ...state.avatar, pantsColor } })),
    setShoeColor: shoeColor => set(state => ({ avatar: { ...state.avatar, shoeColor } })),
    toggleAccessory: type =>
        set(state => ({
            avatar: { ...state.avatar, [type]: !state.avatar[type] },
        })),
    setRoomWall: (wallLeft, wallRight, wallTrim) =>
        set(state => ({ roomTheme: { ...state.roomTheme, wallLeft, wallRight, wallTrim } })),
    setFloorStyle: floorStyle => set(state => ({ roomTheme: { ...state.roomTheme, floorStyle } })),
    toggleAudio: () => set(state => ({ audioEnabled: !state.audioEnabled })),
    walkTo: (gx, gy) =>
        set(state => ({
            avatar: {
                ...resetActions(state.avatar),
                targetX: gx,
                targetY: gy,
                state: 'walking',
            },
        })),
    triggerAction: action =>
        set(state => {
            const avatar = resetActions(state.avatar);
            if (action === 'wave') {
                return { avatar: { ...avatar, state: 'wave', actionTimer: 120 } };
            }
            if (action === 'dance') {
                return { avatar: { ...avatar, state: 'dance', actionTimer: 999999 } };
            }
            if (action === 'jump') {
                return { avatar: { ...avatar, state: 'jump', actionTimer: 30 } };
            }
            return { avatar: { ...avatar, state: 'sleeping', actionTimer: 999999 } };
        }),
    interactFurniture: id =>
        set(state => {
            const item = state.furniture.find(furniture => furniture.id === id);
            if (!item) {
                return state;
            }
            if (id === 'pet') {
                return {
                    pet: { ...state.pet, bounceTimer: 30 },
                    stamps: [
                        ...state.stamps,
                        { id: crypto.randomUUID(), emoji: '🐾', gx: state.pet.x, gy: state.pet.y },
                    ],
                };
            }
            if (id === 'sofa') {
                return {
                    avatar: {
                        ...resetActions(state.avatar),
                        targetX: item.gx,
                        targetY: item.gy,
                        state: 'walking',
                        queueSit: true,
                    },
                };
            }
            return {
                avatar: {
                    ...resetActions(state.avatar),
                    targetX: item.gx + 1,
                    targetY: item.gy,
                    state: 'walking',
                    queueWater: true,
                },
            };
        }),
    addStamp: (emoji, gx, gy) =>
        set(state => ({
            stamps: [
                ...state.stamps,
                {
                    id: crypto.randomUUID(),
                    emoji,
                    gx: gx ?? state.avatar.x,
                    gy: gy ?? state.avatar.y,
                },
            ],
        })),
    removeStamp: id => set(state => ({ stamps: state.stamps.filter(stamp => stamp.id !== id) })),
    tick: () =>
        set(state => {
            const now = Date.now();
            const avatar = { ...state.avatar };
            const pet = { ...state.pet };
            // Keep movement smooth while preserving a brisk default pace.
            const speed = 0.052;
            // walkCycle is fed into computeBodyPose as walkTime; after *speed inside the fn
            // a step of 0.12 at speed=2.2 yields phase advance ~0.26 rad/frame => ~60bpm
            const walkCycleStep = 0.12;
            let farming = normalizeDaily(state.farming);

            const elapsed = now - farming.lastStaminaRefillAt;
            if (elapsed >= STAMINA_RECOVERY_MS && farming.stamina < MAX_STAMINA) {
                const recover = Math.floor(elapsed / STAMINA_RECOVERY_MS);
                farming = {
                    ...farming,
                    stamina: Math.min(MAX_STAMINA, farming.stamina + recover),
                    lastStaminaRefillAt: farming.lastStaminaRefillAt + recover * STAMINA_RECOVERY_MS,
                };
            }

            if (avatar.blinkFrames > 0) {
                avatar.blinkFrames -= 1;
            } else {
                avatar.blinkTimer -= 1;
                if (avatar.blinkTimer <= 0) {
                    avatar.blinkFrames = 10;
                    avatar.blinkTimer = 100 + Math.random() * 200;
                }
            }

            if (avatar.state === 'walking') {
                const dx = avatar.targetX - avatar.x;
                const dy = avatar.targetY - avatar.y;
                const dist = Math.hypot(dx, dy);

                if (dist > 0.05) {
                    avatar.x += (dx / dist) * speed;
                    avatar.y += (dy / dist) * speed;
                    avatar.walkCycle += walkCycleStep;
                    const absX = Math.abs(dx);
                    const absY = Math.abs(dy);
                    if (absX > absY) {
                        avatar.dir = dx > 0 ? 'FR' : 'FL';
                    } else {
                        avatar.dir = 'FL';
                    }
                } else {
                    avatar.x = avatar.targetX;
                    avatar.y = avatar.targetY;
                    avatar.state = 'idle';
                    if (avatar.queueSit) {
                        avatar.queueSit = false;
                        avatar.state = 'sitting';
                        avatar.dir = 'FL';
                    } else if (avatar.queueWater) {
                        avatar.queueWater = false;
                        avatar.watering = true;
                    }
                }
            }

            if (avatar.watering) {
                avatar.actionTimer += 1;
                if (avatar.actionTimer > 90) {
                    avatar.watering = false;
                    avatar.actionTimer = 0;
                    avatar.state = 'idle';
                }
            }

            if (avatar.actionTimer > 0 && avatar.state !== 'walking' && avatar.state !== 'dance' && avatar.state !== 'sleeping') {
                avatar.actionTimer -= 1;
                if (avatar.actionTimer === 0) {
                    avatar.state = 'idle';
                }
            }

            if (pet.bounceTimer > 0) {
                pet.bounceTimer -= 1;
            }

            return { avatar, pet, farming };
        }),
}));
