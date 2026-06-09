import { FACING_LABELS } from '@/tools/avatar-editor/constants';
import { numberInputClassName } from '@/tools/avatar-editor/components/shared';
import type { BodyPartAsset, BoneDefinition, BoneName, FacingMode } from '@/tools/avatar-editor/types';

type Props = {
    activeFacing: FacingMode;
    bones: BoneDefinition[];
    activeBone: BoneName;
    activeBoneData: BoneDefinition;
    activeBodyPart: BodyPartAsset;
    onSetActiveBone: (boneName: BoneName) => void;
    onUpdateBoneValue: (boneName: BoneName, axis: 'x' | 'y', value: number) => void;
    onUpdateBodyPartValue: (partType: BodyPartAsset['type'], field: 'position' | 'pivot', axis: 'x' | 'y', value: number) => void;
};

export default function BonesTab({
    activeFacing,
    bones,
    activeBone,
    activeBoneData,
    activeBodyPart,
    onSetActiveBone,
    onUpdateBoneValue,
    onUpdateBodyPartValue,
}: Props) {
    return (
        <div className="flex flex-col gap-4">
            <div>
                <h2 className="text-lg font-black text-slate-900">ボーンエディタ</h2>
                <p className="mt-1 text-sm font-medium text-slate-500">{FACING_LABELS[activeFacing]}ごとにボーンとパーツ座標を独立して持ちます。</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
                <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-500">Active Bone</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                    {bones.map(bone => (
                        <button
                            key={bone.name}
                            type="button"
                            onClick={() => onSetActiveBone(bone.name)}
                            className={`rounded-xl px-3 py-2 text-left text-xs font-black transition ${activeBone === bone.name ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 hover:bg-slate-100'}`}
                        >
                            {bone.name}
                        </button>
                    ))}
                </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
                <div className="grid gap-3">
                    <label className="grid gap-1 text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                        Bone X
                        <input className={numberInputClassName} type="number" value={activeBoneData.point.x} onChange={event => onUpdateBoneValue(activeBoneData.name, 'x', Number(event.target.value))} />
                    </label>
                    <label className="grid gap-1 text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                        Bone Y
                        <input className={numberInputClassName} type="number" value={activeBoneData.point.y} onChange={event => onUpdateBoneValue(activeBoneData.name, 'y', Number(event.target.value))} />
                    </label>
                    <label className="grid gap-1 text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                        Part Position X
                        <input className={numberInputClassName} type="number" value={activeBodyPart.position.x} onChange={event => onUpdateBodyPartValue(activeBodyPart.type, 'position', 'x', Number(event.target.value))} />
                    </label>
                    <label className="grid gap-1 text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                        Part Position Y
                        <input className={numberInputClassName} type="number" value={activeBodyPart.position.y} onChange={event => onUpdateBodyPartValue(activeBodyPart.type, 'position', 'y', Number(event.target.value))} />
                    </label>
                    <label className="grid gap-1 text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                        Pivot X
                        <input className={numberInputClassName} type="number" value={activeBodyPart.pivot.x} onChange={event => onUpdateBodyPartValue(activeBodyPart.type, 'pivot', 'x', Number(event.target.value))} />
                    </label>
                    <label className="grid gap-1 text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                        Pivot Y
                        <input className={numberInputClassName} type="number" value={activeBodyPart.pivot.y} onChange={event => onUpdateBodyPartValue(activeBodyPart.type, 'pivot', 'y', Number(event.target.value))} />
                    </label>
                </div>
            </div>
        </div>
    );
}