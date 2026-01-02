import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import { ref, get } from 'firebase/database';
import { db } from '../config/firebase';
import { Plus, LogIn, ArrowRight, ArrowLeft } from 'lucide-react';

const SpyfallPage: React.FC = () => {
    const navigate = useNavigate();
    const [roomCode, setRoomCode] = useState('');
    const [joining, setJoining] = useState(false);

    const handleJoinRoom = async () => {
        if (!roomCode.trim()) {
            alert('Lütfen bir oda kodu girin.');
            return;
        }

        setJoining(true);
        const code = roomCode.toUpperCase().trim();

        try {
            const roomRef = ref(db, `rooms/${code}`);
            const snapshot = await get(roomRef);

            if (snapshot.exists()) {
                navigate(`/lobby/${code}`);
            } else {
                alert('Böyle bir oda bulunamadı. Lütfen kodu kontrol edin.');
            }
        } catch (error) {
            console.error("Odaya katılırken hata:", error);
            alert('Bir hata oluştu. Lütfen tekrar deneyin.');
        } finally {
            setJoining(false);
        }
    };

    return (
        <MainLayout>
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/')}
                        className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                    >
                        <ArrowLeft size={24} className="text-gray-700 dark:text-gray-300" />
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Casus Kim?</h1>
                </div>

                {/* Hero / Description */}
                <section className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-purple-800 to-indigo-900 shadow-2xl">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
                    <div className="relative z-10 px-8 py-12 md:py-16 flex flex-col md:flex-row items-center gap-8">
                        <div className="w-full md:w-1/2 text-white">
                            <span className="px-3 py-1 bg-purple-500/30 border border-purple-400/30 rounded-full text-sm font-semibold mb-4 inline-block backdrop-blur-sm">
                                Popüler Parti Oyunu
                            </span>
                            <h2 className="text-3xl md:text-5xl font-extrabold mb-4 leading-tight">
                                Aranızdaki <span className="text-yellow-400">Casusu</span> Bulun!
                            </h2>
                            <p className="text-purple-100 text-lg mb-6 leading-relaxed">
                                Herkes mekanı biliyor, casus hariç. Casus ise mekanı tahmin etmeye çalışıyor.
                                Sorular sorun, cevapları analiz edin ve casusu yakalayın!
                            </p>
                            <div className="flex gap-4 text-sm font-medium text-purple-200">
                                <span className="flex items-center gap-1">👥 3-10 Oyuncu</span>
                                <span className="flex items-center gap-1">⏱️ 5-10 Dakika</span>
                            </div>
                        </div>
                        <div className="w-full md:w-1/2 flex justify-center">
                            <div className="relative w-64 h-64 md:w-80 md:h-80 bg-white/10 rounded-full backdrop-blur-md flex items-center justify-center border border-white/20 shadow-2xl">
                                <span className="text-9xl">🕵️</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Actions Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Create Room Card */}
                    <div
                        onClick={() => navigate('/create')}
                        className="group bg-gradient-to-br from-purple-500 to-indigo-600 rounded-3xl p-8 text-white relative overflow-hidden cursor-pointer shadow-xl hover:shadow-2xl transition-all hover:-translate-y-2 border border-white/10"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Plus size={120} />
                        </div>
                        <div className="relative z-10 h-full flex flex-col justify-between">
                            <div>
                                <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 shadow-inner">
                                    <Plus size={32} className="text-white" />
                                </div>
                                <h3 className="text-3xl font-bold mb-2">Yeni Oda Kur</h3>
                                <p className="text-purple-100 mb-8 font-medium text-lg">
                                    Kendi oyun odanı oluştur, ayarları özelleştir ve arkadaşlarını davet et.
                                </p>
                            </div>
                            <button className="flex items-center gap-2 bg-white text-purple-600 px-6 py-4 rounded-xl font-bold text-lg group-hover:bg-purple-50 transition-colors w-fit shadow-lg">
                                Oda Oluştur <ArrowRight size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Join Room Card */}
                    <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 border border-gray-100 dark:border-gray-700 shadow-xl flex flex-col justify-center h-full">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-2xl flex items-center justify-center text-orange-600 dark:text-orange-400 shadow-inner">
                                <LogIn size={32} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Odaya Katıl</h3>
                                <p className="text-gray-500 dark:text-gray-400">Arkadaşının paylaştığı kodu gir ve eğlenceye katıl.</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <input
                                type="text"
                                value={roomCode}
                                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                                placeholder="ODA KODU (ÖRN: XK92)"
                                className="w-full bg-gray-50 dark:bg-gray-700/50 border-2 border-gray-200 dark:border-gray-600 rounded-2xl px-6 py-4 text-2xl font-mono tracking-[0.2em] text-center uppercase focus:ring-4 focus:ring-orange-100 dark:focus:ring-orange-900/20 focus:border-orange-500 outline-none transition placeholder:tracking-normal placeholder:text-base font-bold text-gray-900 dark:text-white"
                                maxLength={4}
                            />
                            <button
                                onClick={handleJoinRoom}
                                disabled={joining}
                                className="w-full bg-orange-500 hover:bg-orange-600 text-white px-6 py-4 rounded-2xl font-bold text-lg transition-all shadow-lg hover:shadow-orange-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {joining ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                        Katılıyor...
                                    </>
                                ) : (
                                    <>
                                        Oyuna Katıl <LogIn size={20} />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};

export default SpyfallPage;
