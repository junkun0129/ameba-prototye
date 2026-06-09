import { create } from 'zustand';
import { CANVAS_SIZE, DEFAULT_ATLAS_FILE_NAME, DEFAULT_BUNDLE_FILE_NAME, DEFAULT_FILE_NAME, OVERLAY_PARENT_OPTIONS } from '@/tools/avatar-editor/constants';
import type {
    AvatarRigConfig,
    BodyPartAsset,
    BodyPartType,
    BoneName,
    FacingMode,
    JsonPreviewMode,
    OverlayPartAsset,
    OverlayPartType,
    Point,
    SavedAvatarRig,
    SavedBodyBundleCatalogEntry,
    SavedOverlayCatalogEntry,
    SavedOverlayConfig,
    SettingsTabId,
    UploadKind,
} from '@/tools/avatar-editor/types';
import {
    buildAtlasBundle,
    buildBundle,
    clampPoint,
    createDefaultRig,
    createDefaultPreviewSelection,
    getFacingLayer,
    readImageSizeFromDataUrl,
    readFileAsDataUrl,
    saveFileToDirectory,
    saveTextFile,
    withPlaceholderAssets,
} from '@/tools/avatar-editor/utils';
import { updateRigBodyPart, updateRigOverlay, mergeBodyRig, stripOverlaysFromRig } from './helpers';

type Toast = {
    message: string;
    kind: 'info' | 'success' | 'error';
};

type StoredAssetEntry = {
    kind: UploadKind;
    partType: BodyPartType | OverlayPartType;
    fileName: string;
    url: string;
};

type AvatarEditorState = {
    rig: AvatarRigConfig;
    assetDirectoryHandle: FileSystemDirectoryHandle | null;
    assetDirectoryName: string | null;
    storedAssets: StoredAssetEntry[];
    savedOverlays: SavedOverlayCatalogEntry[];
    savedBodyBundles: SavedBodyBundleCatalogEntry[];
    defaultBodyBundleSlug: string | null;
    activeBone: BoneName;
    activeOverlay: OverlayPartType;
    activeSettingsTab: SettingsTabId;
    jsonPreviewMode: JsonPreviewMode;
    walkTime: number;
    isAnimationPlaying: boolean;
    isDraggingBone: boolean;
    toast: Toast | null;
    initialize: () => void;
    tickWalk: (deltaSeconds: number) => void;
    setActiveBone: (boneName: BoneName) => void;
    setActiveOverlay: (overlayType: OverlayPartType) => void;
    setActiveFacing: (facing: FacingMode) => void;
    setActiveSettingsTab: (tab: SettingsTabId) => void;
    setJsonPreviewMode: (mode: JsonPreviewMode) => void;
    setAnimationPlaying: (playing: boolean) => void;
    moveBone: (boneName: BoneName, point: Point) => void;
    updateBoneValue: (boneName: BoneName, axis: 'x' | 'y', value: number) => void;
    updateBodyPartValue: (partType: BodyPartType, field: 'position' | 'pivot', axis: 'x' | 'y', value: number) => void;
    updateBodyPartPosition: (partType: BodyPartType, point: Point) => void;
    updateBodyPartZIndex: (partType: BodyPartType, value: number, facing?: FacingMode) => void;
    updateBodyPartVisible: (partType: BodyPartType, visible: boolean, facing?: FacingMode) => void;
    updateWalkCycle: (field: keyof AvatarRigConfig['walkCycle'], value: number) => void;
    updateOverlayRelativePosition: (overlayType: OverlayPartType, axis: 'x' | 'y', value: number) => void;
    updateOverlayPosition: (overlayType: OverlayPartType, point: Point) => void;
    updateOverlayTarget: (overlayType: OverlayPartType, partType: BodyPartType) => void;
    updateOverlayZIndex: (overlayType: OverlayPartType, value: number, facing?: FacingMode) => void;
    updateOverlayVisible: (overlayType: OverlayPartType, visible: boolean, facing?: FacingMode) => void;
    updateOverlayName: (overlayType: OverlayPartType, name: string) => void;
    updateBodySelection: (partType: BodyPartType, partId: string) => void;
    updateOverlaySelection: (partType: OverlayPartType, partId: string) => void;
    uploadAsset: (kind: UploadKind, partType: BodyPartType | OverlayPartType, file: File, facing?: FacingMode) => Promise<void>;
    selectStoredAsset: (kind: UploadKind, partType: BodyPartType | OverlayPartType, assetUrl: string, fileName: string) => Promise<void>;
    refreshStoredAssets: () => Promise<void>;
    saveOverlayPart: (partType: OverlayPartType) => Promise<void>;
    refreshSavedOverlays: () => Promise<void>;
    applySavedOverlay: (partType: OverlayPartType, slug: string) => Promise<void>;
    saveCurrentBodyBundle: (name: string, setAsDefault?: boolean) => Promise<void>;
    refreshSavedBodyBundles: () => Promise<void>;
    applySavedBodyBundle: (slug: string, setAsDefault?: boolean) => Promise<void>;
    setDefaultBodyBundle: (slug: string) => Promise<void>;
    pickAssetDirectory: () => Promise<void>;
    clearAssetDirectory: () => void;
    importBundle: (file: File) => Promise<void>;
    saveRig: () => Promise<void>;
    saveAtlas: () => Promise<void>;
    saveBundle: () => Promise<void>;
    dismissToast: () => void;
};

