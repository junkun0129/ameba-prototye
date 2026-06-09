import { memo, useEffect, useMemo, useRef, useState } from 'react';
import AvatarCanvas from '@/components/AvatarCanvas';
import PixiAvatar from '@/components/PixiAvatar';
import { CROP_DEFS, cropGrowthStage } from '@/constants/farming';
import { GRID_SIZE, TILE_H, TILE_W, clampGrid, gridToScreen, screenToGrid } from '@/lib/isometric';
import type { Stamp } from '@/lib/types';
import { useAmebaStore } from '@/state/useAmebaStore';

const FARM_ORIGIN_GX = 3;
const FARM_ORIGIN_GY = 3;
const FARM_TILE_SIZE = 64;

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

const FarmPlotCanvas = memo(function FarmPlotCanvas({
    gx,
    gy,
    crop,
    plantedAt,
    stage,
    selected,
    isValid,
    onClick,
}: {
    gx: number;
    gy: number;
    crop: string | null;
    plantedAt: number | null;
    stage: 0 | 1 | 2 | 3 | null;
    selected: boolean;
    isValid: boolean;
    onClick: () => void;
}) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = FARM_TILE_SIZE;
        canvas.height = FARM_TILE_SIZE;

        ctx.fillStyle = selected ? '#8b6914' : '#a0826d';
        ctx.beginPath();
        ctx.moveTo(FARM_TILE_SIZE / 2, 0);
        ctx.lineTo(FARM_TILE_SIZE, FARM_TILE_SIZE / 2);
        ctx.lineTo(FARM_TILE_SIZE / 2, FARM_TILE_SIZE);
        ctx.lineTo(0, FARM_TILE_SIZE / 2);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = selected ? '#d4af37' : '#999';
        ctx.lineWidth = selected ? 3 : 1;
        ctx.stroke();

        if (selected) {
            ctx.strokeStyle = '#d4af37';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(FARM_TILE_SIZE / 2 - 8, FARM_TILE_SIZE / 2);
            ctx.lineTo(FARM_TILE_SIZE / 2, FARM_TILE_SIZE / 2 - 8);
            ctx.lineTo(FARM_TILE_SIZE / 2 + 8, FARM_TILE_SIZE / 2);
            ctx.lineTo(FARM_TILE_SIZE / 2, FARM_TILE_SIZE / 2 + 8);
            ctx.closePath();
            ctx.stroke();
        }

        if (stage !== null && crop && CROP_DEFS[crop as keyof typeof CROP_DEFS]) {
            const emoji = CROP_DEFS[crop as keyof typeof CROP_DEFS].stages[stage];
            ctx.font = 'bold 28px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(emoji, FARM_TILE_SIZE / 2, FARM_TILE_SIZE / 2 - 2);
        }
    }, [crop, plantedAt, stage, selected]);

    return (
        <button
            type="button"
            onClick={onClick}
            className="absolute h-16 w-16 -translate-x-8 -translate-y-8 rounded-lg border-0 p-0 shadow-lg transition hover:shadow-xl"
            style={{ cursor: isValid ? 'pointer' : 'default' }}
            title="畑マス"
        >
            <canvas ref={canvasRef} className="h-full w-full" />
        </button>
    );
});

