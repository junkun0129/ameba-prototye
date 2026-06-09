import type { TabId } from '@/lib/types';

type Props = {
    activeTab: TabId | null;
    onOpenTab: (tab: TabId) => void;
};

function DockButton({
    emoji,
    label,
    active,
    onClick,
}: {
    emoji: string;
    label: string;
    active: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex min-w-[72px] flex-col items-center justify-center rounded-2xl px-3 py-2 text-[10px] font-black tracking-wider transition ${active ? 'bg-emerald-100 text-emerald-700' : 'bg-white/80 text-gray-600 hover:bg-white hover:text-emerald-700'
                }`}
        >
            <span className="text-xl leading-none">{emoji}</span>
            <span className="mt-1">{label}</span>
        </button>
    );
}

export default function BottomDock({ activeTab, onOpenTab }: Props) {
    return (
        <div className="fixed bottom-0 left-0 right-0 z-[1200] border-t border-blue-100 bg-white/90 px-3 py-2 backdrop-blur-md shadow-[0_-6px_20px_rgba(0,0,0,0.08)]">
            <div className="mx-auto flex w-full max-w-4xl items-center justify-center gap-2 sm:gap-4">
                <DockButton emoji="💬" label="チャット" active={activeTab === 'chat'} onClick={() => onOpenTab('chat')} />
                <DockButton emoji="👗" label="きせかえ" active={activeTab === 'avatar'} onClick={() => onOpenTab('avatar')} />
                <DockButton emoji="🙌" label="アクション" active={activeTab === 'actions'} onClick={() => onOpenTab('actions')} />
                <DockButton emoji="🏠" label="お部屋" active={activeTab === 'room'} onClick={() => onOpenTab('room')} />
                <DockButton emoji="🚪" label="外出" active={activeTab === 'outing'} onClick={() => onOpenTab('outing')} />
                <DockButton emoji="🌾" label="栽培" active={activeTab === 'farming'} onClick={() => onOpenTab('farming')} />
            </div>
        </div>
    );
}
