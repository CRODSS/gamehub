import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import { useAuth } from '../contexts/AuthContext';
import { ref, onValue, update, get } from 'firebase/database';
import { db } from '../config/firebase';
import { GAME_CATEGORIES } from '../data/gameData';
import { Clock, EyeOff, Target, AlertTriangle } from 'lucide-react';

interface GameState {
    roles: Record<string, 'spy' | 'innocent'>;
    secretWord: string;
    winner?: 'spy' | 'innocents' | null;
    votingOpen?: boolean;
    votes?: Record<string, string>; // voterId -> suspectId
    spyGuesses?: Record<string, string>; // spyId -> guessedWord
    startTime?: number;
}

interface RoomData {
    hostId: string;
    settings: {
        timeLimit: number;
        categoryId: string;
        showCheatSheet: boolean;
        maxPlayers: number;
        spyCount?: number;
        scores?: {
            innocentWin: number;
            spyGuessWin: number;
            spyVoteWin: number;
        };
    };
    gameState: GameState;
    players: Record<string, { nickname: string; avatarUrl?: string; score?: number }>;
}

const GamePage: React.FC = () => {
    const { roomId } = useParams<{ roomId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [roomData, setRoomData] = useState<RoomData | null>(null);
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [isCardFlipped, setIsCardFlipped] = useState(false);
    const [loading, setLoading] = useState(true);
    const [voteModalOpen, setVoteModalOpen] = useState(false);
    const [guessModalOpen, setGuessModalOpen] = useState(false);

    // Monitor Spy Guesses for Resolution
    useEffect(() => {
        if (!roomData?.gameState.roles || !roomData.gameState.spyGuesses || roomData.gameState.winner) return;

        const allSpies = Object.entries(roomData.gameState.roles)
            .filter(([, role]) => role === 'spy')
            .map(([uid]) => uid);

        const guesses = roomData.gameState.spyGuesses || {};
        const totalGuesses = Object.keys(guesses).length;

        console.log("Spy Resolution Check:", {
            totalSpies: allSpies.length,
            guessesMade: totalGuesses,
            spies: allSpies,
            guesses: guesses
        });

        // If all spies have guessed
        if (totalGuesses > 0 && totalGuesses >= allSpies.length) {
            // Only Host resolves
            if (user?.uid === roomData.hostId) {
                resolveSpyWin(guesses, allSpies);
            }
        }
    }, [roomData?.gameState.spyGuesses, roomData?.gameState.roles, roomData?.gameState.winner]);

    const resolveSpyWin = async (guesses: Record<string, string>, spyIds: string[]) => {
        const secretWord = roomData?.gameState.secretWord;

        // Condition: ALL spies must match the secret word
        const allCorrect = spyIds.every(uid => guesses[uid] === secretWord);

        console.log("Resolving Spy Win:", { allCorrect, guesses, secretWord });

        if (allCorrect) {
            await endGame('spy', 'spy_guess_win');
        } else {
            await endGame('innocents', 'spy_guess_fail');
        }
    };

    const handleSpyGuess = async (guess: string) => {
        if (!roomData || !user || !roomId) return;

        await update(ref(db), {
            [`rooms/${roomId}/gameState/spyGuesses/${user.uid}`]: guess
        });

        // Close modal after guessing
        setGuessModalOpen(false);
    };

    useEffect(() => {
        if (!roomId || !user) return;

        const roomRef = ref(db, `rooms/${roomId}`);
        const unsubscribe = onValue(roomRef, (snapshot) => {
            const data = snapshot.val();
            if (!data) {
                navigate('/');
                return;
            }
            // Auto-redirect to lobby for new game if status changes back to 'waiting'?
            if (data.status === 'waiting') {
                navigate(`/lobby/${roomId}`);
                return;
            }

            setRoomData(data);

            // Initialize Timer if not currently running (and no winner)
            if (timeLeft === null && data.settings?.timeLimit && !data.gameState.winner) {
                setTimeLeft(data.settings.timeLimit * 60);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [roomId, user, navigate]);

    // Timer Logic
    useEffect(() => {
        if (timeLeft === null || timeLeft <= 0 || roomData?.gameState.winner) return;

        const timer = setInterval(() => {
            setTimeLeft((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, roomData?.gameState.winner]);

    // Format Time
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // --- Actions ---

    // START VOTE
    const handleStartVote = async () => {
        if (!roomId) return;
        await update(ref(db, `rooms/${roomId}/gameState`), {
            votingOpen: true,
            votes: null // clear previous votes
        });
    };

    // CAST VOTE
    const handleVote = async (suspectId: string) => {
        if (!roomId || !user) return;

        await update(ref(db), {
            [`rooms/${roomId}/gameState/votes/${user.uid}`]: suspectId
        });
    };

    // Monitor Votes for Resolution
    useEffect(() => {
        if (!roomData?.gameState.votingOpen || !roomData.players || !roomData.gameState.votes) return;

        const playerIds = Object.keys(roomData.players);
        const votes = roomData.gameState.votes;
        const totalVotes = Object.keys(votes).length;

        // If everyone voted
        if (totalVotes === playerIds.length) {
            // Only Host resolves to avoid race conditions
            if (user?.uid === roomData.hostId) {
                resolveVoting(votes);
            }
        }
    }, [roomData?.gameState.votes, roomData?.players]);

    const resolveVoting = async (votes: Record<string, string>) => {
        const voteCounts: Record<string, number> = {};
        Object.values(votes).forEach(suspect => {
            voteCounts[suspect] = (voteCounts[suspect] || 0) + 1;
        });

        // Find suspect with max votes
        const sorted = Object.entries(voteCounts).sort(([, a], [, b]) => b - a);
        const [suspectId,] = sorted[0];

        const suspectRole = roomData?.gameState.roles[suspectId];

        if (suspectRole === 'spy') {
            await endGame('innocents', 'vote_spy_found');
        } else {
            await endGame('spy', 'vote_wrong_innocent');
        }

        if (roomId) {
            await update(ref(db, `rooms/${roomId}/gameState`), { votingOpen: false });
        }
    };

    type WinReason = 'spy_guess_win' | 'spy_guess_fail' | 'vote_spy_found' | 'vote_wrong_innocent';

    const endGame = async (winner: 'spy' | 'innocents', reason: WinReason) => {
        if (!roomId || !roomData) return;

        // Calculate Scores
        const updates: any = {};
        updates[`rooms/${roomId}/gameState/winner`] = winner;
        updates[`rooms/${roomId}/gameState/votingOpen`] = false;

        let points = 0;
        const s = roomData.settings.scores || { innocentWin: 10, spyGuessWin: 20, spyVoteWin: 15 };

        if (winner === 'spy') {
            if (reason === 'spy_guess_win') points = s.spyGuessWin || 20;
            else points = s.spyVoteWin || 15;
        } else {
            points = s.innocentWin || 10;
        }

        const winningRole = winner === 'spy' ? 'spy' : 'innocent';

        try {
            const playersRef = ref(db, `rooms/${roomId}/players`);
            const snapshot = await get(playersRef);
            const players = snapshot.val() || {};

            Object.entries(roomData.gameState.roles).forEach(([uid, role]) => {
                if (role === winningRole) {
                    const currentScore = players[uid]?.score || 0;
                    updates[`rooms/${roomId}/players/${uid}/score`] = currentScore + points;
                }
            });

            await update(ref(db), updates);
        } catch (error) {
            console.error("Error ending game:", error);
            await update(ref(db), { [`rooms/${roomId}/gameState/winner`]: winner });
        }
    };

    const handleNextRound = async () => {
        if (!roomId || !roomData) return;

        // Pick new word
        const categoryId = roomData.settings.categoryId;
        const category = GAME_CATEGORIES.find(c => c.id === categoryId);
        const words = category?.items || ["Bilinmiyor"];
        const secretWord = words[Math.floor(Math.random() * words.length)];

        // Re-assign roles (Simple shuffle)
        const playerIds = Object.keys(roomData.players);
        const spyCount = roomData.settings.spyCount || 1;
        const roles: Record<string, 'spy' | 'innocent'> = {};

        for (let i = playerIds.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [playerIds[i], playerIds[j]] = [playerIds[j], playerIds[i]];
        }

        playerIds.forEach((uid, index) => {
            roles[uid] = index < spyCount ? 'spy' : 'innocent';
        });

        await update(ref(db, `rooms/${roomId}/gameState`), {
            roles: roles,
            secretWord: secretWord,
            winner: null,
            spyGuesses: null,
            startTime: Date.now(),
            votingOpen: false,
            votes: null
        });

        setTimeLeft(roomData.settings.timeLimit * 60);
        setIsCardFlipped(false);
        setVoteModalOpen(false);
    };

    const handleNewGame = async () => {
        if (!roomId || !roomData) return;

        // Reset scores
        const updates: any = {};
        Object.keys(roomData.players).forEach(uid => {
            updates[`rooms/${roomId}/players/${uid}/score`] = 0;
        });

        // Reset Game State to initial 'waiting' like state
        updates[`rooms/${roomId}/gameState`] = {
            roles: {}, // Changed from null to empty object or just keep structure but empty
            secretWord: "",
            winner: null,
            spyGuesses: null,
            votingOpen: false,
            votes: null,
            startTime: null
        };
        updates[`rooms/${roomId}/status`] = 'waiting';

        await update(ref(db), updates);

        // Navigate everyone to Lobby to pick new settings
        navigate(`/lobby/${roomId}`);
    };


    if (loading || !roomData || !user) {
        return (
            <MainLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                </div>
            </MainLayout>
        );
    }

    const myRole = roomData.gameState.roles?.[user.uid];
    const isSpy = myRole === 'spy';
    const isHost = user.uid === roomData.hostId;

    const category = GAME_CATEGORIES.find(c => c.id === roomData.settings.categoryId);
    const categoryItems = category?.items || [];
    const otherSpies = Object.entries(roomData.gameState.roles)
        .filter(([uid, role]) => role === 'spy' && uid !== user.uid)
        .map(([uid]) => roomData.players[uid]?.nickname);

    // Check if I have guessed
    const myGuess = roomData.gameState.spyGuesses?.[user.uid];
    const showCheatSheet = isSpy;

    // Debug Data (Calculated)
    const debugAllSpies = Object.entries(roomData.gameState.roles)
        .filter(([, role]) => role === 'spy').length;
    const debugTotalGuesses = Object.keys(roomData.gameState.spyGuesses || {}).length;

    return (
        <MainLayout>
            <div className={`max-w-4xl mx-auto space-y-8 pb-32 pt-10 ${voteModalOpen || guessModalOpen || roomData.gameState.winner ? 'blur-sm pointer-events-none' : ''}`}>

                {/* Timer Header */}
                <div className="flex justify-center sticky top-20 z-10">
                    <div className="bg-gray-900/90 backdrop-blur text-white px-8 py-4 rounded-2xl shadow-xl flex items-center gap-4 border border-gray-700">
                        <Clock className={timeLeft && timeLeft < 60 ? "text-red-500 animate-pulse" : "text-purple-400"} />
                        <span className={`text-3xl font-mono font-bold ${timeLeft && timeLeft < 60 ? "text-red-500" : ""}`}>
                            {timeLeft !== null ? formatTime(timeLeft) : '--:--'}
                        </span>
                    </div>
                </div>

                {isHost && (
                    <div className="text-center bg-yellow-100 p-2 rounded text-xs text-yellow-800">
                        Host Debug: Spies: {debugAllSpies} | Guesses: {debugTotalGuesses} | SettingsSpyCount: {roomData.settings.spyCount}
                    </div>
                )}

                {/* Role Card */}
                <div className="flex justify-center perspective-1000 z-10">
                    <div className="relative group w-full max-w-sm h-[480px]">
                        <div className={`relative w-full h-full transition-all duration-700 transform-style-3d ${isCardFlipped ? 'rotate-y-180' : ''}`}>
                            {/* Front of Card */}
                            <div
                                onClick={() => setIsCardFlipped(true)}
                                className="absolute inset-0 w-full h-full backface-hidden rounded-3xl cursor-pointer shadow-2xl hover:shadow-purple-500/50 transition-all duration-300"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-[#1a1c2c] to-[#4a192c] rounded-3xl overflow-hidden border border-white/10">
                                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
                                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>

                                    <div className="relative h-full flex flex-col items-center justify-center text-center p-8">
                                        <div className="w-24 h-24 mb-8 relative">
                                            <div className="absolute inset-0 bg-gradient-to-tr from-purple-500 to-pink-500 rounded-2xl rotate-6 opacity-75 blur-lg"></div>
                                            <div className="relative bg-white dark:bg-gray-800 w-full h-full rounded-2xl flex items-center justify-center shadow-inner border border-white/20">
                                                <span className="text-5xl">🕵️</span>
                                            </div>
                                        </div>

                                        <h2 className="text-4xl font-black text-white mb-2 tracking-tight">KİMLİK</h2>
                                        <p className="text-purple-200 font-medium mb-8">Görmek için dokun</p>

                                        <div className="animate-bounce bg-white/10 backdrop-blur-md px-6 py-2 rounded-full border border-white/10">
                                            <span className="text-sm font-bold text-white">👆 DOKUN</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Back of Card */}
                            <div
                                onClick={() => setIsCardFlipped(false)}
                                className={`absolute inset-0 w-full h-full backface-hidden rotate-y-180 rounded-3xl shadow-xl overflow-hidden cursor-pointer border-4 ${isSpy ? 'border-red-500' : 'border-green-500'}`}
                            >
                                <div className={`absolute inset-0 ${isSpy ? 'bg-gradient-to-br from-red-950 via-black to-red-900' : 'bg-gradient-to-br from-green-950 via-black to-emerald-900'}`}>
                                    {/* Pattern Overlay */}
                                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>

                                    {/* Content */}
                                    <div className="relative h-full flex flex-col items-center p-8">
                                        {/* Header Icon */}
                                        <div className="mt-4 mb-6">
                                            {isSpy ? (
                                                <div className="relative">
                                                    <div className="w-20 h-20 bg-red-600/20 rounded-full flex items-center justify-center animate-ping absolute inset-0"></div>
                                                    <div className="w-20 h-20 bg-gradient-to-br from-red-600 to-red-800 rounded-full flex items-center justify-center shadow-lg shadow-red-500/50 border-2 border-red-400 relative z-10">
                                                        <EyeOff size={32} className="text-white" />
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-700 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30 border-2 border-green-400">
                                                    <span className="text-4xl">📍</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Status Text */}
                                        <div className="text-center mb-8">
                                            <h2 className={`text-4xl font-black tracking-widest uppercase mb-2 ${isSpy ? 'text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'text-green-400 drop-shadow-[0_0_10px_rgba(74,222,128,0.5)]'}`}>
                                                {isSpy ? 'CASUS' : 'MASUM'}
                                            </h2>
                                            <p className={`text-sm font-bold uppercase tracking-wider ${isSpy ? 'text-red-300' : 'text-green-300/80'}`}>
                                                {isSpy ? 'GÖREV: ÇAKTIRMA!' : 'GÖREV: CASUSU BUL'}
                                            </p>
                                        </div>

                                        {/* Secret Info Box */}
                                        <div className={`w-full p-6 rounded-2xl backdrop-blur-md border ${isSpy ? 'bg-red-500/10 border-red-500/30' : 'bg-green-500/10 border-green-500/30'} flex flex-col items-center justify-center flex-1 max-h-[160px]`}>
                                            {isSpy ? (
                                                <div className="text-center w-full">
                                                    <p className="text-xs text-red-400 uppercase font-bold mb-2">HEDEF</p>
                                                    <p className="text-xl font-bold text-white mb-4 animate-pulse">MEKANI TAHMİN ET</p>
                                                    {otherSpies.length > 0 && (
                                                        <div className="pt-3 border-t border-red-500/20 w-full">
                                                            <p className="text-[10px] text-red-400/70 uppercase">ORTAKLARIN</p>
                                                            <p className="text-sm font-bold text-red-200">{otherSpies.join(', ')}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="text-center">
                                                    <p className="text-xs text-green-400 uppercase font-bold mb-1">{category?.objectLabel || 'MEKAN'}</p>
                                                    <h3 className="text-2xl font-black text-white tracking-wide animate-pulse">{roomData.gameState.secretWord}</h3>
                                                </div>
                                            )}
                                        </div>

                                        {/* Footer Hint */}
                                        <div className="mt-auto pt-6 text-center w-full">
                                            <button
                                                className="w-full py-3 bg-black/40 hover:bg-black/60 rounded-xl text-white/50 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest border border-white/5"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setIsCardFlipped(false);
                                                }}
                                            >
                                                GİZLEMEK İÇİN DOKUN
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-center pt-4">
                    {isSpy ? (
                        // Update Button to show guessed status
                        <button
                            disabled={!!myGuess}
                            onClick={() => setGuessModalOpen(true)}
                            className={`font-bold py-4 px-8 rounded-xl shadow-lg flex items-center gap-2 transition transform hover:scale-105 ${myGuess
                                ? 'bg-gray-500 cursor-not-allowed opacity-75 text-white'
                                : 'bg-purple-600 hover:bg-purple-700 text-white'
                                }`}
                        >
                            <Target size={24} />
                            {myGuess ? 'TAHMİN ALINDI' : `${category?.objectLabel?.toUpperCase() || 'MEKAN'}I TAHMİN ET`}
                        </button>
                    ) : (
                        <button
                            onClick={handleStartVote}
                            className="bg-red-500 hover:bg-red-600 text-white font-bold py-4 px-8 rounded-xl shadow-lg flex items-center gap-2 transition transform hover:scale-105"
                        >
                            <AlertTriangle size={24} />
                            ACİL DURUM / OYLAMA
                        </button>
                    )}
                </div>

                {/* Cheat Sheet / Grid */}
                {showCheatSheet && (
                    <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-xl border border-gray-200 dark:border-gray-700">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <span>{category?.icon}</span> Olası {category?.name || 'Seçenekler'}
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {categoryItems.map((item) => (
                                <div
                                    key={item}
                                    className={`p-3 rounded-xl text-sm font-medium text-center border ${isSpy && myGuess === item
                                        ? 'bg-purple-600 text-white border-purple-500 ring-2 ring-purple-300'
                                        : 'bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 border-gray-100 dark:border-gray-600'
                                        }`}
                                >
                                    {item}
                                </div>
                            ))}
                        </div>
                        {isSpy && (
                            <p className="text-center text-xs text-purple-500 mt-4 font-bold">
                                {myGuess
                                    ? `Tahminin (${myGuess}) alındı. Diğer casuslar bekleniyor.`
                                    : 'CASUS İPUCU: Tahmin etmek için yukarıdaki butonu kullan.'}
                            </p>
                        )}
                    </div>
                )}
            </div>

            {/* Voting Modal */}
            {roomData.gameState.votingOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg overflow-hidden border border-gray-700 shadow-2xl animate-scale-in">
                        <div className="p-6">
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                                <span className="animate-pulse">🚨</span> Oylama Başladı
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400 mb-6">
                                Herkes oy kullanmalı! Çoğunluk kararına göre biri elenecek.
                            </p>

                            <div className="grid grid-cols-2 gap-3 mb-6">
                                {Object.entries(roomData.players).map(([uid, player]) => {
                                    const hasVoted = roomData.gameState.votes?.[user.uid];
                                    const isSelected = hasVoted === uid;

                                    return (
                                        <button
                                            key={uid}
                                            disabled={roomData.gameState.votes?.[user.uid] !== undefined} // Disable after voting
                                            onClick={() => handleVote(uid)}
                                            className={`p-4 rounded-xl flex items-center gap-3 transition-all ${isSelected
                                                ? 'bg-purple-600 text-white ring-4 ring-purple-300'
                                                : hasVoted
                                                    ? 'bg-gray-100 dark:bg-gray-800 opacity-50 cursor-not-allowed'
                                                    : 'bg-gray-100 dark:bg-gray-700 hover:bg-red-500 hover:text-white cursor-pointer hover:scale-105'
                                                }`}
                                        >
                                            <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 overflow-hidden">
                                                {player.avatarUrl ? (
                                                    <img src={player.avatarUrl} alt={player.nickname} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center font-bold text-gray-500">
                                                        {player.nickname.substring(0, 2).toUpperCase()}
                                                    </div>
                                                )}
                                            </div>
                                            <span className="font-bold truncate">{player.nickname}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="text-center text-sm font-bold text-purple-600 dark:text-purple-400">
                                {Object.keys(roomData.gameState.votes || {}).length} / {Object.keys(roomData.players).length} kişi oy kullandı.
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Spy Guess Modal */}
            {guessModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-2xl overflow-hidden border border-gray-700 shadow-2xl h-[80vh] flex flex-col animate-slide-up">
                        <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Target className="text-purple-600" />
                                {category?.objectLabel || 'Mekan'}ı Tahmin Et
                            </h3>
                            <p className="text-red-500 font-bold text-sm mt-2 flex items-center gap-1">
                                <span>⚠️</span>
                                BU İŞLEM GERİ ALINAMAZ! Bir seçim yapmak zorundasın.
                            </p>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1 bg-gray-100/50 dark:bg-gray-800">
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {categoryItems.map((item) => (
                                    <button
                                        key={item}
                                        onClick={() => {
                                            handleSpyGuess(item);
                                            setGuessModalOpen(false);
                                        }}
                                        className="p-4 rounded-xl bg-white dark:bg-gray-700 hover:bg-purple-600 hover:text-white transition-all text-sm font-bold text-gray-700 dark:text-gray-300 shadow-sm hover:shadow-lg border border-transparent hover:border-purple-400 group"
                                    >
                                        <span className="group-hover:scale-105 block transition-transform">{item}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Game Over Modal */}
            {roomData.gameState.winner && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-lg text-center overflow-hidden border border-gray-700 shadow-2xl relative animate-scale-in">
                        {/* Winner Banner */}
                        <div className={`h-3 w-full ${roomData.gameState.winner === 'spy' ? 'bg-gradient-to-r from-red-500 via-orange-500 to-red-500' : 'bg-gradient-to-r from-green-500 via-emerald-500 to-green-500'}`}></div>

                        <div className="p-8">
                            <div className="text-7xl mb-6 animate-bounce">
                                {roomData.gameState.winner === 'spy' ? '🕵️‍♂️' : '🏆'}
                            </div>

                            <h2 className={`text-4xl font-black mb-2 uppercase tracking-tight ${roomData.gameState.winner === 'spy' ? 'text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-600' : 'text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-emerald-600'}`}>
                                {roomData.gameState.winner === 'spy' ? 'CASUS KAZANDI!' : 'MASUMLAR KAZANDI!'}
                            </h2>

                            <p className="text-gray-500 dark:text-gray-300 text-lg mb-8 font-medium">
                                {roomData.gameState.winner === 'spy'
                                    ? 'Casus mekanı doğru tahmin etti veya masumlar yanlış kişiyi suçladı.'
                                    : 'Casus yakalandı veya süre doldu.'
                                }
                            </p>

                            <div className="bg-gray-100 dark:bg-gray-700/50 p-6 rounded-2xl mb-8 border border-gray-200 dark:border-gray-600 relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">GİZLİ MEKAN</p>
                                <p className="text-3xl font-black text-gray-900 dark:text-white tracking-wide">{roomData.gameState.secretWord}</p>
                            </div>

                            {/* Scoreboard */}
                            <div className="mb-8">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center justify-center gap-2">
                                    <span>📊</span> Puan Durumu
                                </h3>
                                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 max-h-48 overflow-y-auto">
                                    {Object.entries(roomData.players)
                                        .sort(([, a], [, b]) => (b.score || 0) - (a.score || 0))
                                        .map(([uid, player], index) => (
                                            <div key={uid} className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 last:border-0 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <span className={`font-mono font-bold w-6 ${index === 0 ? 'text-yellow-500 text-xl' : 'text-gray-400'}`}>{index === 0 ? '🥇' : `${index + 1}.`}</span>
                                                    <span className="font-bold text-gray-700 dark:text-gray-300">{player.nickname}</span>
                                                    {roomData.gameState.roles[uid] === 'spy' && <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold uppercase">Casus</span>}
                                                </div>
                                                <span className="font-bold text-purple-600 bg-purple-100 dark:bg-purple-900/30 px-2 py-0.5 rounded-lg">{player.score || 0} P</span>
                                            </div>
                                        ))}
                                </div>
                            </div>

                            {/* Host Actions */}
                            {isHost && (
                                <div className="flex gap-3">
                                    <button
                                        onClick={handleNewGame}
                                        className="flex-1 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-xl font-bold transition-colors"
                                    >
                                        Yeni Oyun (Sıfırla)
                                    </button>
                                    <button
                                        onClick={handleNextRound}
                                        className="flex-[2] py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow-lg hover:shadow-purple-500/30 transition-all transform hover:scale-[1.02]"
                                    >
                                        SONRAKİ TUR ➡️
                                    </button>
                                </div>
                            )}

                            {!isHost && (
                                <div className="text-gray-400 text-sm animate-pulse">
                                    Host'un yeni turu başlatması bekleniyor...
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}


        </MainLayout >
    );
};

export default GamePage;