export default function FarmingRoomView() {
    const roomRef = useRef<HTMLDivElement | null>(null);
    const [originX, setOriginX] = useState(0);
    const avatar = useAmebaStore(state => state.avatar);
    const pet = useAmebaStore(state => state.pet);
    const stamps = useAmebaStore(state => state.stamps);
    const farming = useAmebaStore(state => state.farming);
    const removeStamp = useAmebaStore(state => state.removeStamp);
    const avatarBundle = useAmebaStore(state => state.avatarBundle);
    const savedOverlayCatalog = useAmebaStore(state => state.savedOverlayCatalog);
    const selectedOverlaySlugs = useAmebaStore(state => state.selectedOverlaySlugs);
    const walkTo = useAmebaStore(state => state.walkTo);
    const selectPlot = useAmebaStore(state => state.selectPlot);
    const plantSeed = useAmebaStore(state => state.plantSeed);
    const waterPlot = useAmebaStore(state => state.waterPlot);
    const harvestPlot = useAmebaStore(state => state.harvestPlot);
    const leaveFarmingRoom = useAmebaStore(state => state.leaveFarmingRoom);

    useEffect(() => {
        const update = () => {
            if (!roomRef.current) return;
            setOriginX(roomRef.current.clientWidth / 2);
        };
        update();
        window.addEventListener('resize', update);
        return () => window.removeEventListener('resize', update);
    }, []);

    const farmPlots = useMemo(() => {
        return farming.gardenPlots.map(plot => {
            const screenX = FARM_ORIGIN_GX + plot.gx;
            const screenY = FARM_ORIGIN_GY + plot.gy;
            const pos = gridToScreen(screenX, screenY, originX);
            const stage = plot.plantedAt ? cropGrowthStage(plot.plantedAt) : null;
            return { ...plot, pos, stage, screenX, screenY };
        });
    }, [farming.gardenPlots, originX]);

    const avatarPos = gridToScreen(avatar.x, avatar.y, originX);

    return (
        <section className="fixed inset-0 overflow-hidden bg-[radial-gradient(circle_at_top,_#c8e6a0_0%,_#a4d65e_50%,_#8bc34a_100%)] pb-20">
            <div ref={roomRef} className="relative h-full w-full">
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                    <p className="text-3xl font-black text-white drop-shadow-lg">🌾 栽培部屋 🌾</p>
                </div>

                {farmPlots.map(plot => (
                    <div
                        key={plot.id}
                        className="absolute"
                        style={{ left: plot.pos.x, top: plot.pos.y, zIndex: Math.floor((plot.screenX + plot.screenY) * 100) }}
                    >
                        <FarmPlotCanvas
                            gx={plot.gx}
                            gy={plot.gy}
                            crop={plot.crop}
                            plantedAt={plot.plantedAt}
                            stage={plot.stage}
                            selected={farming.selectedPlotId === plot.id}
                            isValid={farming.inFarmingRoom}
                            onClick={() => selectPlot(plot.id)}
                        />
                    </div>
                ))}

                <div
                    className="pointer-events-none absolute h-[180px] w-[140px] -translate-x-[70px] -translate-y-[160px]"
                    style={{ left: avatarPos.x, top: avatarPos.y, zIndex: Math.floor((avatar.x + avatar.y) * 100) }}
                >
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

                <button
                    type="button"
                    onClick={leaveFarmingRoom}
                    className="fixed bottom-24 left-1/2 z-[1300] -translate-x-1/2 rounded-2xl bg-red-500 px-6 py-3 font-bold text-white hover:bg-red-600 shadow-lg"
                >
                    通常の部屋に戻る
                </button>

                {farming.selectedPlotId && (
                    <div className="absolute bottom-24 left-1/2 z-[1300] -translate-x-1/2 rounded-2xl border border-gray-100 bg-white/95 p-2 shadow-lg">
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => plantSeed(farming.selectedPlotId as string)}
                                className="rounded-xl bg-emerald-500 px-3 py-2 text-xs font-black text-white hover:bg-emerald-600"
                            >
                                種植え
                            </button>
                            <button
                                type="button"
                                onClick={() => waterPlot(farming.selectedPlotId as string)}
                                className="rounded-xl bg-sky-500 px-3 py-2 text-xs font-black text-white hover:bg-sky-600"
                            >
                                水やり
                            </button>
                            <button
                                type="button"
                                onClick={() => harvestPlot(farming.selectedPlotId as string)}
                                className="rounded-xl bg-amber-500 px-3 py-2 text-xs font-black text-white hover:bg-amber-600"
                            >
                                収穫
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
