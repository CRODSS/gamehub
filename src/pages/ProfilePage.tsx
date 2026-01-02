import React, { useState, useRef, useEffect } from 'react';
import MainLayout from '../components/layout/MainLayout';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { ref as dbRef, get } from 'firebase/database';
import { storage, db } from '../config/firebase';

const ProfilePage: React.FC = () => {
    const { user, updateProfile } = useAuth();
    const { t } = useSettings();
    const [isEditing, setIsEditing] = useState(false);
    const [nickname, setNickname] = useState(user?.nickname || '');
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [rank, setRank] = useState<number | string>('-');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Rank Hesaplama
    useEffect(() => {
        const fetchRank = async () => {
            if (!user) return;
            try {
                const usersRef = dbRef(db, 'users');
                const snapshot = await get(usersRef);

                if (snapshot.exists()) {
                    const users = snapshot.val();
                    const userList = Object.values(users) as any[];

                    // Kullanıcıları kazanma sayısına göre sırala (Çoktan aza)
                    userList.sort((a, b) => (b.stats?.wins || 0) - (a.stats?.wins || 0));

                    // Mevcut kullanıcının sırasını bul
                    const myRank = userList.findIndex(u => u.uid === user.uid) + 1;
                    setRank(myRank > 0 ? `#${myRank}` : '-');
                }
            } catch (error) {
                console.error("Rank hesaplanamadı:", error);
            }
        };

        fetchRank();
    }, [user]);

    // Win Rate Hesaplama
    const gamesPlayed = user?.stats?.gamesPlayed || 0;
    const wins = user?.stats?.wins || 0;
    const winRate = gamesPlayed > 0 ? Math.round((wins / gamesPlayed) * 100) : 0;

    // Kullanıcı istatistikleri
    const stats = [
        { label: t('gamesPlayed'), value: gamesPlayed, icon: '🎮', color: 'from-blue-500 to-cyan-500' },
        { label: t('wins'), value: wins, icon: '🏆', color: 'from-yellow-500 to-orange-500' },
        { label: t('winRate'), value: `%${winRate}`, icon: '📈', color: 'from-green-500 to-emerald-500' },
        { label: t('rank'), value: rank, icon: '🌍', color: 'from-purple-500 to-pink-500' },
    ];

    const handleSaveProfile = async () => {
        if (!nickname.trim()) return;
        setLoading(true);
        try {
            await updateProfile({ nickname });
            setIsEditing(false);
            // Başarılı bildirimi eklenebilir
        } catch (error) {
            console.error('Profil güncellenemedi:', error);
            alert('Profil güncellenirken bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !user) return;

        // Dosya boyutu kontrolü (örn: 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('Dosya boyutu 5MB\'dan küçük olmalıdır.');
            return;
        }

        // Dosya tipi kontrolü
        if (!file.type.startsWith('image/')) {
            alert('Lütfen geçerli bir resim dosyası seçin.');
            return;
        }

        setUploading(true);
        try {
            const storageRef = ref(storage, `profile_images/${user.uid}`);

            // 15 saniyelik zaman aşımı (timeout) ekliyoruz - Bağlantı veya kural hatası için
            const uploadPromise = uploadBytes(storageRef, file);
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('TIMEOUT')), 15000)
            );

            await Promise.race([uploadPromise, timeoutPromise]);

            const downloadURL = await getDownloadURL(storageRef);
            await updateProfile({ avatarUrl: downloadURL });

        } catch (error: any) {
            console.error('Fotoğraf yüklenemedi:', error);
            if (error.code === 'storage/unauthorized') {
                alert('Yükleme izniniz yok. Lütfen Firebase Storage "Rules" kısmını kontrol edin.');
            } else if (error.message === 'TIMEOUT') {
                alert('Yükleme zaman aşımına uğradı. İnternet bağlantınızı veya Storage kurallarını kontrol edin.');
            } else {
                alert('Fotoğraf yüklenirken bir hata oluştu: ' + (error.message || 'Bilinmeyen hata'));
            }
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleCameraClick = () => {
        fileInputRef.current?.click();
    };

    const handleAddFriend = () => {
        alert(t('addFriend') + ' soon!');
    };

    return (
        <MainLayout>
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Hero / Header Section */}
                <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-gray-800/50 backdrop-blur-xl border border-gray-200 dark:border-gray-700 p-8 shadow-xl dark:shadow-none transition-colors duration-300">
                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl pointer-events-none"></div>

                    <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-8">
                        {/* Avatar */}
                        <div className="relative group">
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileChange}
                            />
                            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 p-1 shadow-2xl shadow-purple-500/30">
                                <div className="w-full h-full rounded-full bg-white dark:bg-gray-900 flex items-center justify-center overflow-hidden relative">
                                    {uploading ? (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                                        </div>
                                    ) : null}
                                    {user?.avatarUrl ? (
                                        <img src={user.avatarUrl} alt={user.nickname} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="text-4xl text-gray-400">👤</div>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={handleCameraClick}
                                disabled={uploading}
                                className="absolute bottom-0 right-0 bg-white dark:bg-gray-800 text-gray-700 dark:text-white p-2 rounded-full border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition shadow-lg disabled:opacity-50"
                            >
                                📷
                            </button>
                        </div>

                        {/* User Info */}
                        <div className="flex-1 text-center md:text-left space-y-4">
                            <div>
                                {isEditing ? (
                                    <div className="flex flex-col md:flex-row gap-2 max-w-sm">
                                        <input
                                            type="text"
                                            value={nickname}
                                            onChange={(e) => setNickname(e.target.value)}
                                            className="bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            placeholder={t('newNickname')}
                                        />
                                        <div className="flex gap-2 justify-center md:justify-start">
                                            <button
                                                onClick={handleSaveProfile}
                                                disabled={loading}
                                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition disabled:opacity-50"
                                            >
                                                {loading ? '...' : '✓'}
                                            </button>
                                            <button
                                                onClick={() => setIsEditing(false)}
                                                className="px-4 py-2 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-800 dark:text-white rounded-lg transition"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                                            {user?.nickname || t('guest')}
                                        </h1>
                                        <p className="text-gray-500 dark:text-gray-400 mt-1">
                                            {user?.isGuest ? t('guestAccount') : t('verifiedMember') + ' ✅'}
                                        </p>
                                    </>
                                )}
                            </div>

                            {/* Buttons */}
                            {!isEditing && (
                                <div className="flex flex-wrap justify-center md:justify-start gap-3">
                                    <button
                                        onClick={() => {
                                            setNickname(user?.nickname || '');
                                            setIsEditing(true);
                                        }}
                                        className="px-6 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition text-gray-900 dark:text-white font-medium border border-gray-200 dark:border-gray-600"
                                    >
                                        {t('editProfile')}
                                    </button>
                                    <button
                                        onClick={handleAddFriend}
                                        className="px-6 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 transition text-white font-medium shadow-lg shadow-purple-500/20"
                                    >
                                        {t('addFriend')}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <span>📊</span> {t('stats')}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {stats.map((stat, index) => (
                            <div key={index} className="bg-white dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700/50 p-6 rounded-2xl hover:-translate-y-1 transition duration-300 group shadow-lg dark:shadow-none">
                                <div className={`w - 12 h - 12 rounded - xl bg - gradient - to - br ${stat.color} p - 0.5 mb - 4 shadow - lg`}>
                                    <div className="w-full h-full bg-white dark:bg-gray-900 rounded-[10px] flex items-center justify-center text-xl">
                                        {stat.icon}
                                    </div>
                                </div>
                                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">{stat.label}</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1 group-hover:scale-105 transition origin-left">{stat.value}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Games History (Placeholder) */}
                <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <span>🕒</span> {t('recentGames')}
                    </h2>
                    <div className="bg-white dark:bg-gray-800/30 border border-gray-200 dark:border-gray-700/50 rounded-2xl p-6 text-center text-gray-500 shadow-sm dark:shadow-none">
                        <p>{t('noGames')}</p>
                        <button className="mt-4 text-purple-600 dark:text-purple-400 hover:text-purple-500 dark:hover:text-purple-300 transition font-medium">{t('discoverGames')} →</button>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};

export default ProfilePage;
