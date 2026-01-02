import React from 'react';
import MainLayout from '../components/layout/MainLayout';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';

const SettingsPage: React.FC = () => {
    const { logout } = useAuth();
    const {
        theme, setTheme,
        language, setLanguage,
        volume, setVolume,
        music, setMusic,
        notifications, toggleNotification,
        t
    } = useSettings();

    const handleLogout = async () => {
        try {
            await logout();
            window.location.href = '/login';
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    return (
        <MainLayout>
            <div className="max-w-3xl mx-auto space-y-8">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{t('settingsTitle')}</h1>
                    <p className="text-gray-500 dark:text-gray-400">{t('settingsDesc')}</p>
                </div>

                {/* Section: General */}
                <div className="bg-white dark:bg-gray-800/50 backdrop-blur-xl border border-gray-200 dark:border-gray-700/50 rounded-2xl overflow-hidden shadow-lg dark:shadow-none transition-colors duration-300">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700/50">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <span>⚙️</span> {t('generalSettings')}
                        </h2>
                    </div>
                    <div className="p-6 space-y-6">
                        {/* Language */}
                        <div className="flex items-center justify-between">
                            <div>
                                <label className="text-gray-700 dark:text-gray-300 font-medium block">{t('language')}</label>
                                <p className="text-sm text-gray-500 dark:text-gray-500">{t('languageDesc')}</p>
                            </div>
                            <select
                                value={language}
                                onChange={(e) => setLanguage(e.target.value as 'tr' | 'en')}
                                className="bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none transition"
                            >
                                <option value="tr">Türkçe 🇹🇷</option>
                                <option value="en">English 🇬🇧</option>
                            </select>
                        </div>

                        {/* Theme */}
                        <div className="flex items-center justify-between">
                            <div>
                                <label className="text-gray-700 dark:text-gray-300 font-medium block">{t('theme')}</label>
                                <p className="text-sm text-gray-500 dark:text-gray-500">{t('themeDesc')}</p>
                            </div>
                            <div className="flex bg-gray-100 dark:bg-gray-900 p-1 rounded-lg border border-gray-200 dark:border-gray-700">
                                <button
                                    onClick={() => setTheme('dark')}
                                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${theme === 'dark' ? 'bg-gray-700 text-white shadow' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'}`}
                                >
                                    🌙 {t('dark')}
                                </button>
                                <button
                                    onClick={() => setTheme('light')}
                                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${theme === 'light' ? 'bg-white text-gray-900 shadow' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'}`}
                                >
                                    ☀️ {t('light')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section: Audio */}
                <div className="bg-white dark:bg-gray-800/50 backdrop-blur-xl border border-gray-200 dark:border-gray-700/50 rounded-2xl overflow-hidden shadow-lg dark:shadow-none transition-colors duration-300">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700/50">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <span>🔊</span> {t('audioSettings')}
                        </h2>
                    </div>
                    <div className="p-6 space-y-6">
                        {/* Master Volume */}
                        <div>
                            <div className="flex justify-between mb-2">
                                <label className="text-gray-700 dark:text-gray-300 font-medium">{t('masterVolume')}</label>
                                <span className="text-gray-500 dark:text-gray-400 text-sm">%{volume}</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={volume}
                                onChange={(e) => setVolume(parseInt(e.target.value))}
                                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                            />
                        </div>

                        {/* Music Volume */}
                        <div>
                            <div className="flex justify-between mb-2">
                                <label className="text-gray-700 dark:text-gray-300 font-medium">{t('musicVolume')}</label>
                                <span className="text-gray-500 dark:text-gray-400 text-sm">%{music}</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={music}
                                onChange={(e) => setMusic(parseInt(e.target.value))}
                                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Section: Notifications */}
                <div className="bg-white dark:bg-gray-800/50 backdrop-blur-xl border border-gray-200 dark:border-gray-700/50 rounded-2xl overflow-hidden shadow-lg dark:shadow-none transition-colors duration-300">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700/50">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <span>🔔</span> {t('notifications')}
                        </h2>
                    </div>
                    <div className="p-6 space-y-4">
                        {Object.entries({
                            gameInvites: t('gameInvites'),
                            friendRequests: t('friendRequests'),
                            updates: t('updates')
                        }).map(([key, label]) => (
                            <div key={key} className="flex items-center justify-between">
                                <span className="text-gray-700 dark:text-gray-300">{label}</span>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={notifications[key as keyof typeof notifications]}
                                        onChange={() => toggleNotification(key as keyof typeof notifications)}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                                </label>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Section: Danger Zone */}
                <div className="bg-red-50 dark:bg-red-900/10 backdrop-blur-xl border border-red-200 dark:border-red-900/30 rounded-2xl overflow-hidden transition-colors duration-300">
                    <div className="p-6 border-b border-red-200 dark:border-red-900/30">
                        <h2 className="text-lg font-semibold text-red-600 dark:text-red-500 flex items-center gap-2">
                            <span>⚠️</span> {t('accountActions')}
                        </h2>
                    </div>
                    <div className="p-6 flex flex-col sm:flex-row gap-4 justify-end">
                        <button
                            onClick={handleLogout}
                            className="px-6 py-2 rounded-xl bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500 dark:text-red-400 border border-gray-200 dark:border-gray-700 hover:border-red-200 dark:hover:border-red-800 transition font-medium"
                        >
                            {t('logout')}
                        </button>
                        <button className="px-6 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/20 transition font-medium">
                            {t('deleteAccount')}
                        </button>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};

export default SettingsPage;