export const useAvatarEditorStore = create<AvatarEditorState>((set, get) => ({
    rig: withPlaceholderAssets(createDefaultRig()),
    assetDirectoryHandle: null,
    assetDirectoryName: null,
    storedAssets: [],
    savedOverlays: [],
    savedBodyBundles: [],
    defaultBodyBundleSlug: null,
    activeBone: 'root',
    activeOverlay: 'backHair',
    activeSettingsTab: 'assets',
    jsonPreviewMode: 'bundle',
    walkTime: 0,
    isAnimationPlaying: true,
    isDraggingBone: false,
    toast: null,

    initialize: () => {
        set(state => ({
            ...state,
            rig: withPlaceholderAssets({
                ...createDefaultRig(),
                previewSelection: createDefaultPreviewSelection(),
            }),
        }));
    },

    tickWalk: deltaSeconds => {
        set(state => ({
            walkTime: state.walkTime + deltaSeconds,
        }));
    },

    setActiveBone: boneName => set({ activeBone: boneName }),
    setActiveOverlay: overlayType => set({ activeOverlay: overlayType }),
    setActiveFacing: facing =>
        set(state => ({
            rig: {
                ...state.rig,
                activeFacing: facing,
            },
        })),
    setActiveSettingsTab: tab => set({ activeSettingsTab: tab }),
    setJsonPreviewMode: mode => set({ jsonPreviewMode: mode }),
    setAnimationPlaying: playing => set({ isAnimationPlaying: playing }),

    moveBone: (boneName, point) => {
        set(state => ({
            rig: {
                ...state.rig,
                facing: {
                    ...state.rig.facing,
                    [state.rig.activeFacing]: {
                        ...state.rig.facing[state.rig.activeFacing],
                        bones: state.rig.facing[state.rig.activeFacing].bones.map(bone => (bone.name === boneName ? { ...bone, point: clampPoint(point) } : bone)),
                    },
                },
            },
        }));
    },

    updateBoneValue: (boneName, axis, value) => {
        const current = getFacingLayer(get().rig, get().rig.activeFacing).bones.find(bone => bone.name === boneName);
        if (!current) return;
        get().moveBone(boneName, { ...current.point, [axis]: value });
    },

    updateBodyPartValue: (partType, field, axis, value) => {
        set(state => ({
            rig: updateRigBodyPart(state.rig, partType, part => ({
                ...part,
                [field]: clampPoint({ ...part[field], [axis]: value }),
            })),
        }));
    },

    updateBodyPartPosition: (partType, point) => {
        set(state => ({
            rig: updateRigBodyPart(state.rig, partType, part => ({
                ...part,
                position: clampPoint(point),
            })),
        }));
    },

    updateBodyPartZIndex: (partType, value, facing) => {
        set(state => ({
            rig: updateRigBodyPart(state.rig, partType, part => ({
                ...part,
                zIndex: Math.round(value),
            }), facing),
        }));
    },

    updateBodyPartVisible: (partType, visible, facing) => {
        set(state => ({
            rig: updateRigBodyPart(state.rig, partType, part => ({
                ...part,
                visible,
            }), facing),
        }));
    },

    updateWalkCycle: (field, value) => {
        set(state => ({
            rig: {
                ...state.rig,
                walkCycle: {
                    ...state.rig.walkCycle,
                    [field]: Number.isFinite(value) ? value : state.rig.walkCycle[field],
                },
            },
        }));
    },

    updateOverlayRelativePosition: (overlayType, axis, value) => {
        set(state => ({
            rig: updateRigOverlay(state.rig, overlayType, overlay => ({
                ...overlay,
                relativePosition: {
                    ...overlay.relativePosition,
                    [axis]: Math.round(value),
                },
            })),
        }));
    },

    updateOverlayPosition: (overlayType, point) => {
        set(state => {
            const activeFacing = state.rig.activeFacing;
            const layer = state.rig.facing[activeFacing];
            const overlay = layer.overlays.find(part => part.type === overlayType);
            if (!overlay) return state;

            const anchorPoint = overlay.selectedTarget.boneName
                ? layer.bones.find(bone => bone.name === overlay.selectedTarget.boneName)?.point
                : layer.bodyParts.find(part => part.type === overlay.selectedTarget.partType)?.position;

            const basePoint = anchorPoint ?? { x: CANVAS_SIZE / 2, y: CANVAS_SIZE / 2 };
            const clamped = clampPoint(point);

            return {
                rig: updateRigOverlay(state.rig, overlayType, current => ({
                    ...current,
                    relativePosition: {
                        x: Math.round(clamped.x - basePoint.x),
                        y: Math.round(clamped.y - basePoint.y),
                    },
                })),
            };
        });
    },

    updateOverlayTarget: (overlayType, partType) => {
        set(state => ({
            rig: updateRigOverlay(state.rig, overlayType, overlay => ({
                ...overlay,
                selectedTarget: {
                    partType,
                    boneName: overlay.selectedTarget.boneName,
                },
            })),
        }));
    },

    updateOverlayZIndex: (overlayType, value, facing) => {
        set(state => ({
            rig: updateRigOverlay(state.rig, overlayType, overlay => ({
                ...overlay,
                zIndex: Math.round(value),
            }), facing),
        }));
    },

    updateOverlayVisible: (overlayType, visible, facing) => {
        set(state => ({
            rig: updateRigOverlay(state.rig, overlayType, overlay => ({
                ...overlay,
                visible,
            }), facing),
        }));
    },

    updateOverlayName: (overlayType, name) => {
        const normalized = name.trim();
        if (!normalized) return;
        set(state => ({
            rig: {
                ...state.rig,
                facing: {
                    ...state.rig.facing,
                    front: {
                        ...state.rig.facing.front,
                        overlays: state.rig.facing.front.overlays.map(overlay =>
                            overlay.type === overlayType
                                ? { ...overlay, name: normalized }
                                : overlay,
                        ),
                    },
                    back: {
                        ...state.rig.facing.back,
                        overlays: state.rig.facing.back.overlays.map(overlay =>
                            overlay.type === overlayType
                                ? { ...overlay, name: normalized }
                                : overlay,
                        ),
                    },
                },
            },
        }));
    },

    updateBodySelection: (partType, partId) => {
        set(state => ({
            rig: {
                ...state.rig,
                previewSelection: {
                    ...state.rig.previewSelection,
                    bodyPartIds: {
                        ...state.rig.previewSelection.bodyPartIds,
                        [partType]: partId,
                    },
                },
            },
        }));
    },

    updateOverlaySelection: (partType, partId) => {
        set(state => ({
            rig: {
                ...state.rig,
                previewSelection: {
                    ...state.rig.previewSelection,
                    overlayPartIds: {
                        ...state.rig.previewSelection.overlayPartIds,
                        [partType]: partId,
                    },
                },
            },
        }));
    },

    uploadAsset: async (kind, partType, file, facing) => {
        const src = await readFileAsDataUrl(file);
        const imageSize = await readImageSizeFromDataUrl(src);
        const targetFacing = facing ?? get().rig.activeFacing;
        let uploadToast: Toast = { message: `${file.name} を ${partType} に読み込みました`, kind: 'success' };

        if (kind === 'body') {
            let storedSrc = src;
            try {
                const response = await fetch('/__avatar-editor/assets/upload', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ kind, partType, fileName: file.name, dataUrl: src }),
                });
                if (!response.ok) {
                    throw new Error(await response.text());
                }
                const saved = (await response.json()) as { url: string; fileName: string };
                storedSrc = saved.url;
                uploadToast = { message: `${file.name} を ${partType} に読み込み、プロジェクト配下へ保存しました`, kind: 'success' };
            } catch (error) {
                uploadToast = { message: `画像は読み込みましたがプロジェクト保存に失敗しました: ${String(error)}`, kind: 'error' };
            }

            const directoryHandle = get().assetDirectoryHandle;
            if (directoryHandle) {
                try {
                    await saveFileToDirectory(directoryHandle, file);
                } catch {
                    // 補助保存先への失敗は body 本体更新を止めない
                }
            }

            set(state => ({
                rig: updateRigBodyPart(state.rig, partType as BodyPartType, part => ({
                    ...part,
                    src: storedSrc,
                    width: imageSize.width,
                    height: imageSize.height,
                    name: file.name.replace(/\.[^.]+$/, ''),
                    atlasFrameId: file.name.replace(/\.[^.]+$/, ''),
                })),
                toast: uploadToast,
            }));
            void get().refreshStoredAssets();
            return;
        }

        set(state => ({
            rig: updateRigOverlay(state.rig, partType as OverlayPartType, overlay => ({
                ...overlay,
                src,
                visible: true,
                width: imageSize.width,
                height: imageSize.height,
                name: file.name.replace(/\.[^.]+$/, ''),
                atlasFrameId: file.name.replace(/\.[^.]+$/, ''),
            }), targetFacing),
            toast: {
                message: `${file.name} を ${partType} (${targetFacing}) に読み込みました。保存ボタンで確定すると永続化されます。`,
                kind: 'info',
            },
        }));
    },

    selectStoredAsset: async (kind, partType, assetUrl, fileName) => {
        const normalizedUrl = assetUrl.includes('?v=') ? assetUrl : `${assetUrl}?v=${Date.now()}`;
        const imageSize = await readImageSizeFromDataUrl(normalizedUrl);
        const baseName = fileName.replace(/\.[^.]+$/, '');

        if (kind === 'body') {
            set(state => ({
                rig: updateRigBodyPart(state.rig, partType as BodyPartType, part => ({
                    ...part,
                    src: normalizedUrl,
                    width: imageSize.width,
                    height: imageSize.height,
                    name: baseName,
                    atlasFrameId: baseName,
                })),
                toast: { message: `${fileName} を ${partType} に再適用しました`, kind: 'success' },
            }));
            return;
        }

        set(state => ({
            rig: updateRigOverlay(state.rig, partType as OverlayPartType, overlay => ({
                ...overlay,
                src: normalizedUrl,
                width: imageSize.width,
                height: imageSize.height,
                name: baseName,
                atlasFrameId: baseName,
                visible: true,
            })),
            toast: { message: `${fileName} を ${partType} に再適用しました`, kind: 'success' },
        }));
    },

    refreshStoredAssets: async () => {
        try {
            const response = await fetch('/__avatar-editor/assets/list');
            if (!response.ok) {
                throw new Error(await response.text());
            }
            const payload = (await response.json()) as { entries: StoredAssetEntry[] };
            set({ storedAssets: payload.entries });
        } catch (error) {
            set({ toast: { message: `保存済み画像の取得に失敗しました: ${String(error)}`, kind: 'error' } });
        }
    },

    saveOverlayPart: async partType => {
        const rig = get().rig;
        const front = rig.facing.front.overlays.find(part => part.type === partType);
        const back = rig.facing.back.overlays.find(part => part.type === partType);
        if (!front && !back) {
            set({ toast: { message: `${partType} の設定が見つかりません`, kind: 'error' } });
            return;
        }

        const displayName = front?.name || back?.name || partType;
        const slug = displayName
            .trim()
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9_-]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '') || partType;

        const payload: {
            partType: OverlayPartType;
            name: string;
            slug: string;
            front?: OverlayPartAsset;
            back?: OverlayPartAsset;
        } = {
            partType,
            name: displayName,
            slug,
            front,
            back,
        };

        try {
            const response = await fetch('/__avatar-editor/overlays/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!response.ok) {
                throw new Error(await response.text());
            }
            await get().refreshSavedOverlays();
            set({ toast: { message: `${displayName} を保存しました`, kind: 'success' } });
        } catch (error) {
            set({ toast: { message: `overlay 保存に失敗しました: ${String(error)}`, kind: 'error' } });
        }
    },

    refreshSavedOverlays: async () => {
        try {
            const response = await fetch('/__avatar-editor/overlays/list');
            if (!response.ok) {
                throw new Error(await response.text());
            }
            const payload = (await response.json()) as { entries: SavedOverlayCatalogEntry[] };
            set({ savedOverlays: payload.entries });
        } catch (error) {
            set({ toast: { message: `保存済みoverlayの取得に失敗しました: ${String(error)}`, kind: 'error' } });
        }
    },

    applySavedOverlay: async (partType, slug) => {
        try {
            const response = await fetch(`/avatar-overlays/${partType}/${slug}/config.json?v=${Date.now()}`);
            if (!response.ok) {
                throw new Error(await response.text());
            }
            const config = (await response.json()) as SavedOverlayConfig;
            set(state => {
                let nextRig = state.rig;
                if (config.front) {
                    nextRig = updateRigOverlay(nextRig, partType, overlay => ({
                        ...overlay,
                        name: config.name,
                        src: config.front?.imageUrl ?? overlay.src,
                        width: config.front?.width ?? overlay.width,
                        height: config.front?.height ?? overlay.height,
                        relativePosition: config.front?.relativePosition ?? overlay.relativePosition,
                        selectedTarget: config.front?.selectedTarget ?? overlay.selectedTarget,
                        zIndex: config.front?.zIndex ?? overlay.zIndex,
                        visible: config.front?.visible ?? true,   // applying a catalog overlay always makes it visible
                    }), 'front');
                }
                if (config.back) {
                    nextRig = updateRigOverlay(nextRig, partType, overlay => ({
                        ...overlay,
                        name: config.name,
                        src: config.back?.imageUrl ?? overlay.src,
                        width: config.back?.width ?? overlay.width,
                        height: config.back?.height ?? overlay.height,
                        relativePosition: config.back?.relativePosition ?? overlay.relativePosition,
                        selectedTarget: config.back?.selectedTarget ?? overlay.selectedTarget,
                        zIndex: config.back?.zIndex ?? overlay.zIndex,
                        visible: config.back?.visible ?? true,
                    }), 'back');
                }
                return {
                    rig: nextRig,
                    toast: { message: `${config.name} を ${partType} に適用しました`, kind: 'success' },
                };
            });
        } catch (error) {
            set({ toast: { message: `overlay 適用に失敗しました: ${String(error)}`, kind: 'error' } });
        }
    },

    saveCurrentBodyBundle: async (name, setAsDefault = false) => {
        const displayName = name.trim();
        if (!displayName) {
            set({ toast: { message: '体パーツBundle名を入力してください', kind: 'error' } });
            return;
        }

        const slug = displayName
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9_-]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '') || 'body-bundle';

        try {
            const bodyOnlyRig = stripOverlaysFromRig(get().rig, {
                front: get().rig.facing.front,
                back: get().rig.facing.back,
            });
            const response = await fetch('/__avatar-editor/body-bundles/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: displayName,
                    slug,
                    rig: {
                        ...bodyOnlyRig,
                        facing: {
                            front: {
                                ...bodyOnlyRig.facing.front,
                                overlays: [],
                            },
                            back: {
                                ...bodyOnlyRig.facing.back,
                                overlays: [],
                            },
                        },
                    },
                    setAsDefault,
                }),
            });
            if (!response.ok) {
                throw new Error(await response.text());
            }
            await get().refreshSavedBodyBundles();
            set({ toast: { message: `${displayName} を体パーツBundleとして保存しました`, kind: 'success' } });
        } catch (error) {
            set({ toast: { message: `体パーツBundle保存に失敗しました: ${String(error)}`, kind: 'error' } });
        }
    },

    refreshSavedBodyBundles: async () => {
        try {
            const response = await fetch('/__avatar-editor/body-bundles/list');
            if (!response.ok) {
                throw new Error(await response.text());
            }
            const payload = (await response.json()) as { entries: SavedBodyBundleCatalogEntry[]; defaultSlug: string | null };
            set({
                savedBodyBundles: payload.entries,
                defaultBodyBundleSlug: payload.defaultSlug,
            });
        } catch (error) {
            set({ toast: { message: `体パーツBundle一覧の取得に失敗しました: ${String(error)}`, kind: 'error' } });
        }
    },

    applySavedBodyBundle: async (slug, setAsDefault = false) => {
        try {
            const response = await fetch(`/avatar-body-bundles/${slug}.json?v=${Date.now()}`);
            if (!response.ok) {
                throw new Error(await response.text());
            }
            const parsed = (await response.json()) as Partial<SavedAvatarRig> & { rig?: AvatarRigConfig; name?: string };
            if (!parsed.rig) {
                throw new Error('rig を含むbundleのみ適用できます');
            }
            const loadedRig = parsed.rig;

            set(state => {
                const incomingRig: AvatarRigConfig = {
                    ...loadedRig,
                    version: 1,
                    canvasSize: loadedRig.canvasSize || CANVAS_SIZE,
                    parentMap: loadedRig.parentMap || OVERLAY_PARENT_OPTIONS,
                    activeFacing: loadedRig.activeFacing || 'front',
                    walkCycle: loadedRig.walkCycle || state.rig.walkCycle,
                    previewSelection: loadedRig.previewSelection || state.rig.previewSelection,
                    exportedAt: loadedRig.exportedAt || new Date().toISOString(),
                    facing: loadedRig.facing
                        ? {
                            front: {
                                ...loadedRig.facing.front,
                                overlays: state.rig.facing.front.overlays,
                            },
                            back: {
                                ...loadedRig.facing.back,
                                overlays: state.rig.facing.back.overlays,
                            },
                        }
                        : state.rig.facing,
                };
                const normalizedIncoming = withPlaceholderAssets(incomingRig);
                return {
                    rig: mergeBodyRig(state.rig, normalizedIncoming),
                };
            });

            if (setAsDefault) {
                await get().setDefaultBodyBundle(slug);
            }

            set({ toast: { message: `${parsed.name || slug} を体パーツBundleとして適用しました`, kind: 'success' } });
        } catch (error) {
            set({ toast: { message: `体パーツBundle適用に失敗しました: ${String(error)}`, kind: 'error' } });
        }
    },

    setDefaultBodyBundle: async slug => {
        try {
            const response = await fetch('/__avatar-editor/body-bundles/default', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ slug }),
            });
            if (!response.ok) {
                throw new Error(await response.text());
            }
            await get().refreshSavedBodyBundles();
            set({ toast: { message: `${slug} をデフォルト体パーツBundleに設定しました`, kind: 'success' } });
        } catch (error) {
            set({ toast: { message: `デフォルト設定に失敗しました: ${String(error)}`, kind: 'error' } });
        }
    },

    pickAssetDirectory: async () => {
        const pickerWindow = window as Window & {
            showDirectoryPicker?: (options?: { mode?: 'read' | 'readwrite' }) => Promise<FileSystemDirectoryHandle>;
        };

        if (!pickerWindow.showDirectoryPicker) {
            set({ toast: { message: 'このブラウザはフォルダ保存に対応していません', kind: 'error' } });
            return;
        }

        try {
            const handle = await pickerWindow.showDirectoryPicker({ mode: 'readwrite' });
            set({
                assetDirectoryHandle: handle,
                assetDirectoryName: handle.name,
                toast: { message: `画像保存先を ${handle.name} に設定しました`, kind: 'success' },
            });
        } catch (error) {
            if (error instanceof DOMException && error.name === 'AbortError') return;
            set({ toast: { message: `保存先の設定に失敗しました: ${String(error)}`, kind: 'error' } });
        }
    },

    clearAssetDirectory: () => {
        set({
            assetDirectoryHandle: null,
            assetDirectoryName: null,
            toast: { message: '画像保存先の設定を解除しました', kind: 'info' },
        });
    },

    importBundle: async file => {
        const parsed = JSON.parse(await file.text()) as Partial<SavedAvatarRig> & { rig?: AvatarRigConfig };
        if (!parsed.rig) {
            set({ toast: { message: 'rig を含むJSONのみ読み込めます', kind: 'error' } });
            return;
        }

        const incomingRig: AvatarRigConfig = {
            ...parsed.rig,
            version: 1,
            canvasSize: parsed.rig.canvasSize || CANVAS_SIZE,
            parentMap: parsed.rig.parentMap || OVERLAY_PARENT_OPTIONS,
            activeFacing: parsed.rig.activeFacing || 'front',
            walkCycle: parsed.rig.walkCycle || get().rig.walkCycle,
            previewSelection: parsed.rig.previewSelection || get().rig.previewSelection,
            exportedAt: parsed.rig.exportedAt || new Date().toISOString(),
            facing: parsed.rig.facing
                ? {
                    front: {
                        ...parsed.rig.facing.front,
                        overlays: get().rig.facing.front.overlays,
                    },
                    back: {
                        ...parsed.rig.facing.back,
                        overlays: get().rig.facing.back.overlays,
                    },
                }
                : get().rig.facing,
        };

        const importedRig = withPlaceholderAssets(incomingRig);

        set(state => ({
            rig: mergeBodyRig(state.rig, importedRig),
        }));

        const baseName = file.name.replace(/\.[^.]+$/, '') || 'imported-body-bundle';
        const setAsDefault = window.confirm('このBundleをデフォルト体パーツとして設定しますか？');

        try {
            const bodyOnlyRig = {
                ...importedRig,
                facing: {
                    front: {
                        ...importedRig.facing.front,
                        overlays: [],
                    },
                    back: {
                        ...importedRig.facing.back,
                        overlays: [],
                    },
                },
            };
            const response = await fetch('/__avatar-editor/body-bundles/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: baseName,
                    slug: baseName
                        .toLowerCase()
                        .replace(/\s+/g, '-')
                        .replace(/[^a-z0-9_-]/g, '-')
                        .replace(/-+/g, '-')
                        .replace(/^-|-$/g, '') || 'imported-body-bundle',
                    rig: bodyOnlyRig,
                    setAsDefault,
                }),
            });
            if (!response.ok) {
                throw new Error(await response.text());
            }
            await get().refreshSavedBodyBundles();
            set({ toast: { message: `${file.name} を読み込み、体パーツBundleとして保存しました`, kind: 'success' } });
        } catch (error) {
            set({ toast: { message: `${file.name} は読み込みましたがBundle保存に失敗しました: ${String(error)}`, kind: 'error' } });
        }
    },

    saveRig: async () => {
        try {
            const content = JSON.stringify(get().rig, null, 2);
            const result = await saveTextFile(DEFAULT_FILE_NAME, content);
            set({ toast: { message: result === 'saved' ? 'rig JSON を保存しました' : 'rig JSON をダウンロードしました', kind: 'success' } });
        } catch (error) {
            set({ toast: { message: `保存に失敗しました: ${String(error)}`, kind: 'error' } });
        }
    },

    saveAtlas: async () => {
        try {
            const content = JSON.stringify(buildAtlasBundle(get().rig), null, 2);
            const result = await saveTextFile(DEFAULT_ATLAS_FILE_NAME, content);
            set({ toast: { message: result === 'saved' ? 'atlas JSON を保存しました' : 'atlas JSON をダウンロードしました', kind: 'success' } });
        } catch (error) {
            set({ toast: { message: `保存に失敗しました: ${String(error)}`, kind: 'error' } });
        }
    },

    saveBundle: async () => {
        try {
            const content = JSON.stringify(buildBundle(get().rig), null, 2);
            const result = await saveTextFile(DEFAULT_BUNDLE_FILE_NAME, content);
            set({ toast: { message: result === 'saved' ? 'bundle JSON を保存しました' : 'bundle JSON をダウンロードしました', kind: 'success' } });
        } catch (error) {
            set({ toast: { message: `保存に失敗しました: ${String(error)}`, kind: 'error' } });
        }
    },

    dismissToast: () => set({ toast: null }),
}));