import React, { createContext, useState, useContext, useEffect } from 'react';
import type { ReactNode } from 'react';

// Ayarlar Tipleri
interface SettingsState {
    theme: 'dark' | 'light';
    language: 'tr' | 'en';
    volume: number; // 0-100
    music: number;  // 0-100
    notifications: {
        gameInvites: boolean;
        friendRequests: boolean;
        updates: boolean;
    };
}

// Çeviri Anahtarları Tipi
export type TranslationKey = keyof typeof translations['tr'];

interface SettingsContextType extends SettingsState {
    setTheme: (theme: 'dark' | 'light') => void;
    setLanguage: (lang: 'tr' | 'en') => void;
    setVolume: (vol: number) => void;
    setMusic: (vol: number) => void;
    toggleNotification: (key: keyof SettingsState['notifications']) => void;
    t: (key: TranslationKey) => string;
}

const defaultSettings: SettingsState = {
    theme: 'dark', // Varsayılan: Koyu Tema
    language: 'tr', // Varsayılan: Türkçe
    volume: 80,
    music: 60,
    notifications: {
        gameInvites: true,
        friendRequests: true,
        updates: false
    }
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// Basit Çeviri Sözlüğü
const translations = {
    tr: {
        // Genel
        'welcome': 'Hoşgeldin',
        'guest': 'Misafir Oyuncu',
        'guestAccount': 'Misafir Hesabı',
        'verifiedMember': 'Onaylı Üye',
        'logout': 'Çıkış Yap',
        'games': 'Oyunlar',
        'profile': 'Profilim',
        'settings': 'Ayarlar',

        // Ayarlar Sayfası
        'settingsTitle': 'Ayarlar',
        'settingsDesc': 'Oyun deneyimini kişiselleştir',
        'generalSettings': 'Genel Ayarlar',
        'language': 'Dil (Language)',
        'languageDesc': 'Uygulamanın görüntüleneceği dil',
        'theme': 'Tema',
        'themeDesc': 'Görünüm tercihini seç',
        'dark': 'Koyu',
        'light': 'Açık',
        'audioSettings': 'Ses Ayarları',
        'masterVolume': 'Genel Ses',
        'musicVolume': 'Müzik',
        'notifications': 'Bildirimler',
        'gameInvites': 'Oyun Davetleri',
        'friendRequests': 'Arkadaşlık İstekleri',
        'updates': 'Güncellemeler ve Haberler',
        'accountActions': 'Hesap İşlemleri',
        'deleteAccount': 'Hesabı Sil',

        // Profil Sayfası
        'editProfile': 'Profili Düzenle',
        'addFriend': 'Arkadaş Ekle',
        'stats': 'İstatistikler',
        'gamesPlayed': 'Oynanan Oyun',
        'wins': 'Kazanılan',
        'winRate': 'Kazanma Oranı',
        'rank': 'Sıralama',
        'recentGames': 'Son Oyunlar',
        'noGames': 'Henüz hiç oyun oynanmadı. Hemen bir oyuna katıl!',
        'discoverGames': 'Oyunları Keşfet',
        'newNickname': 'Yeni Takma Ad'
    },
    en: {
        // General
        'welcome': 'Welcome',
        'guest': 'Guest Player',
        'guestAccount': 'Guest Account',
        'verifiedMember': 'Verified Member',
        'logout': 'Logout',
        'games': 'Games',
        'profile': 'My Profile',
        'settings': 'Settings',

        // Settings Page
        'settingsTitle': 'Settings',
        'settingsDesc': 'Customize your game experience',
        'generalSettings': 'General Settings',
        'language': 'Language',
        'languageDesc': 'Display language of the application',
        'theme': 'Theme',
        'themeDesc': 'Choose your appearance preference',
        'dark': 'Dark',
        'light': 'Light',
        'audioSettings': 'Audio Settings',
        'masterVolume': 'Master Volume',
        'musicVolume': 'Music',
        'notifications': 'Notifications',
        'gameInvites': 'Game Invites',
        'friendRequests': 'Friend Requests',
        'updates': 'Updates & News',
        'accountActions': 'Account Actions',
        'deleteAccount': 'Delete Account',

        // Profile Page
        'editProfile': 'Edit Profile',
        'addFriend': 'Add Friend',
        'stats': 'Statistics',
        'gamesPlayed': 'Games Played',
        'wins': 'Wins',
        'winRate': 'Win Rate',
        'rank': 'Rank',
        'recentGames': 'Recent Games',
        'noGames': 'No games played yet. Join a game now!',
        'discoverGames': 'Discover Games',
        'newNickname': 'New Nickname'
    }
};

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
    // ... (mevcut state kodları aynı)
    const [settings, setSettings] = useState<SettingsState>(() => {
        const saved = localStorage.getItem('gamehub_settings');
        return saved ? JSON.parse(saved) : defaultSettings;
    });

    useEffect(() => {
        localStorage.setItem('gamehub_settings', JSON.stringify(settings));
        const root = window.document.documentElement;
        if (settings.theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
    }, [settings]);

    const setTheme = (theme: 'dark' | 'light') => setSettings(prev => ({ ...prev, theme }));
    const setLanguage = (language: 'tr' | 'en') => setSettings(prev => ({ ...prev, language }));
    const setVolume = (volume: number) => setSettings(prev => ({ ...prev, volume }));
    const setMusic = (music: number) => setSettings(prev => ({ ...prev, music }));

    const toggleNotification = (key: keyof SettingsState['notifications']) => {
        setSettings(prev => ({
            ...prev,
            notifications: {
                ...prev.notifications,
                [key]: !prev.notifications[key]
            }
        }));
    };

    // Çeviri fonksiyonu
    const t = (key: TranslationKey) => {
        return translations[settings.language][key] || key;
    };

    return (
        <SettingsContext.Provider value={{
            ...settings,
            setTheme,
            setLanguage,
            setVolume,
            setMusic,
            toggleNotification,
            t // Context'e ekle
        }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};
