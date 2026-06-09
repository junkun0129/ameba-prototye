/** Minimal WebRTC P2P room manager skeleton. */

import type { PeerAddress } from '@/services/amebaGasApi';

export type RoomEventHandler = {
    onMemberJoined?: (peerId: string) => void;
    onMemberLeft?: (peerId: string) => void;
    onError?: (err: Error) => void;
};

type PeerEntry = {
    peerId: string;
    pc: RTCPeerConnection;
};

const ICE_SERVERS: RTCIceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
];

export class WebRTCRoom {
    private peers = new Map<string, PeerEntry>();
    private handlers: RoomEventHandler;

    constructor(handlers: RoomEventHandler = {}) {
        this.handlers = handlers;
    }

    /** Connect to a remote peer given their address info (offer flow). */
    async connectToPeer(peerAddr: PeerAddress): Promise<void> {
        if (this.peers.has(peerAddr.peerId)) return;

        const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
        this.peers.set(peerAddr.peerId, { peerId: peerAddr.peerId, pc });

        pc.oniceconnectionstatechange = () => {
            if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
                this.peers.delete(peerAddr.peerId);
                this.handlers.onMemberLeft?.(peerAddr.peerId);
            }
        };

        // Answer flow: set remote SDP then create answer
        if (peerAddr.sdp) {
            await pc.setRemoteDescription({ type: 'offer', sdp: peerAddr.sdp });
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            // ICE candidates
            if (peerAddr.ice) {
                for (const cand of peerAddr.ice) {
                    await pc.addIceCandidate(new RTCIceCandidate(cand));
                }
            }
        } else {
            // Offer flow
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
        }

        this.handlers.onMemberJoined?.(peerAddr.peerId);
    }

    /** Apply member list received from host. */
    async applyMemberList(members: PeerAddress[]): Promise<void> {
        for (const addr of members) {
            await this.connectToPeer(addr).catch(err => this.handlers.onError?.(err as Error));
        }
    }

    /** Close all peer connections and clean up. */
    close(): void {
        for (const { pc } of this.peers.values()) {
            pc.close();
        }
        this.peers.clear();
    }

    get peerCount(): number {
        return this.peers.size;
    }
}
