export interface User {
    uid: string;
    email: string | null;
    nickname: string | null;
    avatar: string | null;
    provider: AuthProvider;
    isAnonymous: boolean;
    createdAt: number;
}

export type AuthProvider = 'email' | 'google' | 'guest';

export interface AuthState {
    user: User | null;
    loading: boolean;
    initialized: boolean;
}

export interface NicknameData {
    nickname: string;
    avatar: string | null;
    updatedAt: number;
}
