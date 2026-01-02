import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import { useAuth } from '../contexts/AuthContext';
import { GAME_CATEGORIES } from '../data/gameData';
import { ref, set, serverTimestamp } from 'firebase/database';
import { db } from '../config/firebase';
import { Clock, Users, Eye, EyeOff, Play, Trophy, AlertCircle, Target } from 'lucide-react';

const CreateRoomPage: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);

    // Settings State
    const [selectedCategory, setSelectedCategory] = useState<string>(GAME_CATEGORIES[0].id);
    const [timeLimit, setTimeLimit] = useState<number>(5);
    const [maxPlayers, setMaxPlayers] = useState<number>(8);
    const [spyCount, setSpyCount] = useState<1 | 2>(1);
    const [showCheatSheet, setShowCheatSheet] = useState<boolean>(true);

    // Scoring State
    const [innocentWinScore, setInnocentWinScore] = useState<number>(10);
    const [spyGuessWinScore, setSpyGuessWinScore] = useState<number>(20);
    const [spyVoteWinScore, setSpyVoteWinScore] = useState<number>(15);

    const generateRoomCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 4; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    };

    const handleCreateRoom = async () => {
        if (!user) return;
        setLoading(true);

        try {
            const roomCode = generateRoomCode();
            const roomRef = ref(db, `rooms/${roomCode}`);

            const roomData = {
                hostId: user.uid,
                status: 'waiting',
                settings: {
                    categoryId: selectedCategory,
                    timeLimit: timeLimit,
                    maxPlayers: maxPlayers,
                    spyCount: spyCount,
                    showCheatSheet: showCheatSheet,
                    scores: {
                        innocentWin: innocentWinScore,
                        spyGuessWin: spyGuessWinScore,
                        spyVoteWin: spyVoteWinScore,
                    }
                },
                players: {
                    [user.uid]: {
                        nickname: user.nickname,
                        avatarUrl: user.avatarUrl || null,
                        isHost: true
                    }
                },
                createdAt: serverTimestamp()
            };

            await set(roomRef, roomData);
            navigate(`/lobby/${roomCode}`);
        } catch (error) {
            console.error("Error creating room:", error);
            alert("Oda oluşturulurken bir hata meydana geldi.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <MainLayout>
            <div className="max-w-4xl mx-auto space-y-8 pb-20 pt-10">
                <header>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Oda Oluştur</h1>
                    <p className="text-gray-500 dark:text-gray-400">Oyun ayarlarını özelleştir ve arkadaşlarını davet et.</p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column: Game Settings */}
                    <div className="space-y-6">
                        {/* Category Selection */}
                        <div className="bg-white dark:bg-gray-800/50 backdrop-blur-xl border border-gray-200 dark:border-gray-700/50 rounded-2xl p-6 shadow-sm">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <span>📚</span> Kategori Seçimi
                            </h2>
                            <div className="grid grid-cols-2 gap-3">
                                {GAME_CATEGORIES.map((category) => (
                                    <button
                                        key={category.id}
                                        onClick={() => setSelectedCategory(category.id)}
                                        className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200 ${selectedCategory === category.id
                                            ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-white'
                                            : 'border-transparent bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                            }`}
                                    >
                                        <span className="text-2xl mb-1">{category.icon}</span>
                                        <span className="text-sm font-medium text-center">{category.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Other Settings */}
                        <div className="bg-white dark:bg-gray-800/50 backdrop-blur-xl border border-gray-200 dark:border-gray-700/50 rounded-2xl p-6 shadow-sm space-y-6">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <span>⚙️</span> Oyun Ayarları
                            </h2>

                            {/* Max Players */}
                            <div>
                                <div className="flex justify-between mb-2">
                                    <label className="text-gray-700 dark:text-gray-300 font-medium flex items-center gap-2">
                                        <Users size={18} /> Kişi Sayısı
                                    </label>
                                    <span className="font-bold text-purple-600 dark:text-purple-400">{maxPlayers} Kişi</span>
                                </div>
                                <input
                                    type="range"
                                    min="3"
                                    max="15"
                                    step="1"
                                    value={maxPlayers}
                                    onChange={(e) => setMaxPlayers(parseInt(e.target.value))}
                                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
                                />
                            </div>

                            {/* Time Limit */}
                            <div>
                                <div className="flex justify-between mb-2">
                                    <label className="text-gray-700 dark:text-gray-300 font-medium flex items-center gap-2">
                                        <Clock size={18} /> Süre (Dakika)
                                    </label>
                                    <span className="font-bold text-purple-600 dark:text-purple-400">{timeLimit} dk</span>
                                </div>
                                <input
                                    type="range"
                                    min="3"
                                    max="10"
                                    step="1"
                                    value={timeLimit}
                                    onChange={(e) => setTimeLimit(parseInt(e.target.value))}
                                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
                                />
                            </div>

                            {/* Scoring Settings */}
                            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    <Trophy size={18} /> Puanlama Ayarları
                                </h3>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                            <Target size={16} /> Casus Tahmin Ederse
                                        </label>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="number"
                                                value={spyGuessWinScore}
                                                onChange={(e) => setSpyGuessWinScore(parseInt(e.target.value) || 0)}
                                                className="w-20 px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg text-center font-bold"
                                            />
                                            <span className="text-xs text-gray-500">Puan</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                            <AlertCircle size={16} /> Yanlış Masum Seçilirse (Casus Kazanır)
                                        </label>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="number"
                                                value={spyVoteWinScore}
                                                onChange={(e) => setSpyVoteWinScore(parseInt(e.target.value) || 0)}
                                                className="w-20 px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg text-center font-bold"
                                            />
                                            <span className="text-xs text-gray-500">Puan</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                            <Users size={16} /> Masumlar Kazanırsa
                                        </label>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="number"
                                                value={innocentWinScore}
                                                onChange={(e) => setInnocentWinScore(parseInt(e.target.value) || 0)}
                                                className="w-20 px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg text-center font-bold"
                                            />
                                            <span className="text-xs text-gray-500">Puan</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Spy Count */}
                            <div>
                                <label className="text-gray-700 dark:text-gray-300 font-medium flex items-center gap-2 mb-3">
                                    <Users size={18} /> Casus Sayısı
                                </label>
                                <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-xl">
                                    <button
                                        onClick={() => setSpyCount(1)}
                                        className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${spyCount === 1
                                            ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow'
                                            : 'text-gray-500 dark:text-gray-400'
                                            }`}
                                    >
                                        1 Casus
                                    </button>
                                    <button
                                        onClick={() => setSpyCount(2)}
                                        className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${spyCount === 2
                                            ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow'
                                            : 'text-gray-500 dark:text-gray-400'
                                            }`}
                                    >
                                        2 Casus
                                    </button>
                                </div>
                            </div>

                            {/* Cheat Sheet Toggle */}
                            <div className="flex items-center justify-between">
                                <label className="text-gray-700 dark:text-gray-300 font-medium flex items-center gap-2">
                                    {showCheatSheet ? <Eye size={18} /> : <EyeOff size={18} />}
                                    Kopya Kağıdı Gösterilsin
                                </label>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={showCheatSheet}
                                        onChange={(e) => setShowCheatSheet(e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Preview & Action */}
                    <div className="space-y-6">
                        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-8 text-white text-center shadow-xl">
                            <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
                                <span className="text-4xl">{GAME_CATEGORIES.find(c => c.id === selectedCategory)?.icon}</span>
                            </div>
                            <h3 className="text-2xl font-bold mb-2">
                                {GAME_CATEGORIES.find(c => c.id === selectedCategory)?.name}
                            </h3>
                            <div className="flex flex-wrap justify-center gap-4 text-indigo-100 text-sm mb-8">
                                <span className="flex items-center gap-1"><Users size={14} /> {maxPlayers} Kişi</span>
                                <span className="flex items-center gap-1"><Clock size={14} /> {timeLimit} dk</span>
                                <span className="flex items-center gap-1"><Users size={14} /> {spyCount} Casus</span>
                            </div>

                            <button
                                onClick={handleCreateRoom}
                                disabled={loading}
                                className="w-full py-4 bg-white text-indigo-600 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                                ) : (
                                    <>
                                        <Play size={24} fill="currentColor" /> Odayı Oluştur
                                    </>
                                )}
                            </button>
                        </div>

                        <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-900/30 rounded-2xl p-6">
                            <h4 className="font-bold text-orange-800 dark:text-orange-200 mb-2">Nasıl Oynanır?</h4>
                            <ul className="text-sm text-orange-700 dark:text-orange-300 space-y-2 list-disc list-inside">
                                <li>Herkes bir mekanı veya kelimeyi bilir, casuslar hariç.</li>
                                <li>Sırayla birbirinize sorular sorun.</li>
                                <li>Casusu bulmaya çalışın, casus ise mekanı tahmin etmeye çalışır.</li>
                                <li>Süre bitmeden oylama yapın!</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};

export default CreateRoomPage;
