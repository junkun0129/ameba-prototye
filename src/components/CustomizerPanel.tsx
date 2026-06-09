import { useEffect, useRef, useState } from 'react';
import { useAmebaStore } from '@/state/useAmebaStore';
import { OVERLAY_PART_LABELS, OVERLAY_PART_ORDER } from '@/tools/avatar-editor/constants';

const hairColors = ['#a1785e', '#332211', '#dec59e', '#ffb7b2', '#93c5fd', '#6b7280'];
const skinColors = ['#ffebd9', '#fed7aa', '#fdba74'];
const shirtColors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#ffffff', '#1f2937'];
const pantsColors = ['#f59e0b', '#3b82f6', '#ec4899', '#10b981', '#ffffff', '#1f2937'];
const shoeColors = ['#10b981', '#f43f5e', '#3b82f6', '#f59e0b', '#1f2937', '#ffffff'];

function OptionButton({ selected, children, onClick }: { selected: boolean; children: React.ReactNode; onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`rounded-xl border-2 px-3 py-2 text-xs font-bold transition ${selected ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-100 hover:border-gray-300'
                }`}
        >
            {children}
        </button>
    );
}

function ColorButton({ color, selected, onClick }: { color: string; selected: boolean; onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`h-8 w-8 rounded-full border-2 ${color === '#ffffff' ? 'border-gray-200' : 'border-white'} ${selected ? 'ring-2 ring-emerald-500' : 'ring-2 ring-transparent'}`}
            style={{ backgroundColor: color }}
        />
    );
}

