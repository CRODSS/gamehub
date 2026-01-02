// src/types/index.ts

// Kullanıcı Profili
export interface UserProfile {
    uid: string;
    nickname: string;
    avatarUrl?: string;
    isGuest: boolean; // Misafir mi yoksa kayıtlı mı?
    stats: {
        gamesPlayed: number;
        wins: number;
    };
}

// Oyun Odası (Room) Yapısı
export interface Room {
    roomId: string; // Örn: XK92
    hostId: string; // Odayı kuran kişinin UID'si
    status: 'waiting' | 'playing' | 'finished';
    maxPlayers: number;
    players: UserProfile[]; // Odadaki oyuncular
    currentGame: 'spyfall' | 'diplomacy' | 'auction' | null; // Şu an oynanan oyun
    createdAt: number;
}

// Tema ve Dil Seçenekleri
export type Theme = 'dark' | 'light';
export type Language = 'tr' | 'en';

// Re-export from user.ts
export type { User, AuthProvider, AuthState, NicknameData } from './user';