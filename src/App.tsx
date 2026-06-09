import { useEffect, useMemo, useState } from 'react';
import BottomDock from '@/components/BottomDock';
import CustomizerPanel from '@/components/CustomizerPanel';
import FarmingModal from '@/components/FarmingModal';
import FarmingRoomView from '@/components/FarmingRoomView';
import OutingModal from '@/components/OutingModal';
import RoomView from '@/components/RoomView';
import SettingsModal from '@/components/SettingsModal';
import type { TabId } from '@/lib/types';
import { useAmebaStore } from '@/state/useAmebaStore';

export default function App() {
    const tick = useAmebaStore(state => state.tick);
    const activeTab = useAmebaStore(state => state.activeTab);
    const setActiveTab = useAmebaStore(state => state.setActiveTab);
    const farming = useAmebaStore(state => state.farming);
    const enterFarmingRoom = useAmebaStore(state => state.enterFarmingRoom);
    const avatarBundle = useAmebaStore(state => state.avatarBundle);
    const loadDefaultAvatarBundle = useAmebaStore(state => state.loadDefaultAvatarBundle);
    const [modalTab, setModalTab] = useState<TabId | null>(null);

    const modalTitle = useMemo(() => {
        const titleMap: Record<string, string> = {
            chat: 'チャット',
            avatar: 'きせかえ',
            actions: 'アクション',
            room: 'お部屋設定',
            outing: '外出',
            farming: '栽培',
        };
        return modalTab ? (titleMap[modalTab] ?? '') : '';
    }, [modalTab]);

    useEffect(() => {
        // アプリ起動時にデフォルト bundle を自動読み込み
        if (!avatarBundle) void loadDefaultAvatarBundle();
    }, [avatarBundle, loadDefaultAvatarBundle]);

    useEffect(() => {
        let frameId = 0;
        const loop = () => {
            tick();
            frameId = window.requestAnimationFrame(loop);
        };
        frameId = window.requestAnimationFrame(loop);
        return () => window.cancelAnimationFrame(frameId);
    }, [tick]);

    return (
        <main className="min-h-screen select-none">
            {farming.inFarmingRoom ? <FarmingRoomView /> : <RoomView />}

            <a
                href="/avatar-editor.html"
                className="fixed right-4 top-4 z-[1400] rounded-2xl border border-cyan-200 bg-white/95 px-4 py-2 text-sm font-black text-cyan-700 shadow-[0_8px_24px_rgba(14,116,144,0.18)] transition hover:bg-cyan-50 sm:right-6 sm:top-6"
            >
                管理画面へ
            </a>

            <BottomDock
                activeTab={modalTab}
                onOpenTab={tab => {
                    setActiveTab(tab);
                    if (tab === 'farming') {
                        enterFarmingRoom();
                    }
                    setModalTab(tab);
                }}
            />

            <SettingsModal open={modalTab !== null} title={modalTitle} onClose={() => setModalTab(null)}>
                {modalTab === 'outing' ? (
                    <OutingModal onClose={() => setModalTab(null)} />
                ) : modalTab === 'farming' ? (
                    <FarmingModal />
                ) : (
                    <CustomizerPanel />
                )}
            </SettingsModal>
        </main>
    );
}
