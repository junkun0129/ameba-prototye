/// <reference types="vite/client" />
import { useCallback, useEffect } from 'react';
import type { RoomInfo } from '@/lib/types';
import { detectNat } from '@/services/natDetection';
import { joinRoom, leaveRoom, listRooms, pollHost, shareMembers } from '@/services/amebaGasApi';
import { useAmebaStore } from '@/state/useAmebaStore';

type Props = {
    onClose: () => void;
};

const GAS_CONFIGURED = Boolean(import.meta.env.VITE_AMEBA_GAS_URL);

export function useNatCheck() {
    const setNatChecking = useAmebaStore(s => s.setNatChecking);
    const setNatStatus = useAmebaStore(s => s.setNatStatus);

    return useCallback(async () => {
        setNatChecking(true);
        const result = await detectNat();
        setNatStatus(result.status, result.errorMessage);
        setNatChecking(false);
        return result;
    }, [setNatChecking, setNatStatus]);
}

function NatCheckingView() {
    return (
        <div className="flex flex-col items-center gap-4 py-8">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-400 border-t-transparent" />
            <p className="text-sm text-gray-600">ネットワークを確認中…</p>
        </div>
    );
}

function NatErrorView({ message, onRetry }: { message: string; onRetry: () => void }) {
    return (
        <div className="flex flex-col items-center gap-4 py-8 text-center">
            <span className="text-4xl">🚫</span>
            <p className="font-bold text-red-600">外出できません</p>
            <p className="text-sm text-gray-500 max-w-xs">{message}</p>
            <button
                type="button"
                onClick={onRetry}
                className="mt-2 rounded-xl bg-emerald-500 px-6 py-2 text-sm font-bold text-white hover:bg-emerald-600"
            >
                再チェック
            </button>
        </div>
    );
}

function RoomCard({ room, onJoin }: { room: RoomInfo; onJoin: () => void }) {
    const full = room.occupants >= room.capacity;
    return (
        <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
            <div>
                <p className="font-bold text-gray-800">{room.name}</p>
                <p className="text-xs text-gray-400">
                    {room.occupants} / {room.capacity} 人
                </p>
            </div>
            <button
                type="button"
                disabled={full}
                onClick={onJoin}
                className={`rounded-xl px-4 py-2 text-sm font-bold transition ${full
                    ? 'cursor-not-allowed bg-gray-200 text-gray-400'
                    : 'bg-emerald-500 text-white hover:bg-emerald-600'
                    }`}
            >
                {full ? '満室' : '入室'}
            </button>
        </div>
    );
}

function RoomListView({
    rooms,
    loading,
    onJoin,
    onRefresh,
}: {
    rooms: RoomInfo[];
    loading: boolean;
    onJoin: (roomId: string) => void;
    onRefresh: () => void;
}) {
    return (
        <div className="flex flex-col gap-3 py-4">
            <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-gray-700">部屋一覧</p>
                <button
                    type="button"
                    onClick={onRefresh}
                    disabled={loading}
                    className="text-xs text-emerald-600 hover:underline disabled:opacity-50"
                >
                    更新
                </button>
            </div>
            {loading ? (
                <div className="flex justify-center py-6">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
                </div>
            ) : rooms.length === 0 ? (
                <p className="py-6 text-center text-sm text-gray-400">現在の部屋はありません</p>
            ) : (
                rooms.map(room => (
                    <RoomCard key={room.id} room={room} onJoin={() => onJoin(room.id)} />
                ))
            )}
            {!GAS_CONFIGURED && (
                <p className="mt-2 rounded-xl bg-yellow-50 p-3 text-xs text-yellow-700">
                    ⚠️ VITE_AMEBA_GAS_URL が未設定のため、実際の部屋情報を取得できません。
                </p>
            )}
        </div>
    );
}

