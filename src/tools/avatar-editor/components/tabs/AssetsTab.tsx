import type { ChangeEvent } from 'react';
import {
    BODY_PART_LABELS,
    BODY_PART_ORDER,
    FACING_LABELS,
    OVERLAY_PART_LABELS,
    OVERLAY_PART_ORDER,
} from '@/tools/avatar-editor/constants';
import { numberInputClassName } from '@/tools/avatar-editor/components/shared';
import type {
    AvatarRigConfig,
    BodyPartType,
    FacingMode,
    OverlayPartType,
    SavedOverlayCatalogEntry,
    UploadKind,
} from '@/tools/avatar-editor/types';
import { getFacingLayer } from '@/tools/avatar-editor/utils';

type StoredAssetEntry = {
    kind: UploadKind;
    partType: BodyPartType | OverlayPartType;
    fileName: string;
    url: string;
};

type Props = {
    rig: AvatarRigConfig;
    facingModes: FacingMode[];
    storedAssets: StoredAssetEntry[];
    savedOverlays: SavedOverlayCatalogEntry[];
    onSetActiveFacing: (facing: FacingMode) => void;
    onUpdateBodyPartZIndex: (partType: BodyPartType, value: number, facing: FacingMode) => void;
    onUpdateBodyPartVisible: (partType: BodyPartType, visible: boolean, facing: FacingMode) => void;
    onSelectStoredAsset: (kind: UploadKind, partType: BodyPartType | OverlayPartType, assetUrl: string, fileName: string) => void;
    onUpload: (event: ChangeEvent<HTMLInputElement>, kind: UploadKind, partType: BodyPartType | OverlayPartType, facing?: FacingMode) => void;
    onUpdateOverlayZIndex: (overlayType: OverlayPartType, value: number, facing: FacingMode) => void;
    onUpdateOverlayVisible: (overlayType: OverlayPartType, visible: boolean, facing: FacingMode) => void;
    onSaveOverlayPart: (partType: OverlayPartType) => void;
    onUpdateOverlayName: (overlayType: OverlayPartType, name: string) => void;
    onApplySavedOverlay: (partType: OverlayPartType, slug: string) => void;
};

