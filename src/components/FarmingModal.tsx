import { CROP_DEFS, DAILY_HELPER_WATER_LIMIT, DAILY_KITAYO_LIMIT, QUEST_HARVEST_TARGET, QUEST_HELPER_TARGET } from '@/constants/farming';
import type { CropType } from '@/lib/types';
import { useAmebaStore } from '@/state/useAmebaStore';

function SeedButton({ crop, selected, onClick }: { crop: CropType; selected: boolean; onClick: () => void }) {
    const def = CROP_DEFS[crop];
    return (
        <button
            type="button"
            onClick={onClick}
            className={`rounded-2xl border-2 px-3 py-2 text-left transition ${selected ? 'border-emerald-500 bg-emerald-50' : 'border-gray-100 hover:border-emerald-200'}`}
        >
            <p className="text-sm font-black text-gray-700">{def.name}</p>
            <p className="text-lg">{def.stages.join(' → ')}</p>
        </button>
    );
}

export default function FarmingModal() {
    const farming = useAmebaStore(state => state.farming);
    const setSelectedSeed = useAmebaStore(state => state.setSelectedSeed);
    const claimDailyLogin = useAmebaStore(state => state.claimDailyLogin);
    const sendKitaYo = useAmebaStore(state => state.sendKitaYo);
    const setVisitingMode = useAmebaStore(state => state.setVisitingMode);
    const claimHarvestQuest = useAmebaStore(state => state.claimHarvestQuest);
    const claimHelperQuest = useAmebaStore(state => state.claimHelperQuest);
    const sellCrop = useAmebaStore(state => state.sellCrop);
    const clearFarmNotice = useAmebaStore(state => state.clearFarmNotice);

    return (
        <div className="space-y-4 py-2">
            <section className="rounded-2xl border border-gray-100 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-black text-gray-700">栽培ステータス</p>
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">ポイント: {farming.points}pt</span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-600">
                    <p>スタミナ: {farming.stamina} / 50</p>
                    <p>訪問モード: {farming.isVisitingMode ? 'ON' : 'OFF'}</p>
                    <p>他人畑水やり: {farming.daily.helperWaterCount} / {DAILY_HELPER_WATER_LIMIT}</p>
                    <p>きたよ: {farming.daily.kitaYoCount} / {DAILY_KITAYO_LIMIT}</p>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={claimDailyLogin}
                        className="rounded-xl bg-sky-500 px-3 py-2 text-xs font-black text-white hover:bg-sky-600"
                    >
                        デイリーログイン +50pt
                    </button>
                    <button
                        type="button"
                        onClick={sendKitaYo}
                        className="rounded-xl bg-pink-500 px-3 py-2 text-xs font-black text-white hover:bg-pink-600"
                    >
                        きたよ +1pt
                    </button>
                    <button
                        type="button"
                        onClick={() => setVisitingMode(!farming.isVisitingMode)}
                        className={`rounded-xl px-3 py-2 text-xs font-black text-white ${farming.isVisitingMode ? 'bg-amber-500 hover:bg-amber-600' : 'bg-gray-600 hover:bg-gray-700'}`}
                    >
                        {farming.isVisitingMode ? '訪問モードOFF' : '訪問モードON'}
                    </button>
                </div>
            </section>

            <section className="rounded-2xl border border-gray-100 bg-white p-4">
                <p className="mb-2 text-sm font-black text-gray-700">種セレクト（全作物15分で成長）</p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {(Object.keys(CROP_DEFS) as CropType[]).map(crop => (
                        <SeedButton
                            key={crop}
                            crop={crop}
                            selected={farming.selectedSeed === crop}
                            onClick={() => setSelectedSeed(crop)}
                        />
                    ))}
                </div>
            </section>

            <section className="rounded-2xl border border-gray-100 bg-white p-4">
                <p className="mb-2 text-sm font-black text-gray-700">クエスト（モック）</p>
                <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between rounded-xl bg-gray-50 p-3">
                        <p>収穫を {QUEST_HARVEST_TARGET} 個達成</p>
                        <button
                            type="button"
                            onClick={claimHarvestQuest}
                            className="rounded-lg bg-emerald-500 px-3 py-1 font-black text-white hover:bg-emerald-600"
                        >
                            受取
                        </button>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-gray-50 p-3">
                        <p>お手伝い水やりを {QUEST_HELPER_TARGET} 回達成</p>
                        <button
                            type="button"
                            onClick={claimHelperQuest}
                            className="rounded-lg bg-emerald-500 px-3 py-1 font-black text-white hover:bg-emerald-600"
                        >
                            受取
                        </button>
                    </div>
                </div>
            </section>

            <section className="rounded-2xl border border-gray-100 bg-white p-4">
                <p className="mb-2 text-sm font-black text-gray-700">収穫物インベントリ / 売却</p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {(Object.keys(CROP_DEFS) as CropType[]).map(crop => (
                        <div key={crop} className="flex items-center justify-between rounded-xl border border-gray-100 px-3 py-2 text-sm">
                            <p>{CROP_DEFS[crop].harvestEmoji} {CROP_DEFS[crop].name} x {farming.inventory.crops[crop]}</p>
                            <button
                                type="button"
                                onClick={() => sellCrop(crop, 1)}
                                className="rounded-lg bg-indigo-500 px-2 py-1 text-xs font-black text-white hover:bg-indigo-600"
                            >
                                1個売る
                            </button>
                        </div>
                    ))}
                </div>
                <p className="mt-2 text-xs text-gray-500">レア素材: {farming.inventory.rareMaterial}</p>
            </section>

            {farming.farmNotice && (
                <button
                    type="button"
                    onClick={clearFarmNotice}
                    className="w-full rounded-xl bg-emerald-100 px-3 py-2 text-left text-xs font-bold text-emerald-800"
                >
                    {farming.farmNotice}
                </button>
            )}
        </div>
    );
}