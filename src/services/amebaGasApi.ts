/// <reference types="vite/client" />
import type { RoomInfo } from '@/lib/types';

const GAS_URL = import.meta.env.VITE_AMEBA_GAS_URL as string | undefined;

function gasUrl(): string {
    if (!GAS_URL) throw new Error('VITE_AMEBA_GAS_URL is not set');
    return GAS_URL;
}

async function gasPost<T>(action: string, payload?: Record<string, unknown>): Promise<T> {
    const url = gasUrl();
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...payload }),
    });
    if (!res.ok) throw new Error(`GAS request failed: ${res.status}`);
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data as T;
}

async function gasGet<T>(action: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(gasUrl());
    url.searchParams.set('action', action);
    if (params) {
        for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    }
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`GAS request failed: ${res.status}`);
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data as T;
}

// --- Public API ---

export type GasRoomListResponse = { rooms: RoomInfo[]; myPeerId: string };
export type GasJoinResponse = { isHost: boolean; myPeerId: string };
export type GasPollResponse = { members: PeerAddress[] };

export type PeerAddress = {
    peerId: string;
    sdp?: string;
    ice?: RTCIceCandidateInit[];
};

export async function listRooms(): Promise<GasRoomListResponse> {
    return gasGet<GasRoomListResponse>('rooms/list');
}

export async function joinRoom(roomId: string): Promise<GasJoinResponse> {
    return gasPost<GasJoinResponse>('rooms/join', { roomId });
}

export async function leaveRoom(roomId: string): Promise<void> {
    await gasPost<unknown>('rooms/leave', { roomId });
}

export async function pollHost(roomId: string): Promise<GasPollResponse> {
    return gasGet<GasPollResponse>('rooms/poll-host', { roomId });
}

export async function shareMembers(roomId: string, members: PeerAddress[]): Promise<void> {
    await gasPost<unknown>('rooms/share-members', { roomId, members });
}