export default function CustomizerPanel() {
    const [chatInput, setChatInput] = useState('');
    const bundleInputRef = useRef<HTMLInputElement | null>(null);
    const avatar = useAmebaStore(state => state.avatar);
    const avatarBundle = useAmebaStore(state => state.avatarBundle);
    const loadAvatarBundle = useAmebaStore(state => state.loadAvatarBundle);
    const loadDefaultAvatarBundle = useAmebaStore(state => state.loadDefaultAvatarBundle);
    const clearAvatarBundle = useAmebaStore(state => state.clearAvatarBundle);
    const savedOverlayCatalog = useAmebaStore(state => state.savedOverlayCatalog);
    const selectedOverlaySlugs = useAmebaStore(state => state.selectedOverlaySlugs);
    const refreshSavedOverlayCatalog = useAmebaStore(state => state.refreshSavedOverlayCatalog);
    const selectOverlaySet = useAmebaStore(state => state.selectOverlaySet);
    const activeTab = useAmebaStore(state => state.activeTab);
    const roomTheme = useAmebaStore(state => state.roomTheme);
    const setActiveTab = useAmebaStore(state => state.setActiveTab);
    const setEyeStyle = useAmebaStore(state => state.setEyeStyle);
    const setMouthStyle = useAmebaStore(state => state.setMouthStyle);
    const setExpression = useAmebaStore(state => state.setExpression);
    const setHairStyle = useAmebaStore(state => state.setHairStyle);
    const setHairColor = useAmebaStore(state => state.setHairColor);
    const setSkinColor = useAmebaStore(state => state.setSkinColor);
    const setShirtStyle = useAmebaStore(state => state.setShirtStyle);
    const setShirtColor = useAmebaStore(state => state.setShirtColor);
    const setPantsStyle = useAmebaStore(state => state.setPantsStyle);
    const setPantsColor = useAmebaStore(state => state.setPantsColor);
    const setShoeColor = useAmebaStore(state => state.setShoeColor);
    const toggleAccessory = useAmebaStore(state => state.toggleAccessory);
    const triggerAction = useAmebaStore(state => state.triggerAction);
    const addStamp = useAmebaStore(state => state.addStamp);
    const setRoomWall = useAmebaStore(state => state.setRoomWall);
    const setFloorStyle = useAmebaStore(state => state.setFloorStyle);
    const setChatMessage = useAmebaStore(state => state.setChatMessage);
    const hideChat = useAmebaStore(state => state.hideChat);
    const audioEnabled = useAmebaStore(state => state.audioEnabled);
    const toggleAudio = useAmebaStore(state => state.toggleAudio);

    useEffect(() => {
        if (activeTab !== 'avatar') return;
        // avatarBundle がまだ未ロードのときだけデフォルトを読み込む（再マウントで上書きしない）
        if (!avatarBundle) void loadDefaultAvatarBundle();
        void refreshSavedOverlayCatalog();
    }, [activeTab, avatarBundle, loadDefaultAvatarBundle, refreshSavedOverlayCatalog]);

    return (
        <section className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
                <p className="text-xs font-bold text-blue-700">Pigg Sandbox 設定パネル</p>
                <button
                    type="button"
                    onClick={toggleAudio}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${audioEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-white text-sky-600 hover:bg-sky-50'}`}
                >
                    {audioEnabled ? '⏸️ BGM停止' : '🎵 BGM再生'}
                </button>
            </div>

            <div className="space-y-5">
                {activeTab === 'avatar' && (
                    <div className="space-y-5">
                        {/* ---- Avatar Bundle 読み込み ---- */}
                        <section className="rounded-xl border border-cyan-100 bg-cyan-50 p-3">
                            <h3 className="mb-2 text-xs font-black uppercase tracking-wider text-cyan-700">Avatar Bundle</h3>
                            {avatarBundle ? (
                                <div className="flex items-center justify-between gap-2">
                                    <p className="text-xs font-bold text-cyan-800">
                                        ✅ Bundle 使用中（管理画面で作成したアバター）
                                    </p>
                                    <button
                                        type="button"
                                        onClick={clearAvatarBundle}
                                        className="rounded-lg bg-red-100 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-200"
                                    >
                                        解除
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <label className="cursor-pointer rounded-lg bg-cyan-600 px-3 py-2 text-xs font-bold text-white hover:bg-cyan-700">
                                        Bundle JSON を読み込む
                                        <input
                                            ref={bundleInputRef}
                                            type="file"
                                            accept="application/json,.json"
                                            className="hidden"
                                            onChange={event => {
                                                const file = event.target.files?.[0];
                                                if (file) void loadAvatarBundle(file);
                                                if (bundleInputRef.current) bundleInputRef.current.value = '';
                                            }}
                                        />
                                    </label>
                                    <p className="text-xs text-cyan-700">管理画面の「Bundle 保存」で出力した JSON</p>
                                </div>
                            )}
                        </section>
                        <section className="rounded-xl border border-orange-100 bg-orange-50 p-3">
                            <div className="mb-2 flex items-center justify-between">
                                <h3 className="text-xs font-black uppercase tracking-wider text-orange-700">Overlay 着せ替え</h3>
                                <button
                                    type="button"
                                    onClick={() => void refreshSavedOverlayCatalog()}
                                    className="rounded-lg bg-white px-2.5 py-1 text-[11px] font-bold text-orange-700 hover:bg-orange-100"
                                >
                                    更新
                                </button>
                            </div>

                            {!avatarBundle ? (
                                <p className="rounded-lg border border-orange-200 bg-white px-3 py-2 text-xs font-semibold text-orange-700">
                                    先に「Bundle JSON を読み込む」を行うと、保存済み overlay をこの画面から適用できます。
                                </p>
                            ) : (
                                <div className="grid gap-3 sm:grid-cols-2">
                                    {OVERLAY_PART_ORDER.map(partType => {
                                        const entries = savedOverlayCatalog.filter(entry => entry.partType === partType);
                                        if (!entries.length) return null;
                                        return (
                                            <div key={partType} className="rounded-xl border border-orange-200 bg-white p-2">
                                                <p className="mb-2 text-[11px] font-black uppercase tracking-wider text-orange-700">{OVERLAY_PART_LABELS[partType]}</p>
                                                <div className="grid gap-2">
                                                    {entries.map(entry => {
                                                        const selected = selectedOverlaySlugs[partType] === entry.slug;
                                                        return (
                                                            <button
                                                                key={`${entry.partType}-${entry.slug}`}
                                                                type="button"
                                                                onClick={() => void selectOverlaySet(partType, entry.slug)}
                                                                className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 text-left transition ${selected ? 'border-orange-500 bg-orange-100' : 'border-gray-200 bg-white hover:border-orange-300'}`}
                                                            >
                                                                <img src={entry.thumbnailUrl} alt={entry.name} className="h-10 w-10 rounded-md object-cover" />
                                                                <span className="text-xs font-bold text-slate-700">{entry.name}</span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {!savedOverlayCatalog.length ? (
                                        <p className="rounded-lg border border-orange-200 bg-white px-3 py-2 text-xs font-semibold text-orange-700 sm:col-span-2">
                                            まだ保存済み overlay がありません。管理画面で各パーツの「保存」を押すとここに表示されます。
                                        </p>
                                    ) : null}
                                </div>
                            )}
                        </section>
                        <section>
                            <h3 className="mb-2 text-xs font-black uppercase tracking-wider text-gray-400">目のスタイル</h3>
                            <div className="grid grid-cols-2 gap-2">
                                <OptionButton selected={avatar.eyeStyle === 'round'} onClick={() => setEyeStyle('round')}>⚫ ぱっちり丸目</OptionButton>
                                <OptionButton selected={avatar.eyeStyle === 'sparkle'} onClick={() => setEyeStyle('sparkle')}>✨ きらきら瞳</OptionButton>
                                <OptionButton selected={avatar.eyeStyle === 'cool'} onClick={() => setEyeStyle('cool')}>➖ クール・ジト目</OptionButton>
                                <OptionButton selected={avatar.eyeStyle === 'droop'} onClick={() => setEyeStyle('droop')}>📐 優しいたれ目</OptionButton>
                            </div>
                        </section>

                        <section>
                            <h3 className="mb-2 text-xs font-black uppercase tracking-wider text-gray-400">お口のスタイル</h3>
                            <div className="grid grid-cols-2 gap-2">
                                <OptionButton selected={avatar.mouthStyle === 'smile'} onClick={() => setMouthStyle('smile')}>◡ にっこり</OptionButton>
                                <OptionButton selected={avatar.mouthStyle === 'dot'} onClick={() => setMouthStyle('dot')}>• おちょぼ口</OptionButton>
                                <OptionButton selected={avatar.mouthStyle === 'ho'} onClick={() => setMouthStyle('ho')}>O ポカン口</OptionButton>
                                <OptionButton selected={avatar.mouthStyle === 'cat'} onClick={() => setMouthStyle('cat')}>ω ネコ口</OptionButton>
                            </div>
                        </section>

                        <section>
                            <h3 className="mb-2 text-xs font-black uppercase tracking-wider text-gray-400">一時的な表情</h3>
                            <div className="grid grid-cols-2 gap-2">
                                <OptionButton selected={avatar.expression === 'normal'} onClick={() => setExpression('normal')}>🙂 つうじょう</OptionButton>
                                <OptionButton selected={avatar.expression === 'smile'} onClick={() => setExpression('smile')}>😊 にっこり笑顔</OptionButton>
                                <OptionButton selected={avatar.expression === 'angry'} onClick={() => setExpression('angry')}>😡 おこる</OptionButton>
                                <OptionButton selected={avatar.expression === 'sad'} onClick={() => setExpression('sad')}>🥺 うるうる涙</OptionButton>
                                <OptionButton selected={avatar.expression === 'wink'} onClick={() => setExpression('wink')}>😉 ウィンク</OptionButton>
                            </div>
                        </section>

                        <section>
                            <h3 className="mb-2 text-xs font-black uppercase tracking-wider text-gray-400">ヘアスタイル</h3>
                            <div className="grid grid-cols-2 gap-2">
                                <OptionButton selected={avatar.hairStyle === 'bob'} onClick={() => setHairStyle('bob')}>💇 マッシュボブ</OptionButton>
                                <OptionButton selected={avatar.hairStyle === 'long'} onClick={() => setHairStyle('long')}>👩 ストレートロング</OptionButton>
                                <OptionButton selected={avatar.hairStyle === 'twin'} onClick={() => setHairStyle('twin')}>👧 ツインテール</OptionButton>
                                <OptionButton selected={avatar.hairStyle === 'pony'} onClick={() => setHairStyle('pony')}>🐴 ふんわりポニー</OptionButton>
                                <OptionButton selected={avatar.hairStyle === 'spiky'} onClick={() => setHairStyle('spiky')}>⚡ ウルフショート</OptionButton>
                                <OptionButton selected={avatar.hairStyle === 'none'} onClick={() => setHairStyle('none')}>🥚 つるつる</OptionButton>
                            </div>
                        </section>

                        <section>
                            <h3 className="mb-2 text-xs font-black uppercase tracking-wider text-gray-400">髪の色</h3>
                            <div className="flex flex-wrap gap-2">
                                {hairColors.map(color => (
                                    <ColorButton key={color} color={color} selected={avatar.hairColor === color} onClick={() => setHairColor(color)} />
                                ))}
                            </div>
                        </section>

                        <section>
                            <h3 className="mb-2 text-xs font-black uppercase tracking-wider text-gray-400">肌の色</h3>
                            <div className="flex gap-2">
                                {skinColors.map(color => (
                                    <ColorButton key={color} color={color} selected={avatar.skinColor === color} onClick={() => setSkinColor(color)} />
                                ))}
                            </div>
                        </section>

                        <section>
                            <h3 className="mb-2 text-xs font-black uppercase tracking-wider text-gray-400">トップスの形</h3>
                            <div className="grid grid-cols-2 gap-2">
                                <OptionButton selected={avatar.shirtStyle === 'tshirt'} onClick={() => setShirtStyle('tshirt')}>👕 Tシャツ</OptionButton>
                                <OptionButton selected={avatar.shirtStyle === 'longsleeve'} onClick={() => setShirtStyle('longsleeve')}>🧥 長袖シャツ</OptionButton>
                                <OptionButton selected={avatar.shirtStyle === 'tanktop'} onClick={() => setShirtStyle('tanktop')}>🎽 タンクトップ</OptionButton>
                                <OptionButton selected={avatar.shirtStyle === 'hoodie'} onClick={() => setShirtStyle('hoodie')}>🧢 パーカー</OptionButton>
                                <OptionButton selected={avatar.shirtStyle === 'bear'} onClick={() => setShirtStyle('bear')}>🐻 クマの着ぐるみ</OptionButton>
                            </div>
                        </section>

                        <section>
                            <h3 className="mb-2 text-xs font-black uppercase tracking-wider text-gray-400">トップスの色</h3>
                            <div className="flex flex-wrap gap-2">
                                {shirtColors.map(color => (
                                    <ColorButton key={color} color={color} selected={avatar.shirtColor === color} onClick={() => setShirtColor(color)} />
                                ))}
                            </div>
                        </section>

                        <section>
                            <h3 className="mb-2 text-xs font-black uppercase tracking-wider text-gray-400">ボトムスの形</h3>
                            <div className="grid grid-cols-3 gap-2">
                                <OptionButton selected={avatar.pantsStyle === 'shorts'} onClick={() => setPantsStyle('shorts')}>🩳 半ズボン</OptionButton>
                                <OptionButton selected={avatar.pantsStyle === 'pants'} onClick={() => setPantsStyle('pants')}>👖 長ズボン</OptionButton>
                                <OptionButton selected={avatar.pantsStyle === 'skirt'} onClick={() => setPantsStyle('skirt')}>👗 スカート</OptionButton>
                            </div>
                        </section>

                        <section>
                            <h3 className="mb-2 text-xs font-black uppercase tracking-wider text-gray-400">ボトムスの色</h3>
                            <div className="flex flex-wrap gap-2">
                                {pantsColors.map(color => (
                                    <ColorButton key={color} color={color} selected={avatar.pantsColor === color} onClick={() => setPantsColor(color)} />
                                ))}
                            </div>
                        </section>

                        <section>
                            <h3 className="mb-2 text-xs font-black uppercase tracking-wider text-gray-400">靴の色</h3>
                            <div className="flex flex-wrap gap-2">
                                {shoeColors.map(color => (
                                    <ColorButton key={color} color={color} selected={avatar.shoeColor === color} onClick={() => setShoeColor(color)} />
                                ))}
                            </div>
                        </section>

                        <section>
                            <h3 className="mb-2 text-xs font-black uppercase tracking-wider text-gray-400">アクセサリー</h3>
                            <div className="grid grid-cols-2 gap-2">
                                <OptionButton selected={avatar.glasses} onClick={() => toggleAccessory('glasses')}>👓 メガネ {avatar.glasses ? '(ON)' : '(OFF)'}</OptionButton>
                                <OptionButton selected={avatar.nekomimi} onClick={() => toggleAccessory('nekomimi')}>🐱 ネコ耳 {avatar.nekomimi ? '(ON)' : '(OFF)'}</OptionButton>
                            </div>
                        </section>
                    </div>
                )}

                {activeTab === 'actions' && (
                    <div className="space-y-4">
                        <p className="text-xs text-gray-500">ピグにリアクションをさせてみましょう。</p>
                        <div className="grid grid-cols-2 gap-3">
                            <button type="button" onClick={() => triggerAction('wave')} className="rounded-xl border border-teal-100 bg-gradient-to-r from-teal-50 to-emerald-50 px-4 py-3 text-sm font-bold text-teal-800 shadow-sm transition hover:border-teal-300">👋 手を振る</button>
                            <button type="button" onClick={() => triggerAction('dance')} className="rounded-xl border border-pink-100 bg-gradient-to-r from-pink-50 to-rose-50 px-4 py-3 text-sm font-bold text-rose-800 shadow-sm transition hover:border-pink-300">💃 ダンス</button>
                            <button type="button" onClick={() => triggerAction('jump')} className="rounded-xl border border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-3 text-sm font-bold text-amber-800 shadow-sm transition hover:border-amber-300">✨ ジャンプ!</button>
                            <button type="button" onClick={() => triggerAction('sleep')} className="rounded-xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-violet-50 px-4 py-3 text-sm font-bold text-indigo-800 shadow-sm transition hover:border-indigo-300">💤 おやすみ</button>
                        </div>
                        <div className="border-t border-gray-100 pt-4">
                            <h3 className="mb-2 text-xs font-black uppercase tracking-wider text-gray-400">エフェクト・スタンプ</h3>
                            <div className="grid grid-cols-4 gap-2">
                                {['💖', '💢', '💡', '💤', '✨', '💦', '👍', '🎉'].map(emoji => (
                                    <button key={emoji} type="button" onClick={() => addStamp(emoji)} className="rounded-xl border border-gray-100 bg-gray-50 p-2 text-2xl transition hover:scale-110 hover:bg-emerald-50">
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'room' && (
                    <div className="space-y-4">
                        <section>
                            <h3 className="mb-2 text-xs font-black uppercase tracking-wider text-gray-400">壁紙のデザイン</h3>
                            <div className="grid grid-cols-3 gap-2">
                                <button type="button" onClick={() => setRoomWall('#fef08a', '#fef9c3', '#eab308')} className="rounded-xl border bg-yellow-100 p-2 text-xs font-bold">マイルドレモン</button>
                                <button type="button" onClick={() => setRoomWall('#fed7aa', '#ffedd5', '#ea580c')} className="rounded-xl border bg-orange-100 p-2 text-xs font-bold">アプリコット</button>
                                <button type="button" onClick={() => setRoomWall('#a7f3d0', '#ecfdf5', '#059669')} className="rounded-xl border bg-emerald-100 p-2 text-xs font-bold">ミントグリーン</button>
                            </div>
                        </section>
                        <section>
                            <h3 className="mb-2 text-xs font-black uppercase tracking-wider text-gray-400">床の素材</h3>
                            <div className="grid grid-cols-2 gap-2">
                                <OptionButton selected={roomTheme.floorStyle === 'carpet'} onClick={() => setFloorStyle('carpet')}>🏠 モカカーペット</OptionButton>
                                <OptionButton selected={roomTheme.floorStyle === 'wood'} onClick={() => setFloorStyle('wood')}>🪵 フローリング木目調</OptionButton>
                            </div>
                        </section>
                        <section className="space-y-2 border-t border-gray-100 pt-4">
                            <h3 className="mb-1 text-xs font-black uppercase tracking-wider text-gray-400">お部屋の家具＆ペット</h3>
                            <div className="space-y-2 rounded-xl border border-sky-100 bg-sky-50 p-3 text-xs leading-relaxed text-sky-800">
                                <p>🛋️ <strong>赤いソファ:</strong> クリックすると、そこまで歩いていって腰掛けます。</p>
                                <p>🐕 <strong>仔犬:</strong> クリックすると嬉しそうに跳ねます。</p>
                                <p>🪴 <strong>観葉植物:</strong> クリックすると歩いていってお手入れします。</p>
                            </div>
                        </section>
                    </div>
                )}
            </div>

            {activeTab === 'chat' && (
                <div className="rounded-xl border border-gray-100 bg-white px-5 py-4">
                    <form
                        onSubmit={event => {
                            event.preventDefault();
                            const text = chatInput.trim();
                            if (!text) return;
                            setChatMessage(text);
                            setChatInput('');
                            window.setTimeout(() => hideChat(), 5000);
                        }}
                        className="flex items-center gap-2"
                    >
                        <input
                            value={chatInput}
                            onChange={event => setChatInput(event.target.value)}
                            placeholder="ここでおしゃべり..."
                            maxLength={40}
                            className="flex-1 rounded-full border-2 border-gray-200 bg-gray-50 px-4 py-2 text-sm outline-none transition focus:border-emerald-400 focus:bg-white"
                        />
                        <button type="submit" className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-600">話す</button>
                    </form>
                </div>
            )}
        </section>
    );
}