export default function AssetsTab({
    rig,
    facingModes,
    storedAssets,
    savedOverlays,
    onSetActiveFacing,
    onUpdateBodyPartZIndex,
    onUpdateBodyPartVisible,
    onSelectStoredAsset,
    onUpload,
    onUpdateOverlayZIndex,
    onUpdateOverlayVisible,
    onSaveOverlayPart,
    onUpdateOverlayName,
    onApplySavedOverlay,
}: Props) {
    return (
        <>
            <div>
                <h2 className="text-lg font-black text-slate-900">アセット登録</h2>
                <p className="mt-1 text-sm font-medium text-slate-500">body は従来どおり画像を即保存します。overlay は front/back を調整後に「保存」で初めて永続化され、着せ替え側のサムネイル一覧に公開されます。</p>
            </div>

            <div className="grid gap-4">
                {facingModes.map(facing => {
                    const layer = getFacingLayer(rig, facing);
                    return (
                        <div key={facing} className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
                            <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-3">
                                <div>
                                    <p className="text-sm font-black uppercase tracking-[0.18em] text-cyan-700">{FACING_LABELS[facing]}</p>
                                    <p className="mt-1 text-xs font-semibold text-slate-500">この面の Z を個別に調整します。</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => onSetActiveFacing(facing)}
                                    className={`rounded-xl px-3 py-2 text-xs font-black transition ${rig.activeFacing === facing ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 hover:bg-slate-100'}`}
                                >
                                    Preview に切替
                                </button>
                            </div>

                            <div className="mt-4 grid gap-3">
                                <div className="rounded-2xl border border-slate-200 bg-white/90 p-3">
                                    <div className="flex items-center justify-between gap-3">
                                        <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Body Z</p>
                                        <span className="text-[11px] font-semibold text-slate-400">{layer.bodyParts.length} parts</span>
                                    </div>
                                    <div className="mt-3 grid gap-2">
                                        {BODY_PART_ORDER.map(type => {
                                            const part = layer.bodyParts.find(item => item.type === type);
                                            if (!part) return null;
                                            return (
                                                <div key={`${facing}-${type}`} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                                                    <div className="grid gap-2 sm:grid-cols-[minmax(0,72px)_88px_minmax(0,1fr)_auto] sm:items-center">
                                                        <div>
                                                            <p className="text-sm font-black text-slate-900">{BODY_PART_LABELS[type]}</p>
                                                            <p className="text-[11px] font-semibold text-slate-500">{part.name}</p>
                                                        </div>
                                                        <label className="grid gap-1 text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
                                                            Z Index
                                                            <input className={numberInputClassName} type="number" value={part.zIndex} onChange={event => onUpdateBodyPartZIndex(type, Number(event.target.value), facing)} />
                                                        </label>
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <label className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
                                                                <input type="checkbox" checked={part.visible !== false} onChange={event => onUpdateBodyPartVisible(type, event.target.checked, facing)} />
                                                                表示
                                                            </label>
                                                            <select
                                                                className={`${numberInputClassName} min-w-0`}
                                                                value=""
                                                                onChange={event => {
                                                                    const assetUrl = event.target.value;
                                                                    const fileName = event.target.selectedOptions[0]?.dataset.filename;
                                                                    if (!assetUrl || !fileName) return;
                                                                    onSelectStoredAsset('body', type, assetUrl, fileName);
                                                                    event.target.value = '';
                                                                }}
                                                            >
                                                                <option value="">保存済み画像を選択</option>
                                                                {storedAssets.filter(asset => asset.kind === 'body' && asset.partType === type).map(asset => (
                                                                    <option key={`${asset.kind}-${asset.partType}-${asset.fileName}`} value={asset.url} data-filename={asset.fileName}>
                                                                        {asset.fileName}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                        <label className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-black text-white sm:self-center">
                                                            画像選択
                                                            <input type="file" accept="image/png,image/webp,image/jpeg" className="hidden" onChange={event => onUpload(event, 'body', type)} />
                                                        </label>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="rounded-2xl border border-slate-200 bg-white/90 p-3">
                                    <div className="flex items-center justify-between gap-3">
                                        <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Overlay Z</p>
                                        <span className="text-[11px] font-semibold text-slate-400">{layer.overlays.length} parts</span>
                                    </div>
                                    <div className="mt-3 grid gap-2">
                                        {OVERLAY_PART_ORDER.map(type => {
                                            const part = layer.overlays.find(item => item.type === type);
                                            if (!part) return null;
                                            return (
                                                <div key={`${facing}-${type}`} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                                                    <div className="grid gap-2 sm:grid-cols-[minmax(0,72px)_88px_minmax(0,1fr)_auto] sm:items-center">
                                                        <div>
                                                            <p className="text-sm font-black text-slate-900">{OVERLAY_PART_LABELS[type]}</p>
                                                            <p className="text-[11px] font-semibold text-slate-500">{part.name}</p>
                                                        </div>
                                                        <label className="grid gap-1 text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
                                                            Z Index
                                                            <input className={numberInputClassName} type="number" value={part.zIndex} onChange={event => onUpdateOverlayZIndex(type, Number(event.target.value), facing)} />
                                                        </label>
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <label className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
                                                                <input type="checkbox" checked={part.visible !== false} onChange={event => onUpdateOverlayVisible(type, event.target.checked, facing)} />
                                                                表示
                                                            </label>
                                                            <select
                                                                className={`${numberInputClassName} min-w-0`}
                                                                value=""
                                                                onChange={event => {
                                                                    const assetUrl = event.target.value;
                                                                    const fileName = event.target.selectedOptions[0]?.dataset.filename;
                                                                    if (!assetUrl || !fileName) return;
                                                                    onSelectStoredAsset('overlay', type, assetUrl, fileName);
                                                                    event.target.value = '';
                                                                }}
                                                            >
                                                                <option value="">保存済み画像を選択</option>
                                                                {storedAssets.filter(asset => asset.kind === 'overlay' && asset.partType === type).map(asset => (
                                                                    <option key={`${asset.kind}-${asset.partType}-${asset.fileName}`} value={asset.url} data-filename={asset.fileName}>
                                                                        {asset.fileName}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                        <label className="rounded-xl bg-orange-500 px-3 py-2 text-xs font-black text-white sm:self-center">
                                                            画像選択
                                                            <input type="file" accept="image/png,image/webp,image/jpeg" className="hidden" onChange={event => onUpload(event, 'overlay', type, facing)} />
                                                        </label>
                                                        <button
                                                            type="button"
                                                            onClick={() => onSaveOverlayPart(type)}
                                                            className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-black text-white transition hover:bg-emerald-500"
                                                        >
                                                            保存
                                                        </button>
                                                    </div>
                                                    <div className="mt-2 grid gap-2 sm:grid-cols-[140px_minmax(0,1fr)] sm:items-end">
                                                        <label className="grid gap-1 text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
                                                            Overlay Name
                                                            <input
                                                                className={numberInputClassName}
                                                                type="text"
                                                                value={part.name}
                                                                onChange={event => onUpdateOverlayName(type, event.target.value)}
                                                            />
                                                        </label>
                                                        <label className="grid gap-1 text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
                                                            保存済みセット
                                                            <select
                                                                className={numberInputClassName}
                                                                value=""
                                                                onChange={event => {
                                                                    const slug = event.target.value;
                                                                    if (!slug) return;
                                                                    onApplySavedOverlay(type, slug);
                                                                    event.target.value = '';
                                                                }}
                                                            >
                                                                <option value="">保存済みセットを選択</option>
                                                                {savedOverlays.filter(entry => entry.partType === type).map(entry => (
                                                                    <option key={`${entry.partType}-${entry.slug}`} value={entry.slug}>
                                                                        {entry.name}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </label>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </>
    );
}