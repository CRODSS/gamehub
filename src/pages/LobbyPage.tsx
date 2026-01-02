import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import { useAuth } from '../contexts/AuthContext';
import { ref, onValue, update, set } from 'firebase/database';
import { db } from '../config/firebase'; // Ensure db is exported from your config
import { GAME_CATEGORIES } from '../data/gameData';
import { Users, Clock, Copy, Settings, ArrowRight } from 'lucide-react';

interface Player {
    nickname: string;
    avatarUrl?: string;
    isHost: boolean;
}

interface RoomSettings {
    categoryId: string;
    timeLimit: number;
    maxPlayers: number;
    spyCount: number;
    showCheatSheet: boolean;
}

interface RoomData {
    hostId: string;
    status: 'waiting' | 'playing' | 'finished';
    settings: RoomSettings;
    players: Record<string, Player>;
}

const LobbyPage: React.FC = () => {
    const { roomId } = useParams<{ roomId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [roomData, setRoomData] = useState<RoomData | null>(null);
    const [loading, setLoading] = useState(true);
    const [copySuccess, setCopySuccess] = useState(false);

    // 1. Listen to Room Data & Handle Redirects
    useEffect(() => {
        if (!roomId || !user) return;

        const roomRef = ref(db, `rooms/${roomId}`);

        const unsubscribe = onValue(roomRef, async (snapshot) => {
            const data = snapshot.val();

            if (!data) {
                // Room doesn't exist
                alert("Oda bulunamadı!");
                navigate('/');
                return;
            }

            // Game Started Redirect
            if (data.status === 'playing') {
                navigate(`/game/${roomId}`);
                return;
            }

            setRoomData(data);
            setLoading(false);

            // Auto-Join Logic
            if (data.players && !data.players[user.uid]) {
                const currentPlayers = Object.keys(data.players).length;
                const maxPlayers = data.settings.maxPlayers || 8;

                if (currentPlayers >= maxPlayers) {
                    alert("Oda dolu!");
                    navigate('/');
                    return;
                }

                // Add user to players
                const updates: any = {};
                updates[`rooms/${roomId}/players/${user.uid}`] = {
                    nickname: user.nickname,
                    avatarUrl: user.avatarUrl || null,
                    isHost: false
                };

                try {
                    await update(ref(db), updates);
                } catch (error) {
                    console.error("Error joining room:", error);
                }
            }
        });

        return () => unsubscribe();
    }, [roomId, user, navigate]);


    // 2. Start Game Logic
    const handleStartGame = async () => {
        if (!roomId || !roomData) return;

        try {
            // 1. Get Category & Word
            const categoryId = roomData.settings.categoryId;
            const category = GAME_CATEGORIES.find(c => c.id === categoryId);
            const words = category?.items || ["Bilinmeyen"];
            const secretWord = words[Math.floor(Math.random() * words.length)];

            // 2. Assign Roles
            const playerIds = Object.keys(roomData.players);
            const spyCount = roomData.settings.spyCount || 1;
            const roles: Record<string, 'spy' | 'innocent'> = {};

            // Shuffle players
            for (let i = playerIds.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [playerIds[i], playerIds[j]] = [playerIds[j], playerIds[i]];
            }

            // Assign Spies
            playerIds.forEach((uid, index) => {
                if (index < spyCount) {
                    roles[uid] = 'spy';
                } else {
                    roles[uid] = 'innocent';
                }
            });

            // 3. Update DB
            await update(ref(db, `rooms/${roomId}`), {
                gameState: {
                    roles: roles,
                    secretWord: secretWord,
                    startTime: Date.now()
                },
                status: 'playing'
            });

        } catch (error) {
            console.error("Error starting game:", error);
            alert("Oyun başlatılamadı.");
        }
    };

    // Copy to Clipboard
    const copyToClipboard = () => {
        if (roomId) {
            navigator.clipboard.writeText(roomId);
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        }
    };

    if (loading || !roomData) {
        return (
            <MainLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="flex flex-col items-center gap-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                        <p className="text-gray-500 animate-pulse">Lobiye bağlanılıyor...</p>
                    </div>
                </div>
            </MainLayout>
        );
    }

    const isHost = user?.uid === roomData.hostId;
    const playersList = Object.entries(roomData.players || {});
    const playerCount = playersList.length;
    const category = GAME_CATEGORIES.find(c => c.id === roomData.settings.categoryId);

    return (
        <MainLayout>
            <div className="max-w-6xl mx-auto pb-20 pt-8 px-4">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                        <div className="relative bg-white dark:bg-gray-800 ring-1 ring-gray-900/5 dark:ring-white/10 rounded-xl p-6 flex items-center gap-6">
                            <div className="text-left">
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Oda Kodu</p>
                                <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 font-mono tracking-wider">
                                    {roomId}
                                </h1>
                            </div>
                            <div className="h-12 w-px bg-gray-200 dark:bg-gray-700"></div>
                            <button
                                onClick={copyToClipboard}
                                className="p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group/btn"
                                title="Kopyala"
                            >
                                {copySuccess ? (
                                    <span className="text-green-500 font-bold">✓</span>
                                ) : (
                                    <Copy className="text-gray-400 group-hover/btn:text-purple-600 transition-colors" />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Status Badge */}
                    <div className="px-6 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full font-bold animate-pulse flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                        Oyuncular Bekleniyor ({playerCount}/{roomData.settings.maxPlayers})
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Player List */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl border border-gray-100 dark:border-gray-700">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                                <span>👥</span> Oyuncular
                            </h2>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {playersList.map(([uid, player]) => (
                                    <div key={uid} className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-gray-700/50 hover:bg-white dark:hover:bg-gray-700 hover:shadow-lg transition-all border border-transparent hover:border-purple-100 dark:hover:border-purple-900">
                                        <div className="relative">
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 p-0.5">
                                                <div className="w-full h-full rounded-full bg-white dark:bg-gray-800 flex items-center justify-center overflow-hidden">
                                                    {player.avatarUrl ? (
                                                        <img src={player.avatarUrl} alt={player.nickname} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="font-bold text-purple-600 text-lg">{player.nickname.substring(0, 2).toUpperCase()}</span>
                                                    )}
                                                </div>
                                            </div>
                                            {uid === roomData.hostId && (
                                                <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm border border-white">
                                                    HOST
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 dark:text-white">{player.nickname}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{uid === user?.uid ? '(Sen)' : 'Hazır'}</p>
                                        </div>
                                    </div>
                                ))}

                                {/* Empty Slots */}
                                {Array.from({ length: Math.max(0, roomData.settings.maxPlayers - playerCount) }).map((_, i) => (
                                    <div key={`empty-${i}`} className="flex items-center gap-4 p-4 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 text-gray-400">
                                        <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                            <span className="text-xl opacity-20">?</span>
                                        </div>
                                        <p className="font-medium opacity-50">Bekleniyor...</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Settings & Actions */}
                    <div className="space-y-6">
                        {/* Settings Card */}
                        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-xl border border-gray-100 dark:border-gray-700 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none"></div>

                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                <Settings size={20} className="text-purple-500" /> Oyun Ayarları
                            </h3>

                            <div className="space-y-6">
                                {/* Category */}
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase">Kategori</label>
                                        {isHost && <span className="text-[10px] bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded">DÜZENLE</span>}
                                    </div>
                                    {isHost ? (
                                        <select
                                            className="w-full bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600 px-4 py-3 font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                                            value={roomData.settings.categoryId}
                                            onChange={(e) => set(ref(db, `rooms/${roomId}/settings/categoryId`), e.target.value)}
                                        >
                                            {GAME_CATEGORIES.map(cat => (
                                                <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 flex items-center gap-3">
                                            <span className="text-2xl">{category?.icon}</span>
                                            <span className="font-bold text-gray-900 dark:text-white">{category?.name}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Controls Grid */}
                                <div className="grid grid-cols-2 gap-4">
                                    {/* Time */}
                                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
                                        <div className="flex items-center gap-2 mb-2 text-purple-600 dark:text-purple-400">
                                            <Clock size={16} /> <span className="text-xs font-bold uppercase">Süre</span>
                                        </div>
                                        {isHost ? (
                                            <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-1 shadow-sm">
                                                <button
                                                    onClick={() => roomData.settings.timeLimit > 1 && set(ref(db, `rooms/${roomId}/settings/timeLimit`), roomData.settings.timeLimit - 1)}
                                                    className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-gray-500 transition-colors"
                                                >-</button>
                                                <span className="font-bold">{roomData.settings.timeLimit}dk</span>
                                                <button
                                                    onClick={() => roomData.settings.timeLimit < 15 && set(ref(db, `rooms/${roomId}/settings/timeLimit`), roomData.settings.timeLimit + 1)}
                                                    className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-gray-500 transition-colors"
                                                >+</button>
                                            </div>
                                        ) : (
                                            <div className="font-bold text-center text-xl text-gray-900 dark:text-white">{roomData.settings.timeLimit} dk</div>
                                        )}
                                    </div>

                                    {/* Spies */}
                                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
                                        <div className="flex items-center gap-2 mb-2 text-red-600 dark:text-red-400">
                                            <Users size={16} /> <span className="text-xs font-bold uppercase">Casus</span>
                                        </div>
                                        {isHost ? (
                                            <div className="flex gap-1 bg-white dark:bg-gray-800 rounded-lg p-1 shadow-sm">
                                                <button
                                                    onClick={() => set(ref(db, `rooms/${roomId}/settings/spyCount`), 1)}
                                                    className={`flex-1 py-1.5 rounded-md text-sm font-bold transition-colors ${roomData.settings.spyCount === 1 ? 'bg-red-500 text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                                >1</button>
                                                <button
                                                    onClick={() => set(ref(db, `rooms/${roomId}/settings/spyCount`), 2)}
                                                    className={`flex-1 py-1.5 rounded-md text-sm font-bold transition-colors ${roomData.settings.spyCount === 2 ? 'bg-red-500 text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                                >2</button>
                                            </div>
                                        ) : (
                                            <div className="font-bold text-center text-xl text-gray-900 dark:text-white">{roomData.settings.spyCount || 1}</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Start Button */}
                        {isHost ? (
                            <button
                                onClick={handleStartGame}
                                disabled={playerCount < 3}
                                className="w-full py-5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-2xl font-black text-xl shadow-xl shadow-purple-500/30 transform transition hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
                            >
                                <span className="relative z-10 flex items-center justify-center gap-3">
                                    OYUNU BAŞLAT <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
                                </span>
                                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                            </button>
                        ) : (
                            <div className="w-full py-5 bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 rounded-2xl font-bold text-center border-2 border-dashed border-gray-200 dark:border-gray-700 animate-pulse">
                                Host bekleniyor...
                            </div>
                        )}

                        {isHost && playerCount < 3 && (
                            <p className="text-center text-xs text-red-500 font-medium bg-red-50 dark:bg-red-900/10 py-2 rounded-lg">
                                En az 3 oyuncu gerekli!
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};

export default LobbyPage;
