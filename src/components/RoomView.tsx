import { memo, useEffect, useMemo, useRef, useState } from 'react';
import AvatarCanvas from '@/components/AvatarCanvas';
import PixiAvatar from '@/components/PixiAvatar';
import { GRID_SIZE, TILE_H, TILE_W, clampGrid, gridToScreen, screenToGrid } from '@/lib/isometric';
import type { FurnitureId, Stamp } from '@/lib/types';
import { useAmebaStore } from '@/state/useAmebaStore';

const furnitureEmoji: Record<FurnitureId, string> = {
    sofa: '🛋️',
    plant: '🪴',
    pet: '🐕',
};

const Furniture = memo(function Furniture({
    id,
    left,
    top,
    zIndex,
    onClick,
    petBounce,
}: {
    id: FurnitureId;
    left: number;
    top: number;
    zIndex: number;
    onClick: (id: FurnitureId) => void;
    petBounce: number;
}) {
    return (
        <button
            type="button"
            onClick={() => onClick(id)}
            className="absolute -translate-x-1/2 -translate-y-full text-5xl transition hover:scale-105"
            style={{ left, top, zIndex }}
        >
            <span style={id === 'pet' ? { display: 'inline-block', transform: `translateY(-${petBounce}px)` } : undefined}>
                {furnitureEmoji[id]}
            </span>
        </button>
    );
});

function StampParticle({ stamp, originX, onDone }: { stamp: Stamp; originX: number; onDone: (id: string) => void }) {
    const pos = gridToScreen(stamp.gx, stamp.gy, originX);

    useEffect(() => {
        const timer = window.setTimeout(() => onDone(stamp.id), 1200);
        return () => window.clearTimeout(timer);
    }, [onDone, stamp.id]);

    return (
        <div
            className="pointer-events-none absolute text-3xl animate-[particleFloat_1.2s_ease-out_forwards]"
            style={{ left: pos.x - 12, top: pos.y - 120, zIndex: 1000 }}
        >
            {stamp.emoji}
        </div>
    );
}

