import type { BodyPartType, BoneName, OverlayPartType, SettingsTabId } from '@/tools/avatar-editor/types';

export type EditMode = 'image' | 'bone';

export type DragState =
    | { kind: 'bone'; boneName: BoneName }
    | { kind: 'body'; partType: BodyPartType; offsetX: number; offsetY: number }
    | { kind: 'overlay'; overlayType: OverlayPartType; offsetX: number; offsetY: number };

export type ImageTarget =
    | { kind: 'body'; partType: BodyPartType }
    | { kind: 'overlay'; partType: OverlayPartType };

export const numberInputClassName =
    'w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200';

export const cardClassName = 'rounded-[28px] border border-white/60 bg-white/85 p-4 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur';

export const settingsTabs: Array<{ id: SettingsTabId; label: string }> = [
    { id: 'assets', label: 'Assets' },
    { id: 'bones', label: 'Bones' },
    { id: 'overlays', label: 'Overlays' },
    { id: 'json', label: 'JSON' },
];
