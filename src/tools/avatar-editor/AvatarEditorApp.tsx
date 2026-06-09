import { useEffect, useMemo, useRef, useState } from 'react';
import {
    BODY_PART_ORDER,
    CANVAS_SIZE,
    FACING_LABELS,
    OVERLAY_PART_ORDER,
} from '@/tools/avatar-editor/constants';
import EditorHeader from '@/tools/avatar-editor/components/EditorHeader';
import PreviewPanel from '@/tools/avatar-editor/components/PreviewPanel';
import AssetsTab from '@/tools/avatar-editor/components/tabs/AssetsTab';
import BonesTab from '@/tools/avatar-editor/components/tabs/BonesTab';
import JsonTab from '@/tools/avatar-editor/components/tabs/JsonTab';
import OverlaysTab from '@/tools/avatar-editor/components/tabs/OverlaysTab';
import { cardClassName, settingsTabs } from '@/tools/avatar-editor/components/shared';
import { useAvatarEditorStore } from '@/tools/avatar-editor/store/useAvatarEditorStore';
import type { BodyPartType, BoneName, FacingMode, JsonPreviewMode, OverlayPartType, SettingsTabId } from '@/tools/avatar-editor/types';
import { buildAtlasBundle, buildBundle, computeBodyPose, computeOverlayWorldPosition, getFacingLayer, renderPixiPreview, sortRenderableParts } from '@/tools/avatar-editor/utils';
import type { DragState, EditMode, ImageTarget } from '@/tools/avatar-editor/components/shared';

const facingModes: FacingMode[] = ['front', 'back'];

