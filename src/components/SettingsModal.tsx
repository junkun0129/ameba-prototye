import type { ReactNode } from 'react';

type Props = {
    open: boolean;
    title: string;
    onClose: () => void;
    children: ReactNode;
};

export default function SettingsModal({ open, title, onClose, children }: Props) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[1300] flex items-end justify-center bg-slate-950/40 p-3 sm:items-center sm:p-6" onClick={onClose}>
            <div
                className="max-h-[85vh] w-full max-w-3xl overflow-hidden rounded-2xl border border-white/60 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.2)]"
                onClick={event => event.stopPropagation()}
            >
                <header className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                    <h2 className="text-base font-black tracking-wide text-gray-800">{title}</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg border border-gray-200 px-3 py-1 text-xs font-bold text-gray-500 transition hover:border-gray-300 hover:text-gray-700"
                    >
                        閉じる
                    </button>
                </header>
                <div className="max-h-[calc(85vh-64px)] overflow-y-auto p-4 sm:p-5">{children}</div>
            </div>
        </div>
    );
}
