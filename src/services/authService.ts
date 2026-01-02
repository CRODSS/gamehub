import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    signInAnonymously,
    GoogleAuthProvider,
    linkWithCredential,
    EmailAuthProvider,
    signOut as firebaseSignOut,
} from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';
import { ref, set, get } from 'firebase/database';
import { auth, db } from '../config/firebase';
import type { User, AuthProvider, NicknameData } from '../types/user';

const googleProvider = new GoogleAuthProvider();

/**
 * Converts Firebase User to our User type
 */
const mapFirebaseUser = async (firebaseUser: FirebaseUser): Promise<User> => {
    const nicknameRef = ref(db, `users/${firebaseUser.uid}/profile`);
    const nicknameSnapshot = await get(nicknameRef);
    const nicknameData = nicknameSnapshot.val() as NicknameData | null;

    let provider: AuthProvider = 'email';
    if (firebaseUser.isAnonymous) {
        provider = 'guest';
    } else if (firebaseUser.providerData[0]?.providerId === 'google.com') {
        provider = 'google';
    }

    return {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        nickname: nicknameData?.nickname || null,
        avatar: nicknameData?.avatar || null,
        provider,
        isAnonymous: firebaseUser.isAnonymous,
        createdAt: firebaseUser.metadata.creationTime
            ? new Date(firebaseUser.metadata.creationTime).getTime()
            : Date.now(),
    };
};

/**
 * Register with email and password
 */
export const registerWithEmail = async (
    email: string,
    password: string
): Promise<User> => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return mapFirebaseUser(userCredential.user);
};

/**
 * Sign in with email and password
 */
export const signInWithEmail = async (
    email: string,
    password: string
): Promise<User> => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return mapFirebaseUser(userCredential.user);
};

/**
 * Sign in with Google
 */
export const signInWithGoogle = async (): Promise<User> => {
    const userCredential = await signInWithPopup(auth, googleProvider);
    return mapFirebaseUser(userCredential.user);
};

/**
 * Sign in anonymously (Guest)
 */
export const signInAsGuest = async (): Promise<User> => {
    const userCredential = await signInAnonymously(auth);
    return mapFirebaseUser(userCredential.user);
};

/**
 * Link anonymous account to email
 */
export const linkGuestToEmail = async (
    email: string,
    password: string
): Promise<User> => {
    if (!auth.currentUser || !auth.currentUser.isAnonymous) {
        throw new Error('No anonymous user to link');
    }

    const credential = EmailAuthProvider.credential(email, password);
    const userCredential = await linkWithCredential(auth.currentUser, credential);
    return mapFirebaseUser(userCredential.user);
};

/**
 * Save nickname to database
 */
export const saveNickname = async (
    uid: string,
    nickname: string,
    avatar: string | null = null
): Promise<void> => {
    const nicknameData: NicknameData = {
        nickname,
        avatar,
        updatedAt: Date.now(),
    };

    const userRef = ref(db, `users/${uid}/profile`);
    await set(userRef, nicknameData);
};

/**
 * Sign out
 */
export const signOut = async (): Promise<void> => {
    await firebaseSignOut(auth);
};

/**
 * Get current user
 */
export const getCurrentUser = (): FirebaseUser | null => {
    return auth.currentUser;
};
