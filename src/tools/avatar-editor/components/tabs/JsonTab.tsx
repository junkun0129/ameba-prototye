import type { JsonPreviewMode } from '@/tools/avatar-editor/types';

type Props = {
    jsonPreviewMode: JsonPreviewMode;
    jsonPreview: string;
    onSetJsonPreviewMode: (mode: JsonPreviewMode) => void;
};

export default function JsonTab({ jsonPreviewMode, jsonPreview, onSetJsonPreviewMode }: Props) {
    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h2 className="text-lg font-black text-slate-900">JSON Preview</h2>
                    <p className="mt-1 text-sm font-medium text-slate-500">front/back 両方の設定を含めて確認できます。</p>
                </div>
                <div className="flex gap-2">
                    {(['rig', 'atlas', 'bundle'] as JsonPreviewMode[]).map(mode => (
                        <button
                            key={mode}
                            type="button"
                            onClick={() => onSetJsonPreviewMode(mode)}
                            className={`rounded-xl px-3 py-2 text-xs font-black uppercase tracking-[0.16em] transition ${jsonPreviewMode === mode ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                        >
                            {mode}
                        </button>
                    ))}
                </div>
            </div>
            <pre className="max-h-[680px] overflow-auto rounded-[24px] bg-slate-950 p-4 text-[11px] leading-5 text-cyan-100">{jsonPreview}</pre>
        </div>
    );
}