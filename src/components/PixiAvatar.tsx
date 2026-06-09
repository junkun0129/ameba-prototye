/**
 * PixiAvatar — 管理画面で作成した Bundle JSON のリグ情報を使い、
 * Pixi.js で歩行アニメーションつきのアバターを描画するコンポーネント。
 *
 * AvatarCanvas（Canvas 2D 手書き）の代替として使用する。
 * 同じ 140×180 の枠の中に収まるよう設計している。
 */
import { useEffect, useRef, useState } from 'react';
import { Application, Assets, Container, Graphics, Sprite, Texture } from 'pixi.js';
import type {
    AvatarRigConfig,
    BodyPartAsset,
    FacingMode,
    OverlayPartAsset,
    OverlayPartType,
    SavedOverlayCatalogEntry,
} from '@/tools/avatar-editor/types';
import type { Direction } from '@/lib/types';
import {
    computeBodyPose,
    computeOverlayWorldPosition,
    getFacingLayer,
    sortRenderableParts,
} from '@/tools/avatar-editor/utils';

type Props = {
    rig: AvatarRigConfig;
    /** 現在の向き。FL/FR => front, BL/BR => back にマップする */
    dir: Direction;
    /** 歩行タイマー (useAmebaStore の avatar.walkCycle を渡す) */
    walkCycle: number;
    /** 歩いているか */
    walking: boolean;
    /** public 配下の保存済みoverlayカタログ */
    savedOverlayCatalog: SavedOverlayCatalogEntry[];
    /** partTypeごとの選択slug */
    selectedOverlaySlugs: Partial<Record<OverlayPartType, string>>;
};

/**
 * 常に front のみを使用。
 * FR/BR は左右反転で表現する（Pixi stage の scale.x で対応）。
 */
function dirToFacing(dir: Direction): { facing: FacingMode; flip: boolean } {
    switch (dir) {
        case 'FL':
        case 'BL':
            return { facing: 'front', flip: false };
        case 'FR':
        case 'BR':
            return { facing: 'front', flip: true };
    }
}

// canvas サイズと Pixi stage 内でのアバター原点
const CANVAS_W = 140;
const CANVAS_H = 180;
// editor の canvasSize は 200px。それを 140×180 に収めるスケール
const EDITOR_CANVAS = 200;
const SCALE = Math.min(CANVAS_W / EDITOR_CANVAS, CANVAS_H / EDITOR_CANVAS) * 1.1;

function loadTexture(src: string, cache: Record<string, Texture>) {
    const cached = cache[src];
    if (cached) return Promise.resolve(cached);
    if (src.startsWith('data:')) {
        const texture = Texture.from(src);
        cache[src] = texture;
        return Promise.resolve(texture);
    }
    return Assets.load<Texture>(src).then(texture => {
        cache[src] = texture;
        return texture;
    });
}