export default function OutingModal({ onClose }: Props) {
    const natStatus = useAmebaStore(s => s.natStatus);
    const isNatChecking = useAmebaStore(s => s.isNatChecking);
    const natErrorMessage = useAmebaStore(s => s.natErrorMessage);
    const rooms = useAmebaStore(s => s.rooms);
    const setRooms = useAmebaStore(s => s.setRooms);
    const joinRoomStore = useAmebaStore(s => s.joinRoom);
    const leaveRoomStore = useAmebaStore(s => s.leaveRoom);
    const currentRoomId = useAmebaStore(s => s.currentRoomId);
    const isRoomHost = useAmebaStore(s => s.isRoomHost);
    const pollingEnabled = useAmebaStore(s => s.pollingEnabled);

    const runNatCheck = useNatCheck();
    const [listLoading, setListLoading] = [false, (_: boolean) => { }]; // placeholder, managed via rooms

    // Poll as host
    useEffect(() => {
        if (!pollingEnabled || !currentRoomId || !GAS_CONFIGURED) return;
        const id = setInterval(async () => {
            try {
                const result = await pollHost(currentRoomId);
                await shareMembers(currentRoomId, result.members);
            } catch {
                // ignore polling errors silently
            }
        }, 5000);
        return () => clearInterval(id);
    }, [pollingEnabled, currentRoomId]);

    const loadRooms = useCallback(async () => {
        if (!GAS_CONFIGURED) {
            // show mock rooms for testing
            setRooms([
                { id: 'room-1', name: 'にぎやか広場', occupants: 3, capacity: 5 },
                { id: 'room-2', name: 'のんびり公園', occupants: 5, capacity: 5 },
                { id: 'room-3', name: 'まったりカフェ', occupants: 1, capacity: 5 },
            ]);
            return;
        }
        try {
            const res = await listRooms();
            setRooms(res.rooms);
        } catch {
            // keep existing
        }
    }, [setRooms]);

    // Load rooms after NAT passes
    useEffect(() => {
        if (natStatus === 'open') loadRooms();
    }, [natStatus, loadRooms]);

    const handleJoin = async (roomId: string) => {
        if (!GAS_CONFIGURED) {
            // Mock join
            joinRoomStore(roomId, rooms.findIndex(r => r.id === roomId) === -1);
            onClose();
            return;
        }
        try {
            const res = await joinRoom(roomId);
            joinRoomStore(roomId, res.isHost);
            onClose();
        } catch {
            // show error inline — keep modal open
        }
    };

    const handleLeave = async () => {
        if (currentRoomId && GAS_CONFIGURED) {
            await leaveRoom(currentRoomId).catch(() => { });
        }
        leaveRoomStore();
    };

    // Trigger NAT check on first open
    useEffect(() => {
        if (natStatus === 'unknown') runNatCheck();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Currently in a room
    if (currentRoomId) {
        return (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
                <span className="text-4xl">🚪</span>
                <p className="font-bold text-gray-800">部屋に入室中</p>
                <p className="text-sm text-gray-500">ID: {currentRoomId}</p>
                {isRoomHost && (
                    <p className="rounded-xl bg-emerald-50 px-3 py-1 text-xs text-emerald-700">
                        ホスト（5秒ポーリング中）
                    </p>
                )}
                <button
                    type="button"
                    onClick={() => { void handleLeave(); onClose(); }}
                    className="mt-4 rounded-xl bg-red-500 px-6 py-2 text-sm font-bold text-white hover:bg-red-600"
                >
                    退室する
                </button>
            </div>
        );
    }

    if (isNatChecking || natStatus === 'detecting') return <NatCheckingView />;

    if (natStatus === 'symmetric_nat' || natStatus === 'udp_blocked') {
        return (
            <NatErrorView
                message={natErrorMessage ?? 'ネットワークが非対応のため外出できません。'}
                onRetry={() => runNatCheck()}
            />
        );
    }

    return (
        <RoomListView
            rooms={rooms}
            loading={false}
            onJoin={handleJoin}
            onRefresh={loadRooms}
        />
    );
}