export default function AvatarEditorApp() {
    const rig = useAvatarEditorStore(state => state.rig);
    const assetDirectoryName = useAvatarEditorStore(state => state.assetDirectoryName);
    const activeBone = useAvatarEditorStore(state => state.activeBone);
    const activeOverlay = useAvatarEditorStore(state => state.activeOverlay);
    const activeSettingsTab = useAvatarEditorStore(state => state.activeSettingsTab);
    const jsonPreviewMode = useAvatarEditorStore(state => state.jsonPreviewMode);
    const walkTime = useAvatarEditorStore(state => state.walkTime);
    const isAnimationPlaying = useAvatarEditorStore(state => state.isAnimationPlaying);
    const storedAssets = useAvatarEditorStore(state => state.storedAssets);
    const savedOverlays = useAvatarEditorStore(state => state.savedOverlays);
    const savedBodyBundles = useAvatarEditorStore(state => state.savedBodyBundles);
    const defaultBodyBundleSlug = useAvatarEditorStore(state => state.defaultBodyBundleSlug);
    const toast = useAvatarEditorStore(state => state.toast);
    const tickWalk = useAvatarEditorStore(state => state.tickWalk);
    const setActiveBone = useAvatarEditorStore(state => state.setActiveBone);
    const setActiveOverlay = useAvatarEditorStore(state => state.setActiveOverlay);
    const setActiveFacing = useAvatarEditorStore(state => state.setActiveFacing);
    const setActiveSettingsTab = useAvatarEditorStore(state => state.setActiveSettingsTab);
    const setJsonPreviewMode = useAvatarEditorStore(state => state.setJsonPreviewMode);
    const setAnimationPlaying = useAvatarEditorStore(state => state.setAnimationPlaying);
    const moveBone = useAvatarEditorStore(state => state.moveBone);
    const updateBoneValue = useAvatarEditorStore(state => state.updateBoneValue);
    const updateBodyPartValue = useAvatarEditorStore(state => state.updateBodyPartValue);
    const updateBodyPartPosition = useAvatarEditorStore(state => state.updateBodyPartPosition);
    const updateBodyPartZIndex = useAvatarEditorStore(state => state.updateBodyPartZIndex);
    const updateBodyPartVisible = useAvatarEditorStore(state => state.updateBodyPartVisible);
    const updateWalkCycle = useAvatarEditorStore(state => state.updateWalkCycle);
    const updateOverlayRelativePosition = useAvatarEditorStore(state => state.updateOverlayRelativePosition);
    const updateOverlayPosition = useAvatarEditorStore(state => state.updateOverlayPosition);
    const updateOverlayTarget = useAvatarEditorStore(state => state.updateOverlayTarget);
    const updateOverlayZIndex = useAvatarEditorStore(state => state.updateOverlayZIndex);
    const updateOverlayVisible = useAvatarEditorStore(state => state.updateOverlayVisible);
    const updateOverlayName = useAvatarEditorStore(state => state.updateOverlayName);
    const updateBodySelection = useAvatarEditorStore(state => state.updateBodySelection);
    const updateOverlaySelection = useAvatarEditorStore(state => state.updateOverlaySelection);
    const uploadAsset = useAvatarEditorStore(state => state.uploadAsset);
    const selectStoredAsset = useAvatarEditorStore(state => state.selectStoredAsset);
    const refreshStoredAssets = useAvatarEditorStore(state => state.refreshStoredAssets);
    const saveOverlayPart = useAvatarEditorStore(state => state.saveOverlayPart);
    const refreshSavedOverlays = useAvatarEditorStore(state => state.refreshSavedOverlays);
    const applySavedOverlay = useAvatarEditorStore(state => state.applySavedOverlay);
    const saveCurrentBodyBundle = useAvatarEditorStore(state => state.saveCurrentBodyBundle);
    const refreshSavedBodyBundles = useAvatarEditorStore(state => state.refreshSavedBodyBundles);
    const applySavedBodyBundle = useAvatarEditorStore(state => state.applySavedBodyBundle);
    const setDefaultBodyBundle = useAvatarEditorStore(state => state.setDefaultBodyBundle);
    const pickAssetDirectory = useAvatarEditorStore(state => state.pickAssetDirectory);
    const clearAssetDirectory = useAvatarEditorStore(state => state.clearAssetDirectory);
    const importBundle = useAvatarEditorStore(state => state.importBundle);
    const saveRig = useAvatarEditorStore(state => state.saveRig);
    const saveAtlas = useAvatarEditorStore(state => state.saveAtlas);
    const saveBundle = useAvatarEditorStore(state => state.saveBundle);
    const dismissToast = useAvatarEditorStore(state => state.dismissToast);

    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const pixiHostRef = useRef<HTMLDivElement | null>(null);
    const dragStateRef = useRef<DragState | null>(null);
    const imageCacheRef = useRef<Record<string, HTMLImageElement>>({});
    const didApplyDefaultBodyBundleRef = useRef(false);
    const [hoverPoint, setHoverPoint] = useState<{ x: number; y: number } | null>(null);
    const [editMode, setEditMode] = useState<EditMode>('bone');
    const [activeImageTarget, setActiveImageTarget] = useState<ImageTarget | null>(null);
    const [bodyBundleName, setBodyBundleName] = useState('');
    const [selectedBodyBundleSlug, setSelectedBodyBundleSlug] = useState('');
    const activeLayer = useMemo(() => getFacingLayer(rig, rig.activeFacing), [rig]);
    const displayWalkTime = isAnimationPlaying ? walkTime : 0;

    const selectedBodyParts = useMemo(
        () =>
            BODY_PART_ORDER.flatMap(type => {
                const part = activeLayer.bodyParts.find(item => item.id === rig.previewSelection.bodyPartIds[type]) ?? activeLayer.bodyParts.find(item => item.type === type);
                return part && part.visible !== false ? [part] : [];
            }),
        [activeLayer.bodyParts, rig.previewSelection.bodyPartIds],
    );

    const selectedOverlays = useMemo(
        () =>
            OVERLAY_PART_ORDER.flatMap(type => {
                const part = activeLayer.overlays.find(item => item.id === rig.previewSelection.overlayPartIds[type]) ?? activeLayer.overlays.find(item => item.type === type);
                return part && part.visible !== false ? [part] : [];
            }),
        [activeLayer.overlays, rig.previewSelection.overlayPartIds],
    );
    const renderedParts = useMemo(() => sortRenderableParts(selectedBodyParts, selectedOverlays), [selectedBodyParts, selectedOverlays]);

    const activeBoneData = useMemo(() => activeLayer.bones.find(bone => bone.name === activeBone) ?? activeLayer.bones[0], [activeBone, activeLayer.bones]);
    const activeOverlayData = useMemo(() => activeLayer.overlays.find(overlay => overlay.type === activeOverlay) ?? activeLayer.overlays[0], [activeOverlay, activeLayer.overlays]);
    const activeBodyPart = useMemo(() => activeLayer.bodyParts.find(part => part.type === activeBoneData.partType) ?? activeLayer.bodyParts[0], [activeBoneData.partType, activeLayer.bodyParts]);

    const jsonPreview = useMemo(() => {
        if (jsonPreviewMode === 'rig') return JSON.stringify(rig, null, 2);
        if (jsonPreviewMode === 'atlas') return JSON.stringify(buildAtlasBundle(rig), null, 2);
        return JSON.stringify(buildBundle(rig), null, 2);
    }, [jsonPreviewMode, rig]);

    const getCachedImage = (key: string, src: string) => {
        const cached = imageCacheRef.current[key];
        if (cached && cached.src === src) {
            return cached;
        }
        const image = new Image();
        image.src = src;
        imageCacheRef.current[key] = image;
        return image;
    };

    useEffect(() => {
        let frameId = 0;
        let lastTime = performance.now();

        const loop = (now: number) => {
            if (!isAnimationPlaying) {
                lastTime = now;
                frameId = window.requestAnimationFrame(loop);
                return;
            }
            const delta = (now - lastTime) / 1000;
            lastTime = now;
            tickWalk(Math.min(delta, 0.033));
            frameId = window.requestAnimationFrame(loop);
        };

        frameId = window.requestAnimationFrame(loop);
        return () => window.cancelAnimationFrame(frameId);
    }, [isAnimationPlaying, tickWalk]);

    useEffect(() => {
        void refreshStoredAssets();
    }, [refreshStoredAssets]);

    useEffect(() => {
        void refreshSavedOverlays();
    }, [refreshSavedOverlays]);

    useEffect(() => {
        void refreshSavedBodyBundles();
    }, [refreshSavedBodyBundles]);

    useEffect(() => {
        if (!selectedBodyBundleSlug && defaultBodyBundleSlug) {
            setSelectedBodyBundleSlug(defaultBodyBundleSlug);
        }
    }, [defaultBodyBundleSlug, selectedBodyBundleSlug]);

    useEffect(() => {
        if (didApplyDefaultBodyBundleRef.current) return;
        if (!defaultBodyBundleSlug) return;
        didApplyDefaultBodyBundleRef.current = true;
        void applySavedBodyBundle(defaultBodyBundleSlug, false);
    }, [applySavedBodyBundle, defaultBodyBundleSlug]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const context = canvas.getContext('2d');
        if (!context) return;

        context.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
        context.fillStyle = '#fffdf8';
        context.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

        context.strokeStyle = 'rgba(15, 23, 42, 0.08)';
        context.lineWidth = 1;
        for (let offset = 0; offset <= CANVAS_SIZE; offset += 20) {
            context.beginPath();
            context.moveTo(offset, 0);
            context.lineTo(offset, CANVAS_SIZE);
            context.stroke();
            context.beginPath();
            context.moveTo(0, offset);
            context.lineTo(CANVAS_SIZE, offset);
            context.stroke();
        }

        context.strokeStyle = 'rgba(14, 165, 233, 0.35)';
        context.beginPath();
        context.moveTo(CANVAS_SIZE / 2, 0);
        context.lineTo(CANVAS_SIZE / 2, CANVAS_SIZE);
        context.stroke();
        context.beginPath();
        context.moveTo(0, CANVAS_SIZE / 2);
        context.lineTo(CANVAS_SIZE, CANVAS_SIZE / 2);
        context.stroke();

        renderedParts.forEach(part => {
            context.save();
            if ('position' in part) {
                const pose = computeBodyPose(part, displayWalkTime, rig.walkCycle);
                context.translate(pose.x, pose.y);
                context.rotate(pose.rotation);
                if (part.src) {
                    const image = getCachedImage(part.id, part.src);
                    context.globalAlpha = 0.96;
                    if (image.complete) {
                        context.drawImage(image, -part.width / 2, -part.height / 2, part.width, part.height);
                    }
                }
                context.strokeStyle = activeBodyPart.type === part.type ? '#0ea5e9' : 'rgba(51, 65, 85, 0.22)';
                context.lineWidth = activeBodyPart.type === part.type ? 2 : 1;
                context.strokeRect(-part.width / 2, -part.height / 2, part.width, part.height);
                context.fillStyle = '#0f172a';
                context.beginPath();
                context.arc(part.pivot.x - pose.x, part.pivot.y - pose.y, 3, 0, Math.PI * 2);
                context.fill();
            } else {
                const world = computeOverlayWorldPosition(part, selectedBodyParts, activeLayer.bones, displayWalkTime, rig.walkCycle);
                context.translate(world.x, world.y);
                context.rotate(world.rotation);
                if (part.src) {
                    const image = getCachedImage(part.id, part.src);
                    if (image.complete) {
                        context.drawImage(image, -part.width / 2, -part.height / 2, part.width, part.height);
                    }
                }
                context.strokeStyle = activeOverlayData.type === part.type ? '#f97316' : 'rgba(249, 115, 22, 0.2)';
                context.strokeRect(-part.width / 2, -part.height / 2, part.width, part.height);
            }
            context.restore();
        });

        context.strokeStyle = 'rgba(51, 65, 85, 0.2)';
        context.lineWidth = 2;
        activeLayer.bones.forEach(bone => {
            if (!bone.parent) return;
            const parent = activeLayer.bones.find(item => item.name === bone.parent);
            if (!parent) return;
            context.beginPath();
            context.moveTo(parent.point.x, parent.point.y);
            context.lineTo(bone.point.x, bone.point.y);
            context.stroke();
        });

        activeLayer.bones.forEach(bone => {
            context.fillStyle = bone.name === activeBone ? '#0ea5e9' : '#0f172a';
            context.beginPath();
            context.arc(bone.point.x, bone.point.y, bone.name === activeBone ? 6 : 4, 0, Math.PI * 2);
            context.fill();
            context.fillStyle = '#0f172a';
            context.font = '600 11px sans-serif';
            context.fillText(bone.name, bone.point.x + 8, bone.point.y - 8);
        });

        if (hoverPoint) {
            context.fillStyle = '#0f172a';
            context.font = '700 11px sans-serif';
            context.fillText(`${hoverPoint.x}, ${hoverPoint.y}`, 12, 16);
        }
    }, [activeBone, activeBodyPart.type, activeLayer.bones, activeOverlayData.type, displayWalkTime, hoverPoint, renderedParts, rig.walkCycle, selectedBodyParts, selectedOverlays]);

    // Pixi preview: rebuild only when the rig or part selection changes, NOT every animation frame.
    // Animation is visible in the Canvas 2D preview above; Pixi preview shows the base pose
    // (walk time = 0) so the async app.init() can complete before the next re-render.
    useEffect(() => {
        const host = pixiHostRef.current;
        if (!host) return;

        let dispose: (() => void) | undefined;
        let cancelled = false;

        void renderPixiPreview(host, rig, rig.activeFacing, 0, selectedBodyParts, selectedOverlays).then(cleanup => {
            if (cancelled) {
                cleanup();
                return;
            }
            dispose = cleanup;
        });

        return () => {
            cancelled = true;
            dispose?.();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rig, selectedBodyParts, selectedOverlays]);

    useEffect(() => {
        if (!toast) return;
        const timer = window.setTimeout(() => dismissToast(), 3200);
        return () => window.clearTimeout(timer);
    }, [dismissToast, toast]);

    const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const scaleX = CANVAS_SIZE / rect.width;
        const scaleY = CANVAS_SIZE / rect.height;
        const point = {
            x: Math.round((event.clientX - rect.left) * scaleX),
            y: Math.round((event.clientY - rect.top) * scaleY),
        };
        setHoverPoint(point);
        if (!dragStateRef.current) return;
        if (dragStateRef.current.kind === 'bone') {
            moveBone(dragStateRef.current.boneName, point);
            return;
        }
        if (dragStateRef.current.kind === 'body') {
            updateBodyPartPosition(dragStateRef.current.partType, {
                x: point.x + dragStateRef.current.offsetX,
                y: point.y + dragStateRef.current.offsetY,
            });
            return;
        }
        updateOverlayPosition(dragStateRef.current.overlayType, {
            x: point.x + dragStateRef.current.offsetX,
            y: point.y + dragStateRef.current.offsetY,
        });
    };

    const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const scaleX = CANVAS_SIZE / rect.width;
        const scaleY = CANVAS_SIZE / rect.height;
        const x = Math.round((event.clientX - rect.left) * scaleX);
        const y = Math.round((event.clientY - rect.top) * scaleY);

        if (editMode === 'image') {
            if (!activeImageTarget) return;
            if (activeImageTarget.kind === 'body') {
                const target = selectedBodyParts.find(part => part.type === activeImageTarget.partType);
                if (!target) return;
                const pose = computeBodyPose(target, displayWalkTime, rig.walkCycle);
                dragStateRef.current = {
                    kind: 'body',
                    partType: activeImageTarget.partType,
                    offsetX: pose.x - x,
                    offsetY: pose.y - y,
                };
            } else {
                const target = selectedOverlays.find(part => part.type === activeImageTarget.partType);
                if (!target) return;
                const world = computeOverlayWorldPosition(target, selectedBodyParts, activeLayer.bones, displayWalkTime, rig.walkCycle);
                dragStateRef.current = {
                    kind: 'overlay',
                    overlayType: activeImageTarget.partType,
                    offsetX: world.x - x,
                    offsetY: world.y - y,
                };
            }
            event.currentTarget.setPointerCapture(event.pointerId);
            return;
        }

        const nearestBone = [...activeLayer.bones]
            .map(bone => ({ bone, distance: Math.hypot(bone.point.x - x, bone.point.y - y) }))
            .sort((left, right) => left.distance - right.distance)[0];

        if (!nearestBone || nearestBone.distance > 16) return;
        dragStateRef.current = { kind: 'bone', boneName: nearestBone.bone.name };
        setActiveBone(nearestBone.bone.name);
        moveBone(nearestBone.bone.name, { x, y });
        event.currentTarget.setPointerCapture(event.pointerId);
    };

    const handlePointerUp = (event: React.PointerEvent<HTMLCanvasElement>) => {
        dragStateRef.current = null;
        event.currentTarget.releasePointerCapture(event.pointerId);
    };

    const handleUpload = async (
        event: React.ChangeEvent<HTMLInputElement>,
        kind: 'body' | 'overlay',
        partType: BodyPartType | OverlayPartType,
        facing?: FacingMode,
    ) => {
        const file = event.target.files?.[0];
        if (!file) return;
        await uploadAsset(kind, partType, file, facing);
        event.target.value = '';
    };

    const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        await importBundle(file);
        setBodyBundleName(file.name.replace(/\.[^.]+$/, ''));
        event.target.value = '';
    };

    return (
        <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.95),_transparent_32%),linear-gradient(180deg,_#c7f9ff_0%,_#f5efe3_55%,_#ffe6cf_100%)] px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
            <div className="mx-auto flex max-w-[1600px] flex-col gap-5">
                <EditorHeader
                    assetDirectoryName={assetDirectoryName}
                    bodyBundleName={bodyBundleName}
                    selectedBodyBundleSlug={selectedBodyBundleSlug}
                    savedBodyBundles={savedBodyBundles}
                    defaultBodyBundleSlug={defaultBodyBundleSlug}
                    onBodyBundleNameChange={setBodyBundleName}
                    onSelectedBodyBundleSlugChange={setSelectedBodyBundleSlug}
                    onImportBundle={handleImport}
                    onSaveRig={() => void saveRig()}
                    onSaveAtlas={() => void saveAtlas()}
                    onSaveBundle={() => void saveBundle()}
                    onSaveCurrentBodyBundle={setAsDefault => void saveCurrentBodyBundle(bodyBundleName || 'body-bundle', setAsDefault)}
                    onApplySavedBodyBundle={() => {
                        if (!selectedBodyBundleSlug) return;
                        void applySavedBodyBundle(selectedBodyBundleSlug, false);
                    }}
                    onSetDefaultBodyBundle={() => {
                        if (!selectedBodyBundleSlug) return;
                        void setDefaultBodyBundle(selectedBodyBundleSlug);
                    }}
                    onPickAssetDirectory={() => void pickAssetDirectory()}
                    onClearAssetDirectory={clearAssetDirectory}
                />

                <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_460px]">
                    <PreviewPanel
                        canvasRef={canvasRef}
                        pixiHostRef={pixiHostRef}
                        rigActiveFacing={rig.activeFacing}
                        editMode={editMode}
                        isAnimationPlaying={isAnimationPlaying}
                        activeImageTarget={activeImageTarget}
                        bodyPartOrder={BODY_PART_ORDER}
                        overlayPartOrder={OVERLAY_PART_ORDER}
                        onSetEditMode={setEditMode}
                        onToggleAnimation={() => setAnimationPlaying(!isAnimationPlaying)}
                        onSetActiveFacing={setActiveFacing}
                        onSetActiveImageTarget={setActiveImageTarget}
                        onCanvasPointerMove={handlePointerMove}
                        onCanvasPointerDown={handlePointerDown}
                        onCanvasPointerUp={handlePointerUp}
                        onCanvasPointerLeave={() => setHoverPoint(null)}
                    />

                    <section className={`${cardClassName} flex flex-col gap-4`}>
                        <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-4">
                            {settingsTabs.map(tab => (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveSettingsTab(tab.id)}
                                    className={`rounded-2xl px-4 py-2 text-sm font-black transition ${activeSettingsTab === tab.id ? 'bg-cyan-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {activeSettingsTab === 'assets' ? (
                            <AssetsTab
                                rig={rig}
                                facingModes={facingModes}
                                storedAssets={storedAssets}
                                savedOverlays={savedOverlays}
                                onSetActiveFacing={setActiveFacing}
                                onUpdateBodyPartZIndex={updateBodyPartZIndex}
                                onUpdateBodyPartVisible={updateBodyPartVisible}
                                onSelectStoredAsset={(kind, partType, assetUrl, fileName) => {
                                    void selectStoredAsset(kind, partType, assetUrl, fileName);
                                }}
                                onUpload={(event, kind, partType, facing) => {
                                    void handleUpload(event, kind, partType, facing);
                                }}
                                onUpdateOverlayZIndex={updateOverlayZIndex}
                                onUpdateOverlayVisible={updateOverlayVisible}
                                onSaveOverlayPart={partType => {
                                    void saveOverlayPart(partType);
                                }}
                                onUpdateOverlayName={updateOverlayName}
                                onApplySavedOverlay={(partType, slug) => {
                                    void applySavedOverlay(partType, slug);
                                }}
                            />
                        ) : null}

                        {activeSettingsTab === 'bones' ? (
                            <BonesTab
                                activeFacing={rig.activeFacing}
                                bones={activeLayer.bones}
                                activeBone={activeBone}
                                activeBoneData={activeBoneData}
                                activeBodyPart={activeBodyPart}
                                onSetActiveBone={setActiveBone}
                                onUpdateBoneValue={updateBoneValue}
                                onUpdateBodyPartValue={updateBodyPartValue}
                            />
                        ) : null}

                        {activeSettingsTab === 'overlays' ? (
                            <OverlaysTab
                                activeFacingLabel={FACING_LABELS[rig.activeFacing]}
                                activeLayer={activeLayer}
                                activeOverlay={activeOverlay}
                                activeOverlayData={activeOverlayData}
                                previewSelection={rig.previewSelection}
                                onSetActiveOverlay={setActiveOverlay}
                                onUpdateOverlayTarget={updateOverlayTarget}
                                onUpdateOverlayRelativePosition={updateOverlayRelativePosition}
                                onUpdateOverlayZIndex={(overlayType, value) => updateOverlayZIndex(overlayType, value)}
                                onUpdateOverlayVisible={(overlayType, visible) => updateOverlayVisible(overlayType, visible)}
                                onUpdateBodySelection={updateBodySelection}
                                onUpdateOverlaySelection={updateOverlaySelection}
                            />
                        ) : null}

                        {activeSettingsTab === 'json' ? <JsonTab jsonPreviewMode={jsonPreviewMode} jsonPreview={jsonPreview} onSetJsonPreviewMode={setJsonPreviewMode} /> : null}
                    </section>
                </div>
            </div>

            {toast ? (
                <div className={`fixed bottom-4 right-4 rounded-2xl px-4 py-3 text-sm font-black text-white shadow-[0_18px_40px_rgba(15,23,42,0.2)] ${toast.kind === 'error' ? 'bg-rose-500' : toast.kind === 'success' ? 'bg-emerald-500' : 'bg-slate-900'}`}>
                    {toast.message}
                </div>
            ) : null}
        </main>
    );
}