export default function PixiAvatar({ rig, dir, walkCycle, walking, savedOverlayCatalog, selectedOverlaySlugs }: Props) {
    const hostRef = useRef<HTMLDivElement | null>(null);
    const appRef = useRef<Application | null>(null);
    const destroyRef = useRef<(() => void) | null>(null);
    const textureCache = useRef<Record<string, Texture>>({});
    const spriteMap = useRef<Map<string, Sprite>>(new Map());
    const stageRef = useRef<Container | null>(null);
    const [appReady, setAppReady] = useState(false);

    // ------- Pixi Application の初期化（mount 時1回のみ）-------
    useEffect(() => {
        const host = hostRef.current;
        if (!host) return;

        let cancelled = false;
        const app = new Application();

        const init = async () => {
            await app.init({
                width: CANVAS_W,
                height: CANVAS_H,
                backgroundAlpha: 0,
                antialias: true,
                resolution: window.devicePixelRatio || 1,
                autoDensity: true,
            });
            if (cancelled) {
                app.destroy(true);
                return;
            }
            // 既存の canvas を消してから追加（StrictMode 等での多重追加を防ぐ）
            host.innerHTML = '';
            host.appendChild(app.canvas);
            appRef.current = app;

            const root = new Container();
            // アバターの足元を下部中央に合わせる
            root.position.set(CANVAS_W / 2, CANVAS_H - 10);
            root.scale.set(SCALE, SCALE);
            app.stage.addChild(root);
            stageRef.current = root;

            // 影
            const shadow = new Graphics();
            shadow.ellipse(0, 20, 28, 9).fill({ color: 0x0f172a, alpha: 0.14 });
            root.addChild(shadow);

            destroyRef.current = () => {
                app.destroy(true, { children: true, texture: false });
                appRef.current = null;
                stageRef.current = null;
                spriteMap.current.clear();
                setAppReady(false);
            };

            setAppReady(true);
        };

        void init();

        return () => {
            cancelled = true;
            destroyRef.current?.();
        };
    }, []); // mount 時に1回だけ初期化。rig 変更はスプライト更新で対応

    // ------- フレームごとの描画更新 -------
    useEffect(() => {
        const stage = stageRef.current;
        const app = appRef.current;
        if (!stage || !app) return;

        const { facing, flip } = dirToFacing(dir);
        stage.scale.x = flip ? -Math.abs(stage.scale.x) : Math.abs(stage.scale.x);

        const layer = getFacingLayer(rig, facing);
        const walkTime = walking ? walkCycle / 10 : 0; // walkCycle は整数カウント、計算は秒換算

        const visibleBody: BodyPartAsset[] = layer.bodyParts.filter(p => p.visible !== false);
        const overlayByType = new Map(layer.overlays.map(overlay => [overlay.type, overlay] as const));
        for (const [partType, slug] of Object.entries(selectedOverlaySlugs) as Array<[OverlayPartType, string | undefined]>) {
            if (!slug) continue;
            const catalog = savedOverlayCatalog.find(entry => entry.partType === partType && entry.slug === slug);
            if (!catalog) continue;
            const current = overlayByType.get(partType);
            if (!current) continue;
            const selectedUrl = facing === 'front' ? catalog.frontImageUrl : catalog.backImageUrl;
            if (!selectedUrl) continue;
            overlayByType.set(partType, {
                ...current,
                name: catalog.name,
                src: selectedUrl,
                visible: true,   // catalog-selected overlay is always shown
            });
        }

        // Show an overlay if it has an actual image src.
        // The `visible` flag in the base rig is an editor concept; in the user screen
        // any overlay with a populated src should render.
        const visibleOverlay: OverlayPartAsset[] = [...overlayByType.values()]
            .filter(p => Boolean(p.src))
            .map(part => ({
                ...part,
                visible: true,
            }));
        const renderables = sortRenderableParts(visibleBody, visibleOverlay);

        const loadAndDraw = async () => {
            // スプライトを更新
            const nextIds = new Set(renderables.map(p => p.id));

            // 不要になったスプライトを除去
            for (const [id, sprite] of spriteMap.current.entries()) {
                if (!nextIds.has(id)) {
                    stage.removeChild(sprite);
                    sprite.destroy();
                    spriteMap.current.delete(id);
                }
            }

            for (let i = 0; i < renderables.length; i++) {
                const part = renderables[i];
                if (!part.src) continue;

                // テクスチャのキャッシュロード
                const texture = await loadTexture(part.src, textureCache.current);

                let sprite = spriteMap.current.get(part.id);
                if (!sprite) {
                    sprite = new Sprite(texture);
                    sprite.anchor.set(0.5, 0.5);
                    stage.addChild(sprite);
                    spriteMap.current.set(part.id, sprite);
                } else if (sprite.texture !== texture) {
                    sprite.texture = texture;
                }

                sprite.width = part.width;
                sprite.height = part.height;
                // zIndex を Pixi の zIndex に反映してソート順を維持
                sprite.zIndex = part.zIndex;

                if ('position' in part) {
                    const pose = computeBodyPose(part, walkTime, rig.walkCycle);
                    // editor のキャンバス中心 (100) からの相対座標に変換
                    sprite.position.set(pose.x - EDITOR_CANVAS / 2, pose.y - EDITOR_CANVAS);
                    sprite.rotation = pose.rotation;
                } else {
                    const world = computeOverlayWorldPosition(part, visibleBody, layer.bones, walkTime, rig.walkCycle);
                    sprite.position.set(world.x - EDITOR_CANVAS / 2, world.y - EDITOR_CANVAS);
                    sprite.rotation = world.rotation;
                }
            }

            stage.sortChildren();
        };

        void loadAndDraw();
    }, [appReady, rig, dir, walkCycle, walking, savedOverlayCatalog, selectedOverlaySlugs]);

    return (
        <div
            ref={hostRef}
            style={{ width: CANVAS_W, height: CANVAS_H, position: 'absolute', left: 0, top: 0 }}
        />
    );
}
