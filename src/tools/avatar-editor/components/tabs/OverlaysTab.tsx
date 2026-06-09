import { BODY_PART_LABELS, BODY_PART_ORDER, OVERLAY_PARENT_OPTIONS, OVERLAY_PART_LABELS, OVERLAY_PART_ORDER } from '@/tools/avatar-editor/constants';
import { numberInputClassName } from '@/tools/avatar-editor/components/shared';
import type { BodyPartType, FacingRigLayer, OverlayPartAsset, OverlayPartType, PreviewSelection } from '@/tools/avatar-editor/types';

type Props = {
    activeFacingLabel: string;
    activeLayer: FacingRigLayer;
    activeOverlay: OverlayPartType;
    activeOverlayData: OverlayPartAsset;
    previewSelection: PreviewSelection;
    onSetActiveOverlay: (type: OverlayPartType) => void;
    onUpdateOverlayTarget: (overlayType: OverlayPartType, partType: BodyPartType) => void;
    onUpdateOverlayRelativePosition: (overlayType: OverlayPartType, axis: 'x' | 'y', value: number) => void;
    onUpdateOverlayZIndex: (overlayType: OverlayPartType, value: number) => void;
    onUpdateOverlayVisible: (overlayType: OverlayPartType, visible: boolean) => void;
    onUpdateBodySelection: (partType: BodyPartType, partId: string) => void;
    onUpdateOverlaySelection: (partType: OverlayPartType, partId: string) => void;
};

export default function OverlaysTab({
    activeFacingLabel,
    activeLayer,
    activeOverlay,
    activeOverlayData,
    previewSelection,
    onSetActiveOverlay,
    onUpdateOverlayTarget,
    onUpdateOverlayRelativePosition,
    onUpdateOverlayZIndex,
    onUpdateOverlayVisible,
    onUpdateBodySelection,
    onUpdateOverlaySelection,
}: Props) {
    return (
        <div className="flex flex-col gap-4">
            <div>
                <h2 className="text-lg font-black text-slate-900">重ねパーツ相対配置</h2>
                <p className="mt-1 text-sm font-medium text-slate-500">{activeFacingLabel}用の親パーツ、相対座標、重なり順を調整します。</p>
            </div>

            <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
                <div className="grid gap-2">
                    {OVERLAY_PART_ORDER.map(type => (
                        <button
                            key={type}
                            type="button"
                            onClick={() => onSetActiveOverlay(type)}
                            className={`rounded-2xl px-3 py-3 text-left text-sm font-black transition ${activeOverlay === type ? 'bg-orange-500 text-white shadow-[0_12px_24px_rgba(249,115,22,0.22)]' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                        >
                            {OVERLAY_PART_LABELS[type]}
                        </button>
                    ))}
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
                        <div className="grid gap-3">
                            <label className="grid gap-1 text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                                Parent Part
                                <select className={numberInputClassName} value={activeOverlayData.selectedTarget.partType} onChange={event => onUpdateOverlayTarget(activeOverlayData.type, event.target.value as BodyPartType)}>
                                    {OVERLAY_PARENT_OPTIONS[activeOverlayData.type].map(partType => (
                                        <option key={partType} value={partType}>
                                            {BODY_PART_LABELS[partType]}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label className="grid gap-1 text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                                Relative X
                                <input className={numberInputClassName} type="number" value={activeOverlayData.relativePosition.x} onChange={event => onUpdateOverlayRelativePosition(activeOverlayData.type, 'x', Number(event.target.value))} />
                            </label>
                            <label className="grid gap-1 text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                                Relative Y
                                <input className={numberInputClassName} type="number" value={activeOverlayData.relativePosition.y} onChange={event => onUpdateOverlayRelativePosition(activeOverlayData.type, 'y', Number(event.target.value))} />
                            </label>
                            <label className="grid gap-1 text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                                Overlay Z
                                <input className={numberInputClassName} type="number" value={activeOverlayData.zIndex} onChange={event => onUpdateOverlayZIndex(activeOverlayData.type, Number(event.target.value))} />
                            </label>
                            <label className="flex items-center gap-2 pt-1 text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                                <input type="checkbox" checked={activeOverlayData.visible !== false} onChange={event => onUpdateOverlayVisible(activeOverlayData.type, event.target.checked)} />
                                表示
                            </label>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Selection</p>
                        <div className="mt-3 grid gap-2">
                            {BODY_PART_ORDER.map(type => {
                                const part = activeLayer.bodyParts.find(item => item.type === type);
                                if (!part) return null;
                                return (
                                    <label key={type} className="grid gap-1 text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                                        {BODY_PART_LABELS[type]}
                                        <select className={numberInputClassName} value={previewSelection.bodyPartIds[type] ?? part.id} onChange={event => onUpdateBodySelection(type, event.target.value)}>
                                            {activeLayer.bodyParts.filter(item => item.type === type).map(item => (
                                                <option key={item.id} value={item.id}>
                                                    {item.name}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                );
                            })}
                            {OVERLAY_PART_ORDER.map(type => {
                                const part = activeLayer.overlays.find(item => item.type === type);
                                if (!part) return null;
                                return (
                                    <label key={type} className="grid gap-1 text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                                        {OVERLAY_PART_LABELS[type]}
                                        <select className={numberInputClassName} value={previewSelection.overlayPartIds[type] ?? part.id} onChange={event => onUpdateOverlaySelection(type, event.target.value)}>
                                            {activeLayer.overlays.filter(item => item.type === type).map(item => (
                                                <option key={item.id} value={item.id}>
                                                    {item.name}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}