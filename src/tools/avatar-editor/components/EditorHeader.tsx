import type { ChangeEvent } from 'react';
import type { SavedBodyBundleCatalogEntry } from '@/tools/avatar-editor/types';

type Props = {
    assetDirectoryName: string | null;
    bodyBundleName: string;
    selectedBodyBundleSlug: string;
    savedBodyBundles: SavedBodyBundleCatalogEntry[];
    defaultBodyBundleSlug: string | null;
    onBodyBundleNameChange: (value: string) => void;
    onSelectedBodyBundleSlugChange: (value: string) => void;
    onImportBundle: (event: ChangeEvent<HTMLInputElement>) => void;
    onSaveRig: () => void;
    onSaveAtlas: () => void;
    onSaveBundle: () => void;
    onSaveCurrentBodyBundle: (setAsDefault: boolean) => void;
    onApplySavedBodyBundle: () => void;
    onSetDefaultBodyBundle: () => void;
    onPickAssetDirectory: () => void;
    onClearAssetDirectory: () => void;
};

export default function EditorHeader({
    assetDirectoryName,
    bodyBundleName,
    selectedBodyBundleSlug,
    savedBodyBundles,
    defaultBodyBundleSlug,
    onBodyBundleNameChange,
    onSelectedBodyBundleSlugChange,
    onImportBundle,
    onSaveRig,
    onSaveAtlas,
    onSaveBundle,
    onSaveCurrentBodyBundle,
    onApplySavedBodyBundle,
    onSetDefaultBodyBundle,
    onPickAssetDirectory,
    onClearAssetDirectory,
}: Props) {
    return (
        <header className="rounded-[32px] border border-white/60 bg-white/80 px-6 py-5 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-700">Pigg Avatar Skeleton Editor</p>
                    <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">画像を組み合わせてボーンと重ね順を管理する編集画面</h1>
                    <p className="mt-2 max-w-4xl text-sm font-medium leading-6 text-slate-600">
                        body 6パーツと overlay 9パーツを読み込み、ボーン位置、親相対座標、歩行プレビュー、PixiJS互換JSONを同じ画面で管理します。
                    </p>
                </div>
                <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={onSaveRig} className="rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-black text-white shadow-[0_8px_20px_rgba(15,23,42,0.2)] transition hover:bg-slate-800">
                            Rig 保存
                        </button>
                        <button type="button" onClick={onSaveAtlas} className="rounded-2xl bg-cyan-600 px-4 py-2.5 text-sm font-black text-white shadow-[0_8px_20px_rgba(8,145,178,0.2)] transition hover:bg-cyan-500">
                            Atlas 保存
                        </button>
                        <button type="button" onClick={onSaveBundle} className="rounded-2xl bg-orange-500 px-4 py-2.5 text-sm font-black text-white shadow-[0_8px_20px_rgba(234,88,12,0.24)] transition hover:bg-orange-400">
                            Bundle 保存
                        </button>
                        <label className="cursor-pointer rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-black text-slate-700 transition hover:border-slate-400 hover:bg-slate-50">
                            Bundle 読み込み
                            <input type="file" accept="application/json" className="hidden" onChange={onImportBundle} />
                        </label>
                        <div className="ml-auto flex items-center gap-2">
                            <button
                                type="button"
                                onClick={onPickAssetDirectory}
                                className="rounded-2xl border border-emerald-300 bg-emerald-50 px-3 py-2.5 text-sm font-black text-emerald-700 transition hover:bg-emerald-100"
                            >
                                画像保存先
                            </button>
                            <button
                                type="button"
                                onClick={onClearAssetDirectory}
                                className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-50"
                            >
                                解除
                            </button>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50/60 px-3 py-2">
                        <span className="text-xs font-black uppercase tracking-wider text-emerald-700">体Bundle</span>
                        <input
                            className="min-w-[140px] flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                            type="text"
                            placeholder="Bundle名"
                            value={bodyBundleName}
                            onChange={event => onBodyBundleNameChange(event.target.value)}
                        />
                        <button
                            type="button"
                            onClick={() => onSaveCurrentBodyBundle(false)}
                            className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-black text-white shadow-[0_4px_12px_rgba(5,150,105,0.22)] transition hover:bg-emerald-500"
                        >
                            保存
                        </button>
                        <button
                            type="button"
                            onClick={() => onSaveCurrentBodyBundle(true)}
                            className="rounded-xl bg-amber-100 px-3 py-2 text-sm font-black text-amber-800 transition hover:bg-amber-200"
                        >
                            保存＋Default
                        </button>
                        <select
                            className="min-w-[180px] flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                            value={selectedBodyBundleSlug}
                            onChange={event => onSelectedBodyBundleSlugChange(event.target.value)}
                        >
                            <option value="">保存済みを選択</option>
                            {savedBodyBundles.map(entry => (
                                <option key={entry.slug} value={entry.slug}>
                                    {entry.name}{defaultBodyBundleSlug === entry.slug ? ' ★' : ''}
                                </option>
                            ))}
                        </select>
                        <button
                            type="button"
                            onClick={onApplySavedBodyBundle}
                            disabled={!selectedBodyBundleSlug}
                            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
                        >
                            適用
                        </button>
                        <button
                            type="button"
                            onClick={onSetDefaultBodyBundle}
                            disabled={!selectedBodyBundleSlug}
                            className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-black text-amber-800 transition hover:bg-amber-100 disabled:opacity-40"
                        >
                            Default化
                        </button>
                    </div>
                </div>
            </div>
            <p className="mt-3 text-xs font-semibold text-slate-600">
                画像保存先: {assetDirectoryName ? assetDirectoryName : '未設定（設定するとアップロード時にローカルフォルダへ保存）'}
            </p>
        </header>
    );
}
