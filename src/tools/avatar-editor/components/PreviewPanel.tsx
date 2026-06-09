import type { Dispatch, RefObject, SetStateAction } from 'react';
import { BODY_PART_LABELS, FACING_LABELS, OVERLAY_PART_LABELS } from '@/tools/avatar-editor/constants';
import type { BodyPartType, FacingMode, OverlayPartType } from '@/tools/avatar-editor/types';
import { cardClassName } from '@/tools/avatar-editor/components/shared';
import type { EditMode, ImageTarget } from '@/tools/avatar-editor/components/shared';

type Props = {
    canvasRef: RefObject<HTMLCanvasElement | null>;
    pixiHostRef: RefObject<HTMLDivElement | null>;
    rigActiveFacing: FacingMode;
    editMode: EditMode;
    isAnimationPlaying: boolean;
    activeImageTarget: ImageTarget | null;
    bodyPartOrder: BodyPartType[];
    overlayPartOrder: OverlayPartType[];
    onSetEditMode: (mode: EditMode) => void;
    onToggleAnimation: () => void;
    onSetActiveFacing: (facing: FacingMode) => void;
    onSetActiveImageTarget: Dispatch<SetStateAction<ImageTarget | null>>;
    onCanvasPointerMove: (event: React.PointerEvent<HTMLCanvasElement>) => void;
    onCanvasPointerDown: (event: React.PointerEvent<HTMLCanvasElement>) => void;
    onCanvasPointerUp: (event: React.PointerEvent<HTMLCanvasElement>) => void;
    onCanvasPointerLeave: () => void;
};

export default function PreviewPanel({
    canvasRef,
    pixiHostRef,
    rigActiveFacing,
    editMode,
    isAnimationPlaying,
    activeImageTarget,
    bodyPartOrder,
    overlayPartOrder,
    onSetEditMode,
    onToggleAnimation,
    onSetActiveFacing,
    onSetActiveImageTarget,
    onCanvasPointerMove,
    onCanvasPointerDown,
    onCanvasPointerUp,
    onCanvasPointerLeave,
}: Props) {
    return (
        <section className="flex flex-col gap-5">
            <div className={cardClassName}>
                <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-lg font-black text-slate-900">Preview / Animation</h2>
                        <p className="mt-1 text-sm font-medium text-slate-500">アニメーションを見たまま、右側のタブで設定を切り替えます。</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <div className="flex rounded-2xl border border-slate-200 bg-white p-1">
                            <button
                                type="button"
                                onClick={() => onSetEditMode('bone')}
                                className={`rounded-xl px-3 py-1.5 text-xs font-black transition ${editMode === 'bone' ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'}`}
                            >
                                関節移動
                            </button>
                            <button
                                type="button"
                                onClick={() => onSetEditMode('image')}
                                className={`rounded-xl px-3 py-1.5 text-xs font-black transition ${editMode === 'image' ? 'bg-cyan-600 text-white' : 'text-slate-700 hover:bg-slate-100'}`}
                            >
                                画像移動
                            </button>
                        </div>
                        <button
                            type="button"
                            onClick={onToggleAnimation}
                            className={`rounded-2xl px-4 py-2 text-sm font-black transition ${isAnimationPlaying ? 'bg-amber-100 text-amber-800 hover:bg-amber-200' : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'}`}
                        >
                            {isAnimationPlaying ? 'アニメーション停止' : 'アニメーション再生'}
                        </button>
                        {(['front'] as FacingMode[]).map(facing => (
                            <button
                                key={facing}
                                type="button"
                                onClick={() => onSetActiveFacing(facing)}
                                className={`rounded-2xl px-4 py-2 text-sm font-black transition ${rigActiveFacing === facing ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                            >
                                {FACING_LABELS[facing]}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
                    <div className="space-y-5">
                        <div>
                            <div className="mb-3 flex items-center justify-between gap-3">
                                <div>
                                    <h3 className="text-base font-black text-slate-900">Rig Canvas</h3>
                                    <p className="text-xs font-semibold text-slate-500">{FACING_LABELS[rigActiveFacing]}のボーンと重なりを確認します。現在: {editMode === 'bone' ? '関節移動' : '画像移動'} / {isAnimationPlaying ? '再生中' : '基準ポーズ停止'}</p>
                                </div>
                                <div className="rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-2 text-xs font-black text-cyan-800">
                                    200x200 基準 / 中心線・グリッド表示
                                </div>
                            </div>
                            <div className="rounded-[28px] border border-slate-200 bg-[#fffaf4] p-4 shadow-inner">
                                <canvas
                                    ref={canvasRef}
                                    width={200}
                                    height={200}
                                    className="aspect-square w-full touch-none rounded-[20px] border border-slate-200 bg-white"
                                    onPointerMove={onCanvasPointerMove}
                                    onPointerDown={onCanvasPointerDown}
                                    onPointerUp={onCanvasPointerUp}
                                    onPointerLeave={onCanvasPointerLeave}
                                />
                            </div>
                        </div>

                        <div>
                            <h3 className="text-base font-black text-slate-900">PixiJS Preview</h3>
                            <p className="mt-1 text-sm font-medium text-slate-500">{FACING_LABELS[rigActiveFacing]}のPixiJS実描画。常に基準ポーズ（walkTime=0）で表示します。</p>
                            <div ref={pixiHostRef} className="mt-4 overflow-hidden rounded-[28px] border border-slate-200 bg-[linear-gradient(180deg,_#e0fbff_0%,_#fff4de_100%)]" />
                        </div>
                    </div>

                    <div className="space-y-5">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Image Target</p>
                                    <p className="mt-1 text-xs font-semibold text-slate-600">画像移動モードで動かす対象をここで選択します。</p>
                                </div>
                                <div className="rounded-xl bg-white px-3 py-2 text-xs font-black text-slate-700">
                                    {activeImageTarget ? `${activeImageTarget.kind === 'body' ? BODY_PART_LABELS[activeImageTarget.partType] : OVERLAY_PART_LABELS[activeImageTarget.partType]} を選択中` : '未選択'}
                                </div>
                            </div>
                            <div className="mt-3 grid gap-3">
                                <div>
                                    <p className="mb-2 text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">Body</p>
                                    <div className="grid gap-2 sm:grid-cols-2">
                                        {bodyPartOrder.map(type => (
                                            <button
                                                key={`image-target-body-${type}`}
                                                type="button"
                                                onClick={() => {
                                                    onSetEditMode('image');
                                                    onSetActiveImageTarget({ kind: 'body', partType: type });
                                                }}
                                                className={`rounded-xl px-3 py-2 text-left text-xs font-black transition ${activeImageTarget?.kind === 'body' && activeImageTarget.partType === type ? 'bg-cyan-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-100'}`}
                                            >
                                                {BODY_PART_LABELS[type]}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <p className="mb-2 text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">Overlay</p>
                                    <div className="grid gap-2 sm:grid-cols-2">
                                        {overlayPartOrder.map(type => (
                                            <button
                                                key={`image-target-overlay-${type}`}
                                                type="button"
                                                onClick={() => {
                                                    onSetEditMode('image');
                                                    onSetActiveImageTarget({ kind: 'overlay', partType: type });
                                                }}
                                                className={`rounded-xl px-3 py-2 text-left text-xs font-black transition ${activeImageTarget?.kind === 'overlay' && activeImageTarget.partType === type ? 'bg-orange-500 text-white' : 'bg-white text-slate-700 hover:bg-slate-100'}`}
                                            >
                                                {OVERLAY_PART_LABELS[type]}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
