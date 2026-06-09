import type { NatStatus } from '@/lib/types';

const STUN_SERVERS = [
    'stun:stun.l.google.com:19302',
    'stun:stun1.l.google.com:19302',
];

export async function detectNat(): Promise<{ status: NatStatus; errorMessage: string | null }> {
    return new Promise(resolve => {
        const pc = new RTCPeerConnection({
            iceServers: STUN_SERVERS.map(urls => ({ urls })),
        });

        const srflxPorts = new Set<number>();
        let settled = false;

        const finish = () => {
            if (settled) return;
            settled = true;
            pc.close();

            if (srflxPorts.size === 0) {
                resolve({
                    status: 'udp_blocked',
                    errorMessage: 'UDPが使用できないため外出できません。',
                });
            } else if (srflxPorts.size >= 2) {
                resolve({
                    status: 'symmetric_nat',
                    errorMessage: 'Symmetric NATのため外出できません。',
                });
            } else {
                resolve({ status: 'open', errorMessage: null });
            }
        };

        pc.onicecandidate = event => {
            if (!event.candidate) return;
            const { candidate } = event.candidate;
            // srflx candidates: "a=candidate:... srflx ... port ..."
            if (candidate.includes('srflx')) {
                const match = candidate.match(/\d+\s+udp\s+\d+\s+[\d.]+\s+(\d+)/);
                if (match) {
                    srflxPorts.add(Number(match[1]));
                }
            }
        };

        pc.onicegatheringstatechange = () => {
            if (pc.iceGatheringState === 'complete') finish();
        };

        // Timeout after 8 seconds
        const timer = setTimeout(() => finish(), 8000);

        // Create data channel to trigger ICE gathering
        pc.createDataChannel('ameba-nat-check');

        pc.createOffer()
            .then(offer => pc.setLocalDescription(offer))
            .catch(() => {
                clearTimeout(timer);
                if (!settled) {
                    settled = true;
                    pc.close();
                    resolve({ status: 'udp_blocked', errorMessage: 'NAT確認中にエラーが発生しました。' });
                }
            });

        // Also finish when timer fires
        const origFinish = finish;
        // biome-ignore lint/suspicious/noAssignInExpressions: intentional
        void (timer as unknown);
        void origFinish;
    });
}
