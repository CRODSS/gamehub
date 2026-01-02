import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    signInWithPopup,
    signInAnonymously,
    signOut,
    onAuthStateChanged
} from 'firebase/auth';
import { ref, set, get, serverTimestamp } from 'firebase/database';
import { auth, googleProvider, db } from '../config/firebase';
import type { UserProfile } from '../types/index.ts';

interface AuthContextType {
    user: UserProfile | null;
    loading: boolean;
    loginWithGoogle: () => Promise<void>;
    loginAsGuest: (nickname: string) => Promise<void>;
    logout: () => Promise<void>;
    updateProfile: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    // Uygulama açıldığında oturum kontrolü yap
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                // Kullanıcı giriş yapmış, veritabanından profilini çek
                const userRef = ref(db, `users/${firebaseUser.uid}`);
                const snapshot = await get(userRef);

                if (snapshot.exists()) {
                    setUser(snapshot.val());
                } else {
                    // Profil yoksa (örn: Google ile ilk giriş), temel profil oluştur
                    const newUser: UserProfile = {
                        uid: firebaseUser.uid,
                        nickname: firebaseUser.displayName || 'Misafir',
                        avatarUrl: firebaseUser.photoURL || undefined,
                        isGuest: firebaseUser.isAnonymous,
                        stats: { gamesPlayed: 0, wins: 0 }
                    };
                    // Veritabanına kaydet
                    await set(userRef, { ...newUser, lastSeen: serverTimestamp() });
                    setUser(newUser);
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const loginWithGoogle = async () => {
        try {
            await signInWithPopup(auth, googleProvider);
            // onAuthStateChanged yukarıda gerisini halledecek
        } catch (error) {
            console.error("Google Login Hatası:", error);
            throw error;
        }
    };

    const loginAsGuest = async (nickname: string) => {
        try {
            const result = await signInAnonymously(auth);
            // Misafir için profil oluştur ve kaydet
            const newUser: UserProfile = {
                uid: result.user.uid,
                nickname: nickname,
                isGuest: true,
                stats: { gamesPlayed: 0, wins: 0 }
            };

            const userRef = ref(db, `users/${result.user.uid}`);
            await set(userRef, { ...newUser, createdAt: serverTimestamp() });
            setUser(newUser); // State'i manuel güncelle (hız için)
        } catch (error) {
            console.error("Misafir Login Hatası:", error);
            throw error;
        }
    };

    const logout = async () => {
        await signOut(auth);
        setUser(null);
    };

    const updateProfile = async (data: Partial<UserProfile>) => {
        if (!user) return;

        const userRef = ref(db, `users/${user.uid}`);
        const updatedUser = { ...user, ...data };

        await set(userRef, updatedUser);
        setUser(updatedUser);
    };

    return (
        <AuthContext.Provider value={{ user, loading, loginWithGoogle, loginAsGuest, logout, updateProfile }}>
            {children}
        </AuthContext.Provider>
    );
};