export default function RoomView() {
    const roomRef = useRef<HTMLDivElement | null>(null);
    const [originX, setOriginX] = useState(0);
    const avatar = useAmebaStore(state => state.avatar);
    const pet = useAmebaStore(state => state.pet);
    const roomTheme = useAmebaStore(state => state.roomTheme);
    const stamps = useAmebaStore(state => state.stamps);
    const furniture = useAmebaStore(state => state.furniture);
    const chatMessage = useAmebaStore(state => state.chatMessage);
    const chatVisible = useAmebaStore(state => state.chatVisible);
    const avatarBundle = useAmebaStore(state => state.avatarBundle);
    const savedOverlayCatalog = useAmebaStore(state => state.savedOverlayCatalog);
    const selectedOverlaySlugs = useAmebaStore(state => state.selectedOverlaySlugs);
    const walkTo = useAmebaStore(state => state.walkTo);
    const interactFurniture = useAmebaStore(state => state.interactFurniture);
    const removeStamp = useAmebaStore(state => state.removeStamp);

    useEffect(() => {
        const update = () => {
            if (!roomRef.current) return;
            setOriginX(roomRef.current.clientWidth / 2);
        };
        update();
        window.addEventListener('resize', update);
        return () => window.removeEventListener('resize', update);
    }, []);

    const tiles = useMemo(() => {
        return Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, index) => {
            const gx = Math.floor(index / GRID_SIZE);
            const gy = index % GRID_SIZE;
            const pos = gridToScreen(gx, gy, originX);
            return { gx, gy, pos };
        });
    }, [originX]);

    const avatarPos = gridToScreen(avatar.x, avatar.y, originX);
    const clickIndicator = gridToScreen(avatar.targetX, avatar.targetY, originX);

    const handleRoomClick = (event: React.MouseEvent<HTMLDivElement>) => {
        const roomBox = roomRef.current;
        if (!roomBox) return;
        const rect = roomBox.getBoundingClientRect();
        const grid = screenToGrid(event.clientX - rect.left, event.clientY - rect.top, originX);
        walkTo(clampGrid(Math.round(grid.x)), clampGrid(Math.round(grid.y)));
    };

    return (
        <section className="fixed inset-0 overflow-hidden bg-[radial-gradient(circle_at_top,_#f7fafd_0%,_#d7efff_75%)] pb-20" onClick={handleRoomClick}>
            <div ref={roomRef} className="relative h-full w-full" onClick={handleRoomClick}>
                <div
                    className="absolute left-0 top-[-4px] h-[350px] border-2 border-slate-200"
                    style={{
                        width: originX,
                        transform: 'skewY(26.5deg)',
                        background: `linear-gradient(135deg, ${roomTheme.wallLeft}, ${roomTheme.wallRight})`,
                        borderRight: `6px solid ${roomTheme.wallTrim}`,
                        clipPath: 'polygon(0% 0%, 100% 30%, 100% 100%, 0% 100%)',
                    }}
                />
                <div
                    className="absolute right-0 top-[-4px] h-[350px] border-2 border-slate-200"
                    style={{
                        width: originX,
                        transform: 'skewY(-26.5deg)',
                        background: `linear-gradient(225deg, ${roomTheme.wallLeft}, ${roomTheme.wallRight})`,
                        borderLeft: `6px solid ${roomTheme.wallTrim}`,
                    }}
                />

                <div className="absolute inset-0">
                    {tiles.map(tile => (
                        <button
                            key={`${tile.gx}-${tile.gy}`}
                            type="button"
                            onClick={event => {
                                event.stopPropagation();
                                walkTo(tile.gx, tile.gy);
                            }}
                            className="absolute h-8 w-16 -translate-x-8 -translate-y-4 transition"
                            style={{ left: tile.pos.x, top: tile.pos.y }}
                        >
                            <span
                                className="block h-full w-full border border-black/10 shadow-[inset_0_0_4px_rgba(0,0,0,0.02)]"
                                style={{
                                    clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
                                    backgroundColor:
                                        roomTheme.floorStyle === 'wood'
                                            ? (tile.gx + tile.gy) % 2 === 0
                                                ? '#fca5a5'
                                                : '#f87171'
                                            : (tile.gx + tile.gy) % 2 === 0
                                                ? '#eaeef4'
                                                : '#e2e8f0',
                                    filter: roomTheme.floorStyle === 'wood' ? 'sepia(0.3) brightness(0.72) contrast(1.08)' : 'none',
                                }}
                            />
                        </button>
                    ))}
                </div>

                <div
                    className="pointer-events-none absolute h-6 w-12 -translate-x-6 -translate-y-3 rounded-full border-3 border-emerald-500"
                    style={{
                        left: clickIndicator.x,
                        top: clickIndicator.y,
                        opacity: avatar.state === 'walking' ? 1 : 0,
                        animation: avatar.state === 'walking' ? 'ringExpand 0.6s ease-out forwards' : 'none',
                        zIndex: 50,
                    }}
                />

                {furniture.map(item => {
                    const pos = gridToScreen(item.gx, item.gy, originX);
                    return (
                        <Furniture
                            key={item.id}
                            id={item.id}
                            left={pos.x}
                            top={pos.y}
                            zIndex={Math.floor((item.gx + item.gy + (item.width + item.height) / 2) * 100)}
                            onClick={interactFurniture}
                            petBounce={item.id === 'pet' ? Math.sin((pet.bounceTimer / 30) * Math.PI) * 16 : 0}
                        />
                    );
                })}

                <div
                    className="pointer-events-none absolute h-[180px] w-[140px] -translate-x-[70px] -translate-y-[160px]"
                    style={{ left: avatarPos.x, top: avatarPos.y, zIndex: Math.floor((avatar.x + avatar.y) * 100) }}
                >
                    <div
                        className={`absolute bottom-[155px] left-1/2 z-[999] max-w-[180px] -translate-x-1/2 rounded-2xl border-[3px] border-[#2d2621] bg-white px-4 py-2 text-center text-[13px] leading-[1.4] shadow-[0_4px_6px_rgba(0,0,0,0.1)] transition ${chatVisible ? 'scale-100' : 'scale-0'}`}
                    >
                        {chatMessage}
                    </div>
                    <div className="absolute bottom-[2px] left-1/2 h-[14px] w-[50px] -translate-x-1/2 rounded-full bg-black/15 blur-[1.5px]" />
                    {avatarBundle ? (
                        <PixiAvatar
                            rig={avatarBundle.rig}
                            dir={avatar.dir}
                            walkCycle={avatar.walkCycle}
                            walking={avatar.state === 'walking'}
                            savedOverlayCatalog={savedOverlayCatalog}
                            selectedOverlaySlugs={selectedOverlaySlugs}
                        />
                    ) : (
                        <AvatarCanvas avatar={avatar} />
                    )}
                </div>

                {stamps.map(stamp => (
                    <StampParticle key={stamp.id} stamp={stamp} originX={originX} onDone={removeStamp} />
                ))}
            </div>
        </section>
    );
}
