import { Application, Assets, Container, Graphics, Sprite, Texture } from 'pixi.js';
import { CANVAS_SIZE } from '@/tools/avatar-editor/constants';
import type {
    AvatarRigConfig,
    BodyPartAsset,
    FacingMode,
    OverlayPartAsset,
    WalkCycleConfig,
} from '@/tools/avatar-editor/types';
import { computeBodyPose, computeOverlayWorldPosition } from '../services/poseMath';
import { sortRenderableParts, getFacingLayer } from '../services/helpers';

export function createPlaceholderDataUrl(label: string, palette: { fill: string; stroke: string; detail?: string }) {
    const canvas = document.createElement('canvas');
    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;
    const context = canvas.getContext('2d');
    if (!context) return '';

    context.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    context.fillStyle = palette.fill;
    context.strokeStyle = palette.stroke;
    context.lineWidth = 4;
    context.beginPath();
    context.roundRect(36, 36, 128, 128, 24);
    context.fill();
    context.stroke();

    context.fillStyle = palette.detail ?? 'rgba(255,255,255,0.7)';
    context.beginPath();
    context.ellipse(100, 90, 36, 18, 0, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = '#18212f';
    context.font = '700 18px sans-serif';
    context.textAlign = 'center';
    context.fillText(label, 100, 154);

    return canvas.toDataURL();
}

export async function renderPixiPreview(
    host: HTMLDivElement,
    rig: AvatarRigConfig,
    facing: FacingMode,
    walkTime: number,
    selectedBodyParts: BodyPartAsset[],
    selectedOverlays: OverlayPartAsset[],
) {
    host.innerHTML = '';

    const app = new Application();
    await app.init({
        width: 320,
        height: 360,
        backgroundAlpha: 0,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
    });
    host.appendChild(app.canvas);

    const stage = new Container();
    stage.position.set(160, 48);
    app.stage.addChild(stage);
    const activeLayer = getFacingLayer(rig, facing);

    const shadow = new Graphics();
    shadow.ellipse(0, 280, 56, 18).fill({ color: 0x0f172a, alpha: 0.16 });
    stage.addChild(shadow);

    const textureCache: Record<string, Texture> = {};
    const loadTexture = async (src: string) => {
        const cached = textureCache[src];
        if (cached) return cached;
        if (src.startsWith('data:')) {
            const texture = Texture.from(src);
            textureCache[src] = texture;
            return texture;
        }
        const asset = await Assets.load<Texture>(src);
        textureCache[src] = asset;
        return asset;
    };

    const renderableParts = sortRenderableParts(selectedBodyParts, selectedOverlays);
    for (const part of renderableParts) {
        if (!part.src) continue;
        const texture = await loadTexture(part.src);
        const sprite = new Sprite(texture);
        sprite.anchor.set(0.5, 0.5);
        sprite.width = part.width;
        sprite.height = part.height;

        if ('position' in part) {
            const pose = computeBodyPose(part, walkTime, rig.walkCycle);
            sprite.position.set((pose.x - 100) * 1.25, (pose.y - 200) * 1.25);
            sprite.rotation = pose.rotation;
        } else {
            const world = computeOverlayWorldPosition(part, selectedBodyParts, activeLayer.bones, walkTime, rig.walkCycle);
            sprite.position.set((world.x - 100) * 1.25, (world.y - 200) * 1.25);
            sprite.rotation = world.rotation;
        }

        stage.addChild(sprite);
    }

    return () => {
        app.destroy(true, { children: true, texture: false });
    };
}
