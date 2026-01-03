import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ref, set, onValue, remove, get, push, update } from 'firebase/database';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import MainLayout from '../components/layout/MainLayout';
import { User, Shield, Scroll } from 'lucide-react';

// --- Icons & Components ---
const DiceIcon = ({ sides, className = "w-6 h-6" }: { sides: number, className?: string }) => {
    switch (sides) {
        case 4:
            return (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
                    <path d="M12 2L2 22h20L12 2z" />
                    <path d="M12 2v20" />
                </svg>
            );
        case 6:
            return (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8" cy="8" r="1.5" className="fill-current" />
                    <circle cx="16" cy="16" r="1.5" className="fill-current" />
                    <circle cx="16" cy="8" r="1.5" className="fill-current" />
                    <circle cx="8" cy="16" r="1.5" className="fill-current" />
                    <circle cx="12" cy="12" r="1.5" className="fill-current" />
                </svg>
            );
        case 8:
            return (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
                    <path d="M12 2l10 10-10 10L2 12z" />
                    <path d="M12 2v20" />
                    <path d="M2 12h20" />
                </svg>
            );
        case 10:
            return (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
                    <path d="M12 2L2 12l10 10 10-10z" />
                    <path d="M12 2v20" />
                    <path d="M2 12h20" />
                </svg>
            );
        case 12:
            return (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
                    <path d="M12 2l2.5 7h7.5l-6 5 2.5 7-6-4.5-6 4.5 2.5-7-6-5h7.5z" /> {/* Simplified Pentagonal */}
                    <circle cx="12" cy="12" r="9" />
                </svg>
            );
        case 20:
        default:
            return (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
                    <path d="M12 2L3 8v8l9 6 9-6V8l-9-6z" />
                    <path d="M3 8h18" />
                    <path d="M12 2v20" />
                    <path d="M12 11l9-6" />
                    <path d="M12 11L3 2" />
                </svg>
            );
    }
};

const RollingOverlay = ({ sides, result, onClose }: { sides: number, result: number, onClose: () => void }) => {
    // 1.5 saniye sonra kapat
    useEffect(() => {
        const timer = setTimeout(onClose, 2000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
            <div className="relative flex flex-col items-center justify-center">
                <div className="animate-dice-roll relative">
                    <DiceIcon sides={sides} className="w-64 h-64 text-white drop-shadow-[0_0_50px_rgba(255,255,255,0.5)] fill-black/50" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-8xl font-black text-white drop-shadow-lg opacity-0 animate-[fadeIn_0.5s_ease-out_1s_forwards]">
                            {result}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Character Stats
interface CharacterStats {
    str: number;
    dex: number;
    con: number;
    int: number;
    wis: number;
    cha: number;
}

// Ability Data
interface Ability {
    id: string;
    name: string;
    description: string;
    damageType: string; // e.g., "1d8+3", "2d6"
    maxUsesPerDay: number;
}

// Item Data
interface Item {
    id: string;
    name: string;
    type: 'weapon' | 'armor' | 'potion' | 'misc';
    description: string;
    effect?: string; // e.g., "heal:2d4+2" or "dmg:1d8"
    quantity: number;
}

// Character Data
interface Character {
    name: string;
    race: Race;
    class: CharacterClass;
    maxHp: number;
    currentHp: number;
    stats: CharacterStats;
    armorClass?: number;
    abilities?: Ability[];
    abilityUsage?: { [abilityId: string]: number };
    inventory?: Item[];
    gold?: number;
    xp?: number;
    level?: number;
}

// Player in Lobby
interface Player {
    displayName: string;
    joinedAt: number;
    character?: Character | null;
}

// Monster Data
interface Monster {
    id: string;
    name: string;
    description: string;
    maxHp: number;
    currentHp: number;
    abilities?: Ability[];
}

// Log Entry
interface LogEntry {
    id: string;
    sender: string;
    type: 'dice' | 'damage' | 'heal' | 'monster' | 'system';
    detail: string;
    value?: number;
    timestamp: number;
}

// Chat Message
interface ChatMessage {
    id: string;
    senderId: string;
    senderName: string;
    recipientId?: string; // If set, this is a private whisper
    content: string;
    timestamp: number;
    type: 'public' | 'whisper' | 'system';
}

// Lobby Data
interface Lobby {
    dm: string;
    players: { [userId: string]: Player };
    monsters?: { [monsterId: string]: Monster };
    logs?: { [logId: string]: LogEntry };
    chat?: { [messageId: string]: ChatMessage };
    xpSettings?: {
        levelUpThreshold: number;
    };
    currentDay: number;
    createdAt: number;
    status: 'waiting' | 'playing' | 'finished';
}

// Race and Class Types
type Race = 'Human' | 'Elf' | 'Dwarf' | 'Halfling' | 'Orc' | 'Tiefling' | 'Dragonborn' | 'Gnome';
type CharacterClass = 'Fighter' | 'Wizard' | 'Rogue' | 'Cleric' | 'Paladin' | 'Ranger' | 'Bard' | 'Necromancer' | 'Druid' | 'Barbarian' | 'Monk' | 'Sorcerer' | 'Warlock';

// Race and Class Options
const RACES: Race[] = ['Human', 'Elf', 'Dwarf', 'Halfling', 'Orc', 'Tiefling', 'Dragonborn', 'Gnome'];
const CLASSES: CharacterClass[] = ['Fighter', 'Wizard', 'Rogue', 'Cleric', 'Paladin', 'Ranger', 'Bard', 'Necromancer', 'Druid', 'Barbarian', 'Monk', 'Sorcerer', 'Warlock'];

const DNDGamePage: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [lobbyId, setLobbyId] = useState<string>('');
    const [currentLobby, setCurrentLobby] = useState<string | null>(null);
    const [lobbyData, setLobbyData] = useState<Lobby | null>(null);
    const [joinLobbyInput, setJoinLobbyInput] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);

    // Dice Animation State
    const [rollingDice, setRollingDice] = useState<{ sides: number, result: number } | null>(null);

    // Character Creation State
    const [characterTab, setCharacterTab] = useState<'custom' | 'preset'>('custom');
    const [characterName, setCharacterName] = useState<string>('');
    const [selectedRace, setSelectedRace] = useState<Race>('Human');
    const [selectedClass, setSelectedClass] = useState<CharacterClass>('Fighter');
    const [maxHp, setMaxHp] = useState<number>(30);
    const [armorClass, setArmorClass] = useState<number>(10);
    const [stats, setStats] = useState<CharacterStats>({
        str: 10,
        dex: 10,
        con: 10,
        int: 10,
        wis: 10,
        cha: 10
    });

    // Combat State (DM)
    const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
    const [selectedMonsterIds, setSelectedMonsterIds] = useState<string[]>([]);
    const [damageAmount, setDamageAmount] = useState<number>(0);
    const [showAddMonster, setShowAddMonster] = useState<boolean>(false);
    const [newMonsterName, setNewMonsterName] = useState<string>('');
    const [newMonsterDescription, setNewMonsterDescription] = useState<string>('');
    const [newMonsterMaxHp, setNewMonsterMaxHp] = useState<number>(20);

    // Monster Ability Creation State
    const [showAddMonsterAbility, setShowAddMonsterAbility] = useState<string | null>(null); // Monster ID
    const [newMonsterAbilityName, setNewMonsterAbilityName] = useState<string>('');
    const [newMonsterAbilityDesc, setNewMonsterAbilityDesc] = useState<string>('');
    const [newMonsterAbilityDiceCount, setNewMonsterAbilityDiceCount] = useState<number>(1);
    const [newMonsterAbilityDiceType, setNewMonsterAbilityDiceType] = useState<number>(6);
    const [newMonsterAbilityModifier, setNewMonsterAbilityModifier] = useState<number>(0);

    // Log State
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const logContainerRef = useRef<HTMLDivElement>(null);

    // Ability State
    const [showAddAbility, setShowAddAbility] = useState<boolean>(false);
    const [newAbilityName, setNewAbilityName] = useState<string>('');
    const [newAbilityDescription, setNewAbilityDescription] = useState<string>('');
    const [newAbilityDiceCount, setNewAbilityDiceCount] = useState<number>(2);
    const [newAbilityDiceType, setNewAbilityDiceType] = useState<number>(6);
    const [newAbilityModifier, setNewAbilityModifier] = useState<number>(0);
    const [newAbilityMaxUses, setNewAbilityMaxUses] = useState<number>(3);
    const [selectedAbility, setSelectedAbility] = useState<Ability | null>(null);
    const [selectedTargetId, setSelectedTargetId] = useState<string>('');
    const [selectedTargetType, setSelectedTargetType] = useState<'player' | 'monster'>('monster');

    // Inventory State
    const [newItemName, setNewItemName] = useState<string>('');
    const [newItemType, setNewItemType] = useState<'weapon' | 'armor' | 'potion' | 'misc'>('misc');
    const [newItemDesc, setNewItemDesc] = useState<string>('');
    const [newItemEffect, setNewItemEffect] = useState<string>('');
    const [newItemQuantity, setNewItemQuantity] = useState<number>(1);
    const [newItemDiceCount, setNewItemDiceCount] = useState<number>(2);
    const [newItemDiceType, setNewItemDiceType] = useState<number>(4);
    const [newItemModifier, setNewItemModifier] = useState<number>(2);
    const [showAddItem, setShowAddItem] = useState<boolean>(false);

    // Chat State
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState<string>('');
    const [chatRecipientId, setChatRecipientId] = useState<string>(''); // '' = Public

    // XP State
    const [xpAmount, setXpAmount] = useState<number>(100);
    const [xpThresholdInput, setXpThresholdInput] = useState<number>(1000);

    // My Lobbies State
    const [myLobbies, setMyLobbies] = useState<Array<{ id: string, role: string, lastPlayed: number }>>([]);

    // Derived State
    const isDM = lobbyData?.dm === user?.uid;
    const myCharacter = user ? lobbyData?.players?.[user.uid]?.character : null;

    // Generate random 6-character lobby ID
    const generateLobbyId = (): string => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 6; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    };

    // Create new lobby (user becomes DM)
    const handleCreateLobby = async () => {
        if (!user) return;

        setIsLoading(true);
        setError('');

        try {
            const newLobbyId = generateLobbyId();
            const lobbyRef = ref(db, `dnd_lobbies/${newLobbyId}`);

            const newLobby: Lobby = {
                dm: user.uid,
                players: {},
                currentDay: 1,
                createdAt: Date.now(),
                status: 'waiting'
            };

            await set(lobbyRef, newLobby);

            // Add to My Lobbies
            const userLobbyRef = ref(db, `users/${user.uid}/my_lobbies/${newLobbyId}`);
            await set(userLobbyRef, {
                lobbyId: newLobbyId,
                createdAt: Date.now(),
                lastPlayed: Date.now(),
                role: 'dm'
            });

            setCurrentLobby(newLobbyId);
            setLobbyId(newLobbyId);
        } catch (err) {
            setError('Lobby oluşturulurken hata oluştu. Lütfen tekrar deneyin.');
            console.error('Error creating lobby:', err);
        } finally {
            setIsLoading(false);
        }
    };

    // Join existing lobby (user becomes Player)
    const handleJoinLobby = async () => {
        if (!user || !joinLobbyInput.trim()) {
            setError('Lütfen geçerli bir lobby ID girin.');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const lobbyRef = ref(db, `dnd_lobbies/${joinLobbyInput.toUpperCase()}`);
            const snapshot = await get(lobbyRef);

            if (!snapshot.exists()) {
                setError('Lobby bulunamadı. Lütfen ID\'yi kontrol edin.');
                setIsLoading(false);
                return;
            }

            const lobby = snapshot.val() as Lobby;

            // Check if user is already the DM
            if (lobby.dm === user.uid) {
                setError('Bu lobby\'nin sahibisiniz. Oyuncu olarak katılamazsınız.');
                setIsLoading(false);
                return;
            }

            // Check if player already exists (SAVE SYSTEM)
            const playerRef = ref(db, `dnd_lobbies/${joinLobbyInput.toUpperCase()}/players/${user.uid}`);
            const playerSnapshot = await get(playerRef);

            if (!playerSnapshot.exists()) {
                // New player - Create default entry
                await set(playerRef, {
                    displayName: user.nickname || 'Anonim Oyuncu',
                    joinedAt: Date.now(),
                    character: null
                });
            } else {
                // Return player - Update basic info but keep character
                await update(playerRef, {
                    displayName: user.nickname || 'Anonim Oyuncu', // Ensure name is up to date
                    lastSeen: Date.now()
                });
            }

            // Add to My Lobbies
            const userLobbyRef = ref(db, `users/${user.uid}/my_lobbies/${joinLobbyInput.toUpperCase()}`);
            await update(userLobbyRef, {
                lobbyId: joinLobbyInput.toUpperCase(),
                lastPlayed: Date.now(),
                role: 'player'
            });

            setCurrentLobby(joinLobbyInput.toUpperCase());
            setLobbyId(joinLobbyInput.toUpperCase());
        } catch (err) {
            setError('Lobby\'ye katılırken hata oluştu. Lütfen tekrar deneyin.');
            console.error('Error joining lobby:', err);
        } finally {
            setIsLoading(false);
        }
    };

    // Create Character
    const handleCreateCharacter = async () => {
        if (!user || !currentLobby || !characterName.trim()) {
            setError('Lütfen karakter adı girin.');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const character: Character = {
                name: characterName,
                race: selectedRace,
                class: selectedClass,
                maxHp: maxHp,
                currentHp: maxHp,
                stats: stats,
                armorClass: armorClass
            };

            const characterRef = ref(db, `dnd_lobbies/${currentLobby}/players/${user.uid}/character`);
            await set(characterRef, character);
        } catch (err) {
            setError('Karakter oluşturulurken hata oluştu.');
            console.error('Error creating character:', err);
        } finally {
            setIsLoading(false);
        }
    };

    // Update stat
    const updateStat = (stat: keyof CharacterStats, value: number) => {
        setStats(prev => ({ ...prev, [stat]: value }));
    };

    // Toggle player selection
    const togglePlayerSelection = (playerId: string) => {
        setSelectedPlayerIds(prev =>
            prev.includes(playerId)
                ? prev.filter(id => id !== playerId)
                : [...prev, playerId]
        );
    };

    // Toggle monster selection
    const toggleMonsterSelection = (monsterId: string) => {
        setSelectedMonsterIds(prev =>
            prev.includes(monsterId)
                ? prev.filter(id => id !== monsterId)
                : [...prev, monsterId]
        );
    };

    // Deal damage to selected entities
    const handleDealDamage = async () => {
        if (!currentLobby || damageAmount <= 0) return;

        try {
            // Damage selected players
            for (const playerId of selectedPlayerIds) {
                const player = lobbyData?.players?.[playerId];
                if (player?.character) {
                    const newHp = Math.max(0, player.character.currentHp - damageAmount);
                    const playerHpRef = ref(db, `dnd_lobbies/${currentLobby}/players/${playerId}/character/currentHp`);
                    await set(playerHpRef, newHp);

                    // Log damage
                    await addLogEntry({
                        sender: 'DM',
                        type: 'damage',
                        detail: `${player.character.name}'e ${damageAmount} hasar verdi`,
                        value: damageAmount
                    });
                }
            }

            // Damage selected monsters
            for (const monsterId of selectedMonsterIds) {
                const monster = lobbyData?.monsters?.[monsterId];
                if (monster) {
                    const newHp = Math.max(0, monster.currentHp - damageAmount);
                    const monsterHpRef = ref(db, `dnd_lobbies/${currentLobby}/monsters/${monsterId}/currentHp`);
                    await set(monsterHpRef, newHp);

                    // Log damage
                    await addLogEntry({
                        sender: 'DM',
                        type: 'damage',
                        detail: `${monster.name}'e ${damageAmount} hasar verdi`,
                        value: damageAmount
                    });
                }
            }

            // Reset
            setDamageAmount(0);
            setSelectedPlayerIds([]);
            setSelectedMonsterIds([]);
        } catch (err) {
            console.error('Error dealing damage:', err);
            setError('Hasar verirken hata oluştu.');
        }
    };

    // Heal selected entities
    const handleHeal = async () => {
        if (!currentLobby || damageAmount <= 0) return;

        try {
            // Heal selected players
            for (const playerId of selectedPlayerIds) {
                const player = lobbyData?.players?.[playerId];
                if (player?.character) {
                    const newHp = Math.min(player.character.maxHp, player.character.currentHp + damageAmount);
                    const playerHpRef = ref(db, `dnd_lobbies/${currentLobby}/players/${playerId}/character/currentHp`);
                    await set(playerHpRef, newHp);

                    // Log heal
                    await addLogEntry({
                        sender: 'DM',
                        type: 'heal',
                        detail: `${player.character.name}'i ${damageAmount} HP iyileştirdi`,
                        value: damageAmount
                    });
                }
            }

            // Heal selected monsters
            for (const monsterId of selectedMonsterIds) {
                const monster = lobbyData?.monsters?.[monsterId];
                if (monster) {
                    const newHp = Math.min(monster.maxHp, monster.currentHp + damageAmount);
                    const monsterHpRef = ref(db, `dnd_lobbies/${currentLobby}/monsters/${monsterId}/currentHp`);
                    await set(monsterHpRef, newHp);

                    // Log heal
                    await addLogEntry({
                        sender: 'DM',
                        type: 'heal',
                        detail: `${monster.name}'i ${damageAmount} HP iyileştirdi`,
                        value: damageAmount
                    });
                }
            }

            // Reset
            setDamageAmount(0);
            setSelectedPlayerIds([]);
            setSelectedMonsterIds([]);
        } catch (err) {
            console.error('Error healing:', err);
            setError('İyileştirme sırasında hata oluştu.');
        }
    };

    // Add monster
    const handleAddMonster = async () => {
        if (!currentLobby || !newMonsterName.trim() || !newMonsterDescription.trim() || newMonsterMaxHp <= 0) {
            setError('Lütfen geçerli bir canavar adı, açıklama ve HP girin.');
            return;
        }

        try {
            const monsterId = `monster_${Date.now()}`;
            const monster: Monster = {
                id: monsterId,
                name: newMonsterName,
                description: newMonsterDescription,
                maxHp: newMonsterMaxHp,
                currentHp: newMonsterMaxHp
            };

            const monsterRef = ref(db, `dnd_lobbies/${currentLobby}/monsters/${monsterId}`);
            await set(monsterRef, monster);

            // Reset form
            setNewMonsterName('');
            setNewMonsterDescription('');
            setNewMonsterMaxHp(20);
            setShowAddMonster(false);
        } catch (err) {
            console.error('Error adding monster:', err);
            setError('Canavar eklenirken hata oluştu.');
        }
    };

    // Remove monster
    const handleRemoveMonster = async (monsterId: string) => {
        if (!currentLobby) return;

        try {
            const monsterRef = ref(db, `dnd_lobbies/${currentLobby}/monsters/${monsterId}`);
            await remove(monsterRef);

            // Remove from selection if selected
            setSelectedMonsterIds(prev => prev.filter(id => id !== monsterId));
        } catch (err) {
            console.error('Error removing monster:', err);
            setError('Canavar silinirken hata oluştu.');
        }
    };

    // Add log entry to Firebase
    const addLogEntry = async (entry: Omit<LogEntry, 'id' | 'timestamp'>) => {
        if (!currentLobby) return;

        try {
            const logsRef = ref(db, `dnd_lobbies/${currentLobby}/logs`);
            await push(logsRef, {
                ...entry,
                timestamp: Date.now()
            });
        } catch (err) {
            console.error('Error adding log entry:', err);
        }
    };

    // Calculate D&D modifier from stat value
    const calculateModifier = (statValue: number): number => {
        return Math.floor((statValue - 10) / 2);
    };

    // Roll dice
    const rollDice = async (sides: number) => {
        if (!user) return;

        const result = Math.floor(Math.random() * sides) + 1;

        // Trigger Animation locally
        setRollingDice({ sides, result });

        const playerName = myCharacter?.name || (isDM ? 'DM' : 'Oyuncu');

        await addLogEntry({
            sender: playerName,
            type: 'dice',
            detail: `1d${sides}`,
            value: result
        });
    };

    // Roll stat check (D20 + modifier)
    const rollStatCheck = async (statName: string, statValue: number) => {
        if (!user || !myCharacter) return;

        const roll = Math.floor(Math.random() * 20) + 1;
        const modifier = calculateModifier(statValue);
        const total = roll + modifier;
        const playerName = myCharacter.name;

        const statNames: { [key: string]: string } = {
            str: 'Güç',
            dex: 'Çeviklik',
            con: 'Dayanıklılık',
            int: 'Zeka',
            wis: 'Bilgelik',
            cha: 'Karizma'
        };

        await addLogEntry({
            sender: playerName,
            type: 'dice',
            detail: `${statNames[statName]} Kontrolü: ${roll} + ${modifier} = ${total}`,
            value: total
        });
    };

    // Parse and roll damage formula (e.g., "2d6+3")
    const calculateDamageRoll = (formula: string): number => {
        try {
            const match = formula.match(/^(\d+)d(\d+)([+-]\d+)?$/i);
            if (!match) return 0;

            const numDice = parseInt(match[1]);
            const diceSides = parseInt(match[2]);
            const modifier = match[3] ? parseInt(match[3]) : 0;

            let total = modifier;
            for (let i = 0; i < numDice; i++) {
                total += Math.floor(Math.random() * diceSides) + 1;
            }

            return Math.max(0, total);
        } catch (err) {
            console.error('Error parsing damage formula:', err);
            return 0;
        }
    };

    // Get remaining uses for an ability
    const getRemainingUses = (abilityId: string): number => {
        const ability = myCharacter?.abilities?.find(a => a.id === abilityId);
        if (!ability) return 0;

        const used = myCharacter?.abilityUsage?.[abilityId] || 0;
        return Math.max(0, ability.maxUsesPerDay - used);
    };

    // Add ability to character
    const handleAddAbility = async () => {
        if (!currentLobby || !user || !myCharacter) return;
        if (!newAbilityName.trim() || !newAbilityDescription.trim()) {
            setError('Lütfen tüm alanları doldurun.');
            return;
        }

        // Build damage formula from dropdowns
        const damageFormula = `${newAbilityDiceCount}d${newAbilityDiceType}${newAbilityModifier >= 0 ? '+' : ''}${newAbilityModifier !== 0 ? newAbilityModifier : ''}`.replace(/\+0$/, '');

        // Validate damage formula
        const testDamage = calculateDamageRoll(damageFormula);
        if (testDamage === 0 && damageFormula !== '0') {
            setError('Geçersiz hasar formülü.');
            return;
        }

        try {
            const abilityId = `ability_${Date.now()}`;
            const newAbility: Ability = {
                id: abilityId,
                name: newAbilityName,
                description: newAbilityDescription,
                damageType: damageFormula,
                maxUsesPerDay: newAbilityMaxUses
            };

            const abilities = myCharacter.abilities || [];
            const abilitiesRef = ref(db, `dnd_lobbies/${currentLobby}/players/${user.uid}/character/abilities`);
            await set(abilitiesRef, [...abilities, newAbility]);

            // Reset form
            setNewAbilityName('');
            setNewAbilityDescription('');
            setNewAbilityDiceCount(2);
            setNewAbilityDiceType(6);
            setNewAbilityModifier(0);
            setNewAbilityMaxUses(3);
            setShowAddAbility(false);

            await addLogEntry({
                sender: myCharacter.name,
                type: 'system',
                detail: `yeni yetenek öğrendi: ${newAbility.name}`
            });
        } catch (err) {
            console.error('Error adding ability:', err);
            setError('Yetenek eklenirken hata oluştu.');
        }
    };

    // Add ability to monster (DM only)
    const handleAddMonsterAbility = async (monsterId: string) => {
        if (!currentLobby || !isDM || !lobbyData) return;
        if (!newMonsterAbilityName.trim()) {
            setError('Yetenek adı gerekli.');
            return;
        }

        // Build damage formula
        const damageFormula = `${newMonsterAbilityDiceCount}d${newMonsterAbilityDiceType}${newMonsterAbilityModifier >= 0 ? '+' : ''}${newMonsterAbilityModifier !== 0 ? newMonsterAbilityModifier : ''}`.replace(/\+0$/, '');

        try {
            const abilityId = `m_ability_${Date.now()}`;
            const newAbility: Ability = {
                id: abilityId,
                name: newMonsterAbilityName,
                description: newMonsterAbilityDesc,
                damageType: damageFormula,
                maxUsesPerDay: 99 // Mnsters usually don't track daily uses strictly in this simple system
            };

            const monster = lobbyData.monsters?.[monsterId];
            if (!monster) return;

            const abilities = monster.abilities || [];
            const abilitiesRef = ref(db, `dnd_lobbies/${currentLobby}/monsters/${monsterId}/abilities`);
            await set(abilitiesRef, [...abilities, newAbility]);

            // Reset form
            setNewMonsterAbilityName('');
            setNewMonsterAbilityDesc('');
            setNewMonsterAbilityDiceCount(1);
            setNewMonsterAbilityDiceType(6);
            setNewMonsterAbilityModifier(0);
            setShowAddMonsterAbility(null);

            await addLogEntry({
                sender: 'DM',
                type: 'system',
                detail: `${monster.name} yeni yetenek kazandı: ${newAbility.name} (${damageFormula})`
            });
        } catch (err) {
            console.error('Error adding monster ability:', err);
            setError('Canavar yeteneği eklenirken hata oluştu.');
        }
    };

    // Monster uses ability (DM only)
    const handleMonsterAttack = async (monsterId: string, ability: Ability, targetId: string) => {
        if (!currentLobby || !isDM || !lobbyData) return;

        const monster = lobbyData.monsters?.[monsterId];
        const targetPlayer = lobbyData.players?.[targetId];

        if (!monster || !targetPlayer || !targetPlayer.character) return;

        // Simple Attack Roll (Monsters default to +3 modifier for now since they don't have stats yet)
        const attackRoll = Math.floor(Math.random() * 20) + 1;
        const attackModifier = 3;
        const totalAttack = attackRoll + attackModifier;
        const targetAC = targetPlayer.character.armorClass || 10;

        const isHit = totalAttack >= targetAC;

        if (isHit) {
            const damage = calculateDamageRoll(ability.damageType);
            const newHp = Math.max(0, targetPlayer.character.currentHp - damage);

            const playerHpRef = ref(db, `dnd_lobbies/${currentLobby}/players/${targetId}/character/currentHp`);
            await set(playerHpRef, newHp);

            await addLogEntry({
                sender: monster.name,
                type: 'monster',
                detail: `Saldırı: ${attackRoll} + ${attackModifier} = ${totalAttack} vs AC ${targetAC} - İSABET! ${ability.name} ile ${damage} hasar`,
                value: damage
            });
        } else {
            await addLogEntry({
                sender: monster.name,
                type: 'monster',
                detail: `Saldırı: ${attackRoll} + ${attackModifier} = ${totalAttack} vs AC ${targetAC} - KAÇTI! (${ability.name})`
            });
        }
    };

    // Use ability on target
    const handleUseAbility = async (ability: Ability) => {
        if (!currentLobby || !user || !myCharacter || !selectedTargetId) {
            setError('Lütfen bir hedef seçin.');
            return;
        }

        const remaining = getRemainingUses(ability.id);
        if (remaining <= 0) {
            setError('Bu yeteneğin günlük kullanım hakkı bitti.');
            return;
        }

        try {
            // Get target
            let targetName = '';
            let targetAC = 10;

            if (selectedTargetType === 'monster') {
                const monster = lobbyData?.monsters?.[selectedTargetId];
                if (!monster) {
                    setError('Hedef bulunamadı.');
                    return;
                }
                targetName = monster.name;
                targetAC = 10; // Monsters don't have AC in our current model, default to 10
            } else {
                const player = lobbyData?.players?.[selectedTargetId];
                if (!player?.character) {
                    setError('Hedef bulunamadı.');
                    return;
                }
                targetName = player.character.name;
                targetAC = player.character.armorClass || 10;
            }

            // Roll attack (D20 + DEX modifier for abilities)
            const attackRoll = Math.floor(Math.random() * 20) + 1;
            const dexModifier = calculateModifier(myCharacter.stats.dex);
            const totalAttack = attackRoll + dexModifier;

            // Log ability usage
            await addLogEntry({
                sender: myCharacter.name,
                type: 'dice',
                detail: `${ability.name} kullandı (${targetName} hedefine)`
            });

            // Check if hit
            const isHit = totalAttack >= targetAC;

            if (isHit) {
                // Roll damage
                const damage = calculateDamageRoll(ability.damageType);
                console.log('Damage roll:', ability.damageType, '=', damage); // Debug

                // Apply damage
                if (selectedTargetType === 'monster') {
                    const monster = lobbyData?.monsters?.[selectedTargetId];
                    if (monster) {
                        const newHp = Math.max(0, monster.currentHp - damage);
                        const monsterHpRef = ref(db, `dnd_lobbies/${currentLobby}/monsters/${selectedTargetId}/currentHp`);
                        await set(monsterHpRef, newHp);
                    }
                } else {
                    const player = lobbyData?.players?.[selectedTargetId];
                    if (player?.character) {
                        const newHp = Math.max(0, player.character.currentHp - damage);
                        const playerHpRef = ref(db, `dnd_lobbies/${currentLobby}/players/${selectedTargetId}/character/currentHp`);
                        await set(playerHpRef, newHp);
                    }
                }

                // Log hit and damage
                await addLogEntry({
                    sender: myCharacter.name,
                    type: 'damage',
                    detail: `Saldırı: ${attackRoll} + ${dexModifier} = ${totalAttack} vs AC ${targetAC} - İSABET! ${ability.damageType} zarı: ${damage} hasar`,
                    value: damage
                });
            } else {
                // Log miss
                await addLogEntry({
                    sender: myCharacter.name,
                    type: 'system',
                    detail: `Saldırı: ${attackRoll} + ${dexModifier} = ${totalAttack} vs AC ${targetAC} - KAÇTI!`
                });
            }

            // Increment usage count
            const currentUsage = myCharacter.abilityUsage || {};
            const newUsage = {
                ...currentUsage,
                [ability.id]: (currentUsage[ability.id] || 0) + 1
            };
            const usageRef = ref(db, `dnd_lobbies/${currentLobby}/players/${user.uid}/character/abilityUsage`);
            await set(usageRef, newUsage);

            // Reset selection
            setSelectedAbility(null);
            setSelectedTargetId('');
        } catch (err) {
            console.error('Error using ability:', err);
            setError('Yetenek kullanılırken hata oluştu.');
        }
    };

    // End day (DM only)
    const handleEndDay = async () => {
        if (!currentLobby || !isDM || !lobbyData) return;

        try {
            const newDay = (lobbyData.currentDay || 1) + 1;

            // Increment day
            const dayRef = ref(db, `dnd_lobbies/${currentLobby}/currentDay`);
            await set(dayRef, newDay);

            // Reset all player ability usage
            const players = lobbyData.players || {};
            for (const playerId of Object.keys(players)) {
                const player = players[playerId];
                // Only reset if player has a character with abilities
                if (player?.character?.abilities && player.character.abilities.length > 0) {
                    const usageRef = ref(db, `dnd_lobbies/${currentLobby}/players/${playerId}/character/abilityUsage`);
                    await set(usageRef, {});
                }
            }

            // Log
            await addLogEntry({
                sender: 'DM',
                type: 'system',
                detail: `Gün ${lobbyData.currentDay} sona erdi. Gün ${newDay} başladı! Tüm yetenekler yenilendi.`
            });
        } catch (err) {
            console.error('Error ending day:', err);
            setError('Gün bitirme sırasında hata oluştu.');
        }
    };

    // Add item to inventory
    const handleAddItem = async () => {
        if (!currentLobby || !user || !myCharacter) return;
        if (!newItemName.trim() || !newItemDesc.trim()) {
            setError('Lütfen tüm alanları doldurun.');
            return;
        }

        try {
            // Construct effect string for potions
            let effectString = '';
            if (newItemType === 'potion') {
                const formula = `${newItemDiceCount}d${newItemDiceType}${newItemModifier >= 0 ? '+' : ''}${newItemModifier !== 0 ? newItemModifier : ''}`.replace(/\+0$/, '');
                effectString = `heal:${formula}`;
            } else {
                effectString = newItemEffect;
            }

            const itemId = `item_${Date.now()}`;
            const newItem: Item = {
                id: itemId,
                name: newItemName,
                type: newItemType,
                description: newItemDesc,
                effect: effectString,
                quantity: newItemQuantity
            };

            const inventory = myCharacter.inventory || [];
            const inventoryRef = ref(db, `dnd_lobbies/${currentLobby}/players/${user.uid}/character/inventory`);
            await set(inventoryRef, [...inventory, newItem]);

            // Reset form
            setNewItemName('');
            setNewItemDesc('');
            setNewItemEffect('');
            setNewItemType('misc');
            setNewItemQuantity(1);
            setNewItemDiceCount(2);
            setNewItemDiceType(4);
            setNewItemModifier(2);
            setShowAddItem(false);

            await addLogEntry({
                sender: myCharacter.name,
                type: 'system',
                detail: `yeni eşya kazandı: ${newItem.name} (${newItem.quantity} adet)`
            });
        } catch (err) {
            console.error('Error adding item:', err);
            setError('Eşya eklenirken hata oluştu.');
        }
    };

    // Remove item from inventory
    const handleRemoveItem = async (itemId: string) => {
        if (!currentLobby || !user || !myCharacter) return;

        try {
            const inventory = myCharacter.inventory || [];
            const updatedInventory = inventory.filter(i => i.id !== itemId);
            const inventoryRef = ref(db, `dnd_lobbies/${currentLobby}/players/${user.uid}/character/inventory`);
            await set(inventoryRef, updatedInventory);
        } catch (err) {
            console.error('Error removing item:', err);
        }
    };

    // Use item (consumable)
    const handleUseItem = async (item: Item) => {
        if (!currentLobby || !user || !myCharacter) return;

        // Only potions consume/apply effect for now
        if (item.type !== 'potion' || !item.effect) return;

        try {
            // Parse effect (e.g., "heal:2d4+2")
            const [effectType, formula] = item.effect.split(':');

            if (effectType === 'heal' && formula) {
                const amount = calculateDamageRoll(formula);

                // Apply heal
                const newHp = Math.min(myCharacter.maxHp, myCharacter.currentHp + amount);
                const hpRef = ref(db, `dnd_lobbies/${currentLobby}/players/${user.uid}/character/currentHp`);
                await set(hpRef, newHp);

                await addLogEntry({
                    sender: myCharacter.name,
                    type: 'heal',
                    detail: `${item.name} kullandı ve ${amount} HP iyileşti`,
                    value: amount
                });
            }

            // Decrease quantity or remove
            if (item.quantity > 1) {
                const inventory = myCharacter.inventory || [];
                const updatedInventory = inventory.map(i =>
                    i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i
                );
                const inventoryRef = ref(db, `dnd_lobbies/${currentLobby}/players/${user.uid}/character/inventory`);
                await set(inventoryRef, updatedInventory);
            } else {
                await handleRemoveItem(item.id);
            }

        } catch (err) {
            console.error('Error using item:', err);
            setError('Eşya kullanılırken hata oluştu.');
        }
    };

    // Listen to lobby updates
    useEffect(() => {
        if (!currentLobby) return;

        const lobbyRef = ref(db, `dnd_lobbies/${currentLobby}`);
        const unsubscribe = onValue(lobbyRef, (snapshot) => {
            if (snapshot.exists()) {
                setLobbyData(snapshot.val() as Lobby);
            } else {
                // Lobby deleted
                setCurrentLobby(null);
                setLobbyData(null);
                setError('Lobby kapatıldı.');
            }
        });

        return () => {
            unsubscribe();
        };
    }, [currentLobby]);

    // Listen to logs
    useEffect(() => {
        if (!currentLobby) {
            setLogs([]);
            return;
        }

        const logsRef = ref(db, `dnd_lobbies/${currentLobby}/logs`);
        const unsubscribe = onValue(logsRef, (snapshot) => {
            if (snapshot.exists()) {
                const logsData = snapshot.val();
                const logsArray: LogEntry[] = Object.entries(logsData).map(([id, log]: [string, any]) => ({
                    id,
                    ...log
                }));
                // Sort by timestamp
                logsArray.sort((a, b) => a.timestamp - b.timestamp);
                setLogs(logsArray);

                // Auto-scroll to bottom
                setTimeout(() => {
                    if (logContainerRef.current) {
                        logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
                    }
                }, 100);
            } else {
                setLogs([]);
            }
        });

        return () => {
            unsubscribe();
        };
    }, [currentLobby]);

    // Cleanup: (Optional) Handle presence if needed, but DO NOT DELETE DATA
    useEffect(() => {
        if (!currentLobby || !user) return;

        // Future improvement: Set 'isOnline: false' here if implementing presence
        return () => {
            // Data is preserved!
        };
    }, [currentLobby, user]);

    // Fetch My Lobbies
    useEffect(() => {
        if (!user) return;
        const myLobbiesRef = ref(db, `users/${user.uid}/my_lobbies`);

        onValue(myLobbiesRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                const lobbies = Object.values(data).map((l: any) => ({
                    id: l.lobbyId,
                    role: l.role,
                    lastPlayed: l.lastPlayed
                })).sort((a: any, b: any) => b.lastPlayed - a.lastPlayed);
                setMyLobbies(lobbies);
            } else {
                setMyLobbies([]);
            }
        });
    }, [user]);

    // Listen to chat
    useEffect(() => {
        if (!currentLobby) {
            setChatMessages([]);
            return;
        }

        const chatRef = ref(db, `dnd_lobbies/${currentLobby}/chat`);
        const unsubscribe = onValue(chatRef, (snapshot) => {
            if (snapshot.exists()) {
                const chatData = snapshot.val();
                const messagesArray: ChatMessage[] = Object.entries(chatData).map(([id, msg]: [string, any]) => ({
                    id,
                    ...msg
                }));
                // Sort by timestamp
                messagesArray.sort((a, b) => a.timestamp - b.timestamp);
                setChatMessages(messagesArray);
            } else {
                setChatMessages([]);
            }
        });

        return () => {
            unsubscribe();
        };
    }, [currentLobby]);


    // Send Chat Message
    const handleSendMessage = async () => {
        if (!currentLobby || !user || !chatInput.trim()) return;

        try {
            const messageId = `msg_${Date.now()}`;
            const senderName = isDM ? 'DM' : (myCharacter?.name || user.nickname || 'Anonim');

            const message: ChatMessage = {
                id: messageId,
                senderId: user.uid,
                senderName: senderName,
                content: chatInput.trim(),
                timestamp: Date.now(),
                type: chatRecipientId ? 'whisper' : 'public',
                ...(chatRecipientId ? { recipientId: chatRecipientId } : {})
            };

            const chatRef = ref(db, `dnd_lobbies/${currentLobby}/chat/${messageId}`);
            await set(chatRef, message);

            setChatInput('');
        } catch (err) {
            console.error('Error sending message:', err);
            setError('Mesaj gönderilemedi.');
        }
    };




    // Update XP Threshold (DM only)
    const handleUpdateXPThreshold = async () => {
        if (!currentLobby || !isDM) return;

        try {
            const settingsRef = ref(db, `dnd_lobbies/${currentLobby}/xpSettings`);
            await set(settingsRef, {
                levelUpThreshold: xpThresholdInput
            });
            await addLogEntry({
                sender: 'DM',
                type: 'system',
                detail: `Level atlama eşiğini güncelledi: ${xpThresholdInput} XP`
            });
        } catch (err) {
            console.error('Error updating XP threshold:', err);
            setError('XP eşiği güncellenirken hata oluştu.');
        }
    };

    // Award XP to selected players (DM only)
    const handleAwardXP = async () => {
        if (!currentLobby || !isDM || selectedPlayerIds.length === 0 || xpAmount <= 0) return;

        try {
            const currentThreshold = lobbyData?.xpSettings?.levelUpThreshold || 1000;
            const updatedPlayers: string[] = [];
            const leveledUpPlayers: string[] = [];

            for (const playerId of selectedPlayerIds) {
                const player = lobbyData?.players?.[playerId];
                if (player?.character) {
                    const currentXP = player.character.xp || 0;
                    const currentLevel = player.character.level || 1;
                    const newXP = currentXP + xpAmount;

                    // Check for level up
                    const newLevel = Math.floor(newXP / currentThreshold) + 1;
                    const isLevelUp = newLevel > currentLevel;

                    const xpRef = ref(db, `dnd_lobbies/${currentLobby}/players/${playerId}/character/xp`);
                    await set(xpRef, newXP);

                    if (isLevelUp) {
                        const levelRef = ref(db, `dnd_lobbies/${currentLobby}/players/${playerId}/character/level`);
                        await set(levelRef, newLevel);
                        leveledUpPlayers.push(player.character.name);
                    }

                    updatedPlayers.push(player.character.name);
                }
            }

            // Log
            await addLogEntry({
                sender: 'DM',
                type: 'system',
                detail: `${updatedPlayers.join(', ')} kazanılan XP: ${xpAmount}`,
                value: xpAmount
            });

            if (leveledUpPlayers.length > 0) {
                await addLogEntry({
                    sender: 'SYSTEM',
                    type: 'system',
                    detail: `TEBRİKLER! Seviye atlayanlar: ${leveledUpPlayers.join(', ')}`
                });
            }
        } catch (err) {
            console.error('Error awarding XP:', err);
            setError('XP verilirken hata oluştu.');
        }
    };

    // Get player list
    const getPlayerList = (): Array<{ id: string; name: string; character: Character | null | undefined }> => {
        if (!lobbyData?.players) return [];
        return Object.entries(lobbyData.players).map(([id, player]) => ({
            id,
            name: player.displayName,
            character: player.character
        }));
    };

    // Leave lobby
    const handleLeaveLobby = () => {
        setCurrentLobby(null);
        setLobbyData(null);
        setJoinLobbyInput('');
        setError('');
    };

    // HP Bar Component
    const HPBar = ({ current, max }: { current: number; max: number }) => {
        const percentage = (current / max) * 100;
        return (
            <div className="w-full">
                <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600 dark:text-gray-400">HP</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{current}/{max}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                    <div
                        className="bg-gradient-to-r from-red-500 to-pink-500 h-2.5 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                    />
                </div>
            </div>
        );
    };

    return (
        <MainLayout>
            <div className="relative isolate min-h-screen pt-14">
                {/* Background Effects */}
                <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
                    <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" style={{ clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)' }} />
                </div>

                <div className="py-24 sm:py-32">
                    <div className="mx-auto max-w-4xl px-6 lg:px-8">
                        {/* Header */}
                        <div className="text-center mb-12">
                            <h1 className="text-4xl font-black tracking-tight text-gray-900 dark:text-white sm:text-5xl bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400">
                                🐉 D&D Macera
                            </h1>
                            <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
                                Metin tabanlı çok oyunculu RPG deneyimi
                            </p>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="mb-6 rounded-2xl bg-red-50 dark:bg-red-900/20 p-4 border border-red-200 dark:border-red-800">
                                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                            </div>
                        )}

                        {/* Main Content */}
                        {!currentLobby ? (
                            // Lobby Selection Screen
                            <div className="grid gap-6 sm:grid-cols-2">
                                {/* Create Lobby Card */}
                                <div className="bg-white dark:bg-gray-800/50 backdrop-blur-lg rounded-3xl p-8 shadow-xl ring-1 ring-gray-900/10 dark:ring-white/10 hover:ring-purple-500/50 transition-all duration-300 hover:shadow-2xl">
                                    <div className="text-center">
                                        <div className="text-6xl mb-4">🎲</div>
                                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                            Lobby Oluştur
                                        </h2>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                                            Dungeon Master olarak yeni bir macera başlat
                                        </p>
                                        <button
                                            onClick={handleCreateLobby}
                                            disabled={isLoading}
                                            className="w-full rounded-xl bg-purple-600 px-6 py-3 text-sm font-bold text-white shadow-lg hover:bg-purple-500 hover:scale-105 hover:shadow-purple-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                        >
                                            {isLoading ? 'Oluşturuluyor...' : 'Lobby Oluştur'}
                                        </button>
                                    </div>
                                </div>

                                {/* Join Lobby Card */}
                                <div className="bg-white dark:bg-gray-800/50 backdrop-blur-lg rounded-3xl p-8 shadow-xl ring-1 ring-gray-900/10 dark:ring-white/10 hover:ring-purple-500/50 transition-all duration-300 hover:shadow-2xl">
                                    <div className="text-center">
                                        <div className="text-6xl mb-4">⚔️</div>
                                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                            Lobby'ye Katıl
                                        </h2>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                                            Oyuncu olarak maceralara katıl
                                        </p>
                                        <input
                                            type="text"
                                            value={joinLobbyInput}
                                            onChange={(e) => setJoinLobbyInput(e.target.value.toUpperCase())}
                                            placeholder="Lobby ID (örn: ABC123)"
                                            maxLength={6}
                                            className="w-full mb-4 rounded-xl border-0 bg-gray-50 dark:bg-gray-700 px-4 py-3 text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-purple-500 text-center font-mono text-lg"
                                        />
                                        <button
                                            onClick={handleJoinLobby}
                                            disabled={isLoading || !joinLobbyInput.trim()}
                                            className="w-full rounded-xl bg-pink-600 px-6 py-3 text-sm font-bold text-white shadow-lg hover:bg-pink-500 hover:scale-105 hover:shadow-pink-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                        >
                                            {isLoading ? 'Katılınıyor...' : 'Katıl'}
                                        </button>
                                    </div>
                                </div>

                                {/* My Campaigns List */}
                                {myLobbies.length > 0 && (
                                    <div className="mt-8">
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2 justify-center">
                                            🌍 Aktif Maceraların
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {myLobbies.map((lobby) => (
                                                <div
                                                    key={lobby.id}
                                                    onClick={() => {
                                                        setJoinLobbyInput(lobby.id);
                                                        setLobbyId(lobby.id);
                                                        setCurrentLobby(lobby.id);
                                                    }}
                                                    className="bg-white dark:bg-gray-800/50 backdrop-blur-lg p-4 rounded-xl shadow ring-1 ring-gray-900/10 dark:ring-white/10 hover:scale-105 transition-all cursor-pointer group"
                                                >
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <h4 className="font-bold text-lg text-purple-600 dark:text-purple-400 group-hover:underline">
                                                                {lobby.id}
                                                            </h4>
                                                            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${lobby.role === 'dm'
                                                                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                                : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                                }`}>
                                                                {lobby.role === 'dm' ? 'Dungeon Master' : 'Oyuncu'}
                                                            </span>
                                                        </div>
                                                        <span className="text-xs text-gray-500">
                                                            {new Date(lobby.lastPlayed).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-gray-400 mt-2">Tıklayarak devam et →</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : !lobbyData ? (
                            // Loading lobby data
                            <div className="bg-white dark:bg-gray-800/50 backdrop-blur-lg rounded-3xl p-12 shadow-xl ring-1 ring-gray-900/10 dark:ring-white/10 text-center">
                                <div className="text-6xl mb-4">⏳</div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                    Lobby Yükleniyor...
                                </h2>
                                <p className="text-gray-600 dark:text-gray-400">
                                    Lütfen bekleyin
                                </p>
                            </div>
                        ) : isDM ? (
                            // DM Combat Dashboard
                            <div className="space-y-6">
                                {/* Header */}
                                <div className="bg-white dark:bg-gray-800/50 backdrop-blur-lg rounded-3xl p-6 shadow-xl ring-1 ring-gray-900/10 dark:ring-white/10">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                                                🎭 DM Combat Dashboard
                                            </h2>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                Lobby ID: <span className="font-mono font-bold text-purple-600 dark:text-purple-400">{lobbyId}</span>
                                            </p>
                                        </div>
                                        <div className="flex gap-3">
                                            <button
                                                onClick={handleLeaveLobby}
                                                className="rounded-xl bg-gray-200 dark:bg-gray-700 px-4 py-2 text-sm font-bold text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-300"
                                            >
                                                Ayrıl
                                            </button>
                                            <button
                                                onClick={() => navigate('/')}
                                                className="rounded-xl bg-purple-600 px-4 py-2 text-sm font-bold text-white hover:bg-purple-500 transition-all duration-300"
                                            >
                                                Ana Sayfa
                                            </button>
                                        </div>
                                    </div>

                                    {/* Day Management */}
                                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-xl border-2 border-orange-200 dark:border-orange-800">
                                        <div className="flex items-center gap-3">
                                            <span className="text-3xl">📅</span>
                                            <div>
                                                <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Macera Günü</p>
                                                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                                                    Gün {lobbyData.currentDay}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={handleEndDay}
                                            className="rounded-xl bg-gradient-to-r from-orange-500 to-yellow-500 px-6 py-3 text-sm font-bold text-white hover:from-orange-400 hover:to-yellow-400 transition-all duration-300 shadow-lg hover:shadow-xl"
                                        >
                                            🌙 Günü Bitir
                                        </button>
                                    </div>
                                </div>

                                {/* Split Screen Layout */}
                                <div className="grid lg:grid-cols-2 gap-6">
                                    {/* LEFT: Players & Monsters */}
                                    <div className="space-y-6">
                                        {/* Players Section */}
                                        <div className="bg-white dark:bg-gray-800/50 backdrop-blur-lg rounded-3xl p-6 shadow-xl ring-1 ring-gray-900/10 dark:ring-white/10">
                                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                                ⚔️ Players ({getPlayerList().length})
                                            </h3>
                                            <div className="space-y-3">
                                                {getPlayerList().map((player) => (
                                                    <div
                                                        key={player.id}
                                                        onClick={() => player.character && togglePlayerSelection(player.id)}
                                                        className={`rounded-xl p-4 transition-all duration-300 cursor-pointer ${selectedPlayerIds.includes(player.id)
                                                            ? 'bg-purple-100 dark:bg-purple-900/40 ring-2 ring-purple-500 shadow-lg shadow-purple-500/30'
                                                            : 'bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700'
                                                            } ${!player.character ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                    >
                                                        {player.character ? (
                                                            <div className="space-y-2">
                                                                <div className="flex items-center justify-between">
                                                                    <div>
                                                                        <h4 className="font-bold text-gray-900 dark:text-white text-lg">
                                                                            {player.character.name}
                                                                        </h4>
                                                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                                                            {player.character.race} {player.character.class}
                                                                            {player.character.armorClass && (
                                                                                <span className="ml-2 text-xs font-semibold text-blue-600 dark:text-blue-400">
                                                                                    AC {player.character.armorClass}
                                                                                </span>
                                                                            )}
                                                                        </p>
                                                                    </div>
                                                                    {selectedPlayerIds.includes(player.id) && (
                                                                        <span className="text-2xl">✓</span>
                                                                    )}
                                                                </div>

                                                                {/* HP and XP Bars - Privacy Protected */}
                                                                {(isDM || player.id === user?.uid) ? (
                                                                    <>
                                                                        <HPBar current={player.character.currentHp} max={player.character.maxHp} />

                                                                        {/* XP Bar (Mini) */}
                                                                        <div className="flex items-center gap-2 mt-1">
                                                                            <span className="text-[10px] font-bold text-gray-400">XP</span>
                                                                            <div className="flex-1 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                                                <div
                                                                                    className="h-full bg-yellow-400 transition-all duration-500"
                                                                                    style={{
                                                                                        width: `${Math.min(100, ((player.character.xp || 0) / (lobbyData.xpSettings?.levelUpThreshold || 1000)) * 100)}%`
                                                                                    }}
                                                                                />
                                                                            </div>
                                                                            <span className="text-[10px] font-bold text-gray-500">Lvl {player.character.level || 1}</span>
                                                                        </div>
                                                                    </>
                                                                ) : (
                                                                    <div className="bg-gray-200 dark:bg-gray-800 rounded p-2 text-center">
                                                                        <span className="text-xs text-gray-500 dark:text-gray-400 italic">
                                                                            🔒 Bilgiler Gizli
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center justify-between">
                                                                <div>
                                                                    <h4 className="font-medium text-gray-900 dark:text-white">
                                                                        {player.name}
                                                                    </h4>
                                                                    <p className="text-sm text-gray-500">
                                                                        Karakter oluşturuluyor...
                                                                    </p>
                                                                </div>
                                                                <span className="text-xs font-semibold text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/40 px-3 py-1 rounded-full">
                                                                    Beklemede
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                                {getPlayerList().length === 0 && (
                                                    <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                                                        Henüz oyuncu yok. Lobby ID'yi paylaşın!
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* XP Management Section */}
                                        <div className="bg-white dark:bg-gray-800/50 backdrop-blur-lg rounded-3xl p-6 shadow-xl ring-1 ring-gray-900/10 dark:ring-white/10">
                                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                                ✨ XP & Level Yönetimi
                                            </h3>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {/* Settings */}
                                                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl space-y-3">
                                                    <h4 className="font-bold text-gray-700 dark:text-gray-300 text-sm">Ayarlar</h4>
                                                    <div className="flex gap-2">
                                                        <div className="flex-1">
                                                            <label className="block text-xs text-gray-500 mb-1">Seviye Başına XP Eşiği</label>
                                                            <input
                                                                type="number"
                                                                value={xpThresholdInput}
                                                                onChange={(e) => setXpThresholdInput(parseInt(e.target.value) || 1000)}
                                                                className="w-full rounded border border-gray-300 dark:border-gray-600 px-2 py-1 text-sm dark:bg-gray-800 dark:text-white"
                                                            />
                                                        </div>
                                                        <button
                                                            onClick={handleUpdateXPThreshold}
                                                            className="self-end rounded bg-gray-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-gray-500"
                                                        >
                                                            Güncelle
                                                        </button>
                                                    </div>
                                                    <p className="text-xs text-gray-400">Şu anki eşik: {lobbyData.xpSettings?.levelUpThreshold || 1000} XP</p>
                                                </div>

                                                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-5 rounded-xl space-y-4 border border-yellow-200 dark:border-yellow-700/50">
                                                    <div className="flex items-center justify-between">
                                                        <h4 className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                                                            <span className="text-xl">✨</span> XP Dağıt
                                                        </h4>
                                                        {selectedPlayerIds.length > 0 ? (
                                                            <span className="text-xs font-bold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/40 px-2 py-1 rounded-full">
                                                                {selectedPlayerIds.length} Oyuncu Seçili
                                                            </span>
                                                        ) : (
                                                            <span className="text-xs font-bold text-red-500 bg-red-100 dark:bg-red-900/40 px-2 py-1 rounded-full animate-pulse">
                                                                Önce Oyuncu Seçin!
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="space-y-3">
                                                        {/* Quick Buttons */}
                                                        <div className="grid grid-cols-4 gap-2">
                                                            {[50, 100, 250, 500].map(amount => (
                                                                <button
                                                                    key={amount}
                                                                    onClick={() => setXpAmount(amount)}
                                                                    className={`py-1.5 rounded-lg text-xs font-bold transition-all ${xpAmount === amount
                                                                        ? 'bg-yellow-500 text-white shadow-md'
                                                                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-yellow-100 dark:hover:bg-yellow-900/30'
                                                                        }`}
                                                                >
                                                                    +{amount}
                                                                </button>
                                                            ))}
                                                        </div>

                                                        <div className="flex gap-2">
                                                            <div className="relative flex-1">
                                                                <input
                                                                    type="number"
                                                                    value={xpAmount}
                                                                    onChange={(e) => setXpAmount(parseInt(e.target.value) || 0)}
                                                                    className="w-full h-full rounded-xl border-2 border-yellow-300 dark:border-yellow-700/50 bg-white dark:bg-gray-800 pl-3 pr-10 py-2 text-lg font-bold text-gray-900 dark:text-white focus:border-yellow-500 focus:ring-0"
                                                                    min="0"
                                                                />
                                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">XP</span>
                                                            </div>
                                                            <button
                                                                onClick={handleAwardXP}
                                                                disabled={selectedPlayerIds.length === 0 || xpAmount <= 0}
                                                                className="rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 px-6 py-2 font-bold text-white shadow-lg hover:from-yellow-400 hover:to-orange-400 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-yellow-500/50 transition-all active:scale-95"
                                                            >
                                                                Dağıt
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Monsters Section */}
                                        <div className="bg-white dark:bg-gray-800/50 backdrop-blur-lg rounded-3xl p-6 shadow-xl ring-1 ring-gray-900/10 dark:ring-white/10">
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                                    👹 Monsters ({Object.keys(lobbyData?.monsters || {}).length})
                                                </h3>
                                                <button
                                                    onClick={() => setShowAddMonster(!showAddMonster)}
                                                    className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-bold text-white hover:bg-red-500 transition-all duration-300"
                                                >
                                                    {showAddMonster ? 'İptal' : '+ Canavar Ekle'}
                                                </button>
                                            </div>

                                            {/* Add Monster Form */}
                                            {showAddMonster && (
                                                <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl space-y-3">
                                                    <input
                                                        type="text"
                                                        value={newMonsterName}
                                                        onChange={(e) => setNewMonsterName(e.target.value)}
                                                        placeholder="Canavar Adı (örn: Goblin Boss)"
                                                        className="w-full rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                                                    />
                                                    <textarea
                                                        value={newMonsterDescription}
                                                        onChange={(e) => setNewMonsterDescription(e.target.value)}
                                                        placeholder="Açıklama (oyuncular görecek, örn: Yeşil derili, kısa boylu, kötü niyetli bir yaratık)"
                                                        rows={2}
                                                        className="w-full rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 resize-none"
                                                    />
                                                    <input
                                                        type="number"
                                                        value={newMonsterMaxHp}
                                                        onChange={(e) => setNewMonsterMaxHp(parseInt(e.target.value) || 0)}
                                                        placeholder="Max HP (sadece DM görecek)"
                                                        min="1"
                                                        className="w-full rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                                                    />
                                                    <button
                                                        onClick={handleAddMonster}
                                                        className="w-full rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-500 transition-all duration-300"
                                                    >
                                                        Oluştur
                                                    </button>
                                                </div>
                                            )}

                                            {/* Monster List */}
                                            <div className="space-y-3">
                                                {Object.values(lobbyData?.monsters || {}).map((monster) => (
                                                    <div
                                                        key={monster.id}
                                                        onClick={() => toggleMonsterSelection(monster.id)}
                                                        className={`rounded-xl p-4 transition-all duration-300 cursor-pointer ${selectedMonsterIds.includes(monster.id)
                                                            ? 'bg-red-100 dark:bg-red-900/40 ring-2 ring-red-500 shadow-lg shadow-red-500/30'
                                                            : 'bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700'
                                                            }`}
                                                    >
                                                        <div className="space-y-2">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex-1">
                                                                    <h4 className="font-bold text-gray-900 dark:text-white">
                                                                        {monster.name}
                                                                    </h4>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    {selectedMonsterIds.includes(monster.id) && (
                                                                        <span className="text-2xl">✓</span>
                                                                    )}
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleRemoveMonster(monster.id);
                                                                        }}
                                                                        className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-xl"
                                                                    >
                                                                        🗑️
                                                                    </button>
                                                                </div>
                                                            </div>
                                                            <HPBar current={monster.currentHp} max={monster.maxHp} />

                                                            {/* Monster Abilities */}
                                                            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                                                                <div className="flex items-center justify-between mb-2">
                                                                    <h5 className="text-sm font-bold text-gray-700 dark:text-gray-300">Yetenekler</h5>
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setShowAddMonsterAbility(showAddMonsterAbility === monster.id ? null : monster.id);
                                                                        }}
                                                                        className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-2 py-1 rounded hover:bg-purple-200 dark:hover:bg-purple-900/50"
                                                                    >
                                                                        {showAddMonsterAbility === monster.id ? 'İptal' : '+ Ekle'}
                                                                    </button>
                                                                </div>

                                                                {/* Add Ability Form */}
                                                                {showAddMonsterAbility === monster.id && (
                                                                    <div className="mb-3 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg space-y-2" onClick={e => e.stopPropagation()}>
                                                                        <input
                                                                            type="text"
                                                                            value={newMonsterAbilityName}
                                                                            onChange={(e) => setNewMonsterAbilityName(e.target.value)}
                                                                            placeholder="Yetenek Adı"
                                                                            className="w-full text-xs rounded border border-gray-300 dark:border-gray-600 px-2 py-1 dark:bg-gray-700 dark:text-white"
                                                                        />
                                                                        <div className="flex gap-1">
                                                                            <select
                                                                                value={newMonsterAbilityDiceCount}
                                                                                onChange={(e) => setNewMonsterAbilityDiceCount(parseInt(e.target.value))}
                                                                                className="flex-1 text-xs rounded border border-gray-300 dark:border-gray-600 px-1 py-1 dark:bg-gray-700 dark:text-white"
                                                                            >
                                                                                {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} Zar</option>)}
                                                                            </select>
                                                                            <select
                                                                                value={newMonsterAbilityDiceType}
                                                                                onChange={(e) => setNewMonsterAbilityDiceType(parseInt(e.target.value))}
                                                                                className="flex-1 text-xs rounded border border-gray-300 dark:border-gray-600 px-1 py-1 dark:bg-gray-700 dark:text-white"
                                                                            >
                                                                                {[4, 6, 8, 10, 12, 20].map(n => <option key={n} value={n}>d{n}</option>)}
                                                                            </select>
                                                                            <input
                                                                                type="number"
                                                                                value={newMonsterAbilityModifier}
                                                                                onChange={(e) => setNewMonsterAbilityModifier(parseInt(e.target.value) || 0)}
                                                                                placeholder="Bonus"
                                                                                className="w-12 text-xs rounded border border-gray-300 dark:border-gray-600 px-1 py-1 dark:bg-gray-700 dark:text-white"
                                                                            />
                                                                        </div>
                                                                        <button
                                                                            onClick={() => handleAddMonsterAbility(monster.id)}
                                                                            className="w-full bg-purple-600 text-white text-xs font-bold py-1 rounded hover:bg-purple-500"
                                                                        >
                                                                            Ekle
                                                                        </button>
                                                                    </div>
                                                                )}

                                                                {/* Abilities List */}
                                                                <div className="space-y-1">
                                                                    {(monster.abilities || []).map((ability) => (
                                                                        <div key={ability.id} className="flex items-center justify-between text-xs bg-gray-50 dark:bg-gray-700/30 p-2 rounded">
                                                                            <div>
                                                                                <span className="font-bold text-gray-800 dark:text-gray-200">{ability.name}</span>
                                                                                <span className="text-gray-500 dark:text-gray-400 ml-1">({ability.damageType})</span>
                                                                            </div>
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    // For now, auto-target the first selected player or random player
                                                                                    const targetId = selectedPlayerIds[0] || Object.keys(lobbyData?.players || {})[0];
                                                                                    if (targetId) handleMonsterAttack(monster.id, ability, targetId);
                                                                                    else alert('Hedef oyuncu yok!');
                                                                                }}
                                                                                className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-1 rounded hover:bg-red-200 dark:hover:bg-red-900/50 font-bold"
                                                                                title="Seçili oyuncuya saldır"
                                                                            >
                                                                                ⚔️ Saldır
                                                                            </button>
                                                                        </div>
                                                                    ))}
                                                                    {(!monster.abilities || monster.abilities.length === 0) && (
                                                                        <p className="text-xs text-gray-400 italic">Yetenek yok</p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                                {Object.keys(lobbyData?.monsters || {}).length === 0 && !showAddMonster && (
                                                    <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                                                        Henüz canavar yok. Eklemek için yukarıdaki butona tıklayın!
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* RIGHT: Combat Controls */}
                                    <div className="bg-white dark:bg-gray-800/50 backdrop-blur-lg rounded-3xl p-6 shadow-xl ring-1 ring-gray-900/10 dark:ring-white/10 h-fit sticky top-6">
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                            ⚡ Combat Controls
                                        </h3>

                                        {/* Selection Info */}
                                        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                                Seçili Hedefler:
                                            </p>
                                            <div className="flex gap-2">
                                                <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/40 px-3 py-1 rounded-full">
                                                    {selectedPlayerIds.length} Oyuncu
                                                </span>
                                                <span className="text-xs font-semibold text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/40 px-3 py-1 rounded-full">
                                                    {selectedMonsterIds.length} Canavar
                                                </span>
                                            </div>
                                        </div>

                                        {/* Amount Input */}
                                        <div className="mb-6">
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                Miktar (HP)
                                            </label>
                                            <input
                                                type="number"
                                                value={damageAmount}
                                                onChange={(e) => setDamageAmount(parseInt(e.target.value) || 0)}
                                                placeholder="0"
                                                min="0"
                                                className="w-full rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-center text-2xl font-bold text-gray-900 dark:text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                                            />
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="space-y-3">
                                            <button
                                                onClick={handleDealDamage}
                                                disabled={damageAmount <= 0 || (selectedPlayerIds.length === 0 && selectedMonsterIds.length === 0)}
                                                className="w-full rounded-xl bg-red-600 px-6 py-4 text-lg font-bold text-white shadow-lg hover:bg-red-500 hover:scale-105 hover:shadow-red-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                            >
                                                💥 Hasar Ver ({damageAmount} HP)
                                            </button>
                                            <button
                                                onClick={handleHeal}
                                                disabled={damageAmount <= 0 || (selectedPlayerIds.length === 0 && selectedMonsterIds.length === 0)}
                                                className="w-full rounded-xl bg-green-600 px-6 py-4 text-lg font-bold text-white shadow-lg hover:bg-green-500 hover:scale-105 hover:shadow-green-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                            >
                                                ✨ İyileştir (+{damageAmount} HP)
                                            </button>
                                        </div>

                                        {/* Quick Actions */}
                                        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                                            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                                                Hızlı İşlemler
                                            </p>
                                            <div className="grid grid-cols-3 gap-2">
                                                {[5, 10, 20].map((amount) => (
                                                    <button
                                                        key={amount}
                                                        onClick={() => setDamageAmount(amount)}
                                                        className="rounded-lg bg-gray-200 dark:bg-gray-700 px-3 py-2 text-sm font-bold text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-300"
                                                    >
                                                        {amount}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : myCharacter ? (
                            // Player View - Character Sheet
                            <div className="bg-white dark:bg-gray-800/50 backdrop-blur-lg rounded-3xl p-8 shadow-xl ring-1 ring-gray-900/10 dark:ring-white/10">
                                <div className="text-center mb-8 relative">
                                    <div className="inline-flex items-center gap-2 rounded-full bg-purple-100 dark:bg-purple-900/30 px-4 py-2 mb-4 border border-purple-200 dark:border-purple-700">
                                        <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
                                            Lobby ID:
                                        </span>
                                        <span className="text-lg font-mono font-bold text-purple-900 dark:text-purple-200">
                                            {lobbyId}
                                        </span>
                                    </div>

                                    <div className="flex flex-col items-center w-full max-w-md mx-auto">
                                        <div className="w-24 h-24 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-full flex items-center justify-center mb-4 shadow-lg ring-4 ring-purple-100 dark:ring-purple-900/50 relative group">
                                            <User className="w-12 h-12 text-white" />
                                            <div className="absolute -bottom-2 bg-yellow-400 text-yellow-900 text-xs font-black px-3 py-1 rounded-full shadow-lg border-2 border-white dark:border-gray-800">
                                                LVL {myCharacter.level || 1}
                                            </div>
                                        </div>

                                        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-500 mb-1">
                                            {myCharacter.name}
                                        </h2>
                                        <p className="text-lg text-gray-500 dark:text-gray-400 font-medium mb-3">
                                            {myCharacter.race} {myCharacter.class}
                                        </p>

                                        {/* XP Bar */}
                                        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-4 relative overflow-hidden ring-1 ring-gray-200 dark:ring-gray-600">
                                            <div
                                                className="absolute top-0 left-0 h-full bg-gradient-to-r from-yellow-400 to-orange-500 transition-all duration-1000 ease-out"
                                                style={{ width: `${Math.min(100, ((myCharacter.xp || 0) / (lobbyData?.xpSettings?.levelUpThreshold || 1000)) * 100)}%` }}
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-gray-600 dark:text-gray-300 drop-shadow-sm">
                                                {myCharacter.xp || 0} / {lobbyData?.xpSettings?.levelUpThreshold || 1000} XP
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* HP Bar */}
                                <div className="mb-8">
                                    <HPBar current={myCharacter.currentHp} max={myCharacter.maxHp} />
                                </div>

                                {/* Stats Grid */}
                                <div className="mb-8">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2 px-1">
                                        <Shield className="w-5 h-5 text-purple-600" />
                                        Özellikler
                                    </h3>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                        {Object.entries(myCharacter.stats).map(([key, value]) => {
                                            const modifier = calculateModifier(value);
                                            const modifierStr = modifier >= 0 ? `+${modifier}` : `${modifier}`;

                                            return (
                                                <button
                                                    key={key}
                                                    onClick={() => rollStatCheck(key, value)}
                                                    className="relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl p-4 text-center border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md hover:border-purple-200 dark:hover:border-purple-700 hover:-translate-y-1 transition-all duration-300 group"
                                                >
                                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                                    <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 group-hover:text-purple-600 dark:group-hover:text-purple-400">
                                                        {key}
                                                    </div>
                                                    <div className="text-3xl font-black text-gray-900 dark:text-white mb-1">
                                                        {value}
                                                    </div>
                                                    <div className="inline-block px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-xs font-bold text-purple-700 dark:text-purple-300">
                                                        {modifierStr}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Monsters in Combat */}
                                {Object.keys(lobbyData?.monsters || {}).length > 0 && (
                                    <div className="mb-8">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                            👹 Karşılaştığınız Yaratıklar
                                        </h3>
                                        <div className="space-y-3">
                                            {Object.values(lobbyData?.monsters || {}).map((monster) => (
                                                <div key={monster.id} className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl p-4">
                                                    <h4 className="font-bold text-red-900 dark:text-red-200 text-lg mb-2">
                                                        {monster.name}
                                                    </h4>
                                                    <p className="text-sm text-red-800 dark:text-red-300 italic">
                                                        {monster.description}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Abilities */}
                                <div className="mb-8">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                            ⚡ Yetenekler
                                        </h3>
                                        <button
                                            onClick={() => setShowAddAbility(!showAddAbility)}
                                            className="rounded-lg bg-purple-600 px-3 py-1.5 text-sm font-bold text-white hover:bg-purple-500 transition-all duration-300"
                                        >
                                            {showAddAbility ? 'İptal' : '+ Yetenek Ekle'}
                                        </button>
                                    </div>

                                    {/* Add Ability Form */}
                                    {showAddAbility && (
                                        <div className="mb-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl space-y-3">
                                            <input
                                                type="text"
                                                value={newAbilityName}
                                                onChange={(e) => setNewAbilityName(e.target.value)}
                                                placeholder="Yetenek Adı (örn: Ateş Topu)"
                                                className="w-full rounded-lg border-2 border-purple-300 dark:border-purple-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                                            />
                                            <textarea
                                                value={newAbilityDescription}
                                                onChange={(e) => setNewAbilityDescription(e.target.value)}
                                                placeholder="Açıklama (örn: Hedefine ateş topu fırlatır)"
                                                rows={2}
                                                className="w-full rounded-lg border-2 border-purple-300 dark:border-purple-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 resize-none"
                                            />
                                            <div className="flex gap-2">
                                                <select
                                                    value={newAbilityDiceCount}
                                                    onChange={(e) => setNewAbilityDiceCount(parseInt(e.target.value))}
                                                    className="flex-1 rounded-lg border-2 border-purple-300 dark:border-purple-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-purple-500 focus:outline-none"
                                                >
                                                    {[1, 2, 3, 4, 5].map(n => (
                                                        <option key={n} value={n}>{n} Zar</option>
                                                    ))}
                                                </select>
                                                <select
                                                    value={newAbilityDiceType}
                                                    onChange={(e) => setNewAbilityDiceType(parseInt(e.target.value))}
                                                    className="flex-1 rounded-lg border-2 border-purple-300 dark:border-purple-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-purple-500 focus:outline-none"
                                                >
                                                    {[4, 6, 8, 10, 12, 20].map(n => (
                                                        <option key={n} value={n}>d{n}</option>
                                                    ))}
                                                </select>
                                                <input
                                                    type="number"
                                                    value={newAbilityModifier}
                                                    onChange={(e) => setNewAbilityModifier(parseInt(e.target.value) || 0)}
                                                    placeholder="Bonus/Ceza"
                                                    className="flex-1 rounded-lg border-2 border-purple-300 dark:border-purple-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                                                />
                                            </div>
                                            <input
                                                type="number"
                                                value={newAbilityMaxUses}
                                                onChange={(e) => setNewAbilityMaxUses(parseInt(e.target.value) || 3)}
                                                placeholder="Günlük Kullanım (örn: 3)"
                                                min="1"
                                                className="w-full rounded-lg border-2 border-purple-300 dark:border-purple-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                                            />
                                            <button
                                                onClick={handleAddAbility}
                                                className="w-full rounded-lg bg-purple-600 px-4 py-2 text-sm font-bold text-white hover:bg-purple-500 transition-all duration-300"
                                            >
                                                Oluştur
                                            </button>
                                        </div>
                                    )}

                                    {/* Abilities List */}
                                    <div className="space-y-3">
                                        {(myCharacter.abilities || []).map((ability) => {
                                            const remaining = getRemainingUses(ability.id);
                                            const isExhausted = remaining <= 0;

                                            return (
                                                <div key={ability.id} className={`rounded-xl p-4 ${isExhausted ? 'bg-gray-100 dark:bg-gray-800/50 opacity-60' : 'bg-purple-50 dark:bg-purple-900/20'}`}>
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div className="flex-1">
                                                            <h4 className="font-bold text-gray-900 dark:text-white text-lg">
                                                                {ability.name}
                                                            </h4>
                                                            <p className="text-sm text-gray-600 dark:text-gray-400 italic mb-1">
                                                                {ability.description}
                                                            </p>
                                                            <div className="flex items-center gap-3 text-sm">
                                                                <span className="text-red-600 dark:text-red-400 font-semibold">
                                                                    💥 {ability.damageType}
                                                                </span>
                                                                <span className={`font-semibold ${isExhausted ? 'text-gray-500' : 'text-purple-600 dark:text-purple-400'}`}>
                                                                    {remaining}/{ability.maxUsesPerDay} kullanım
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Use Ability Section */}
                                                    {!isExhausted && selectedAbility?.id === ability.id ? (
                                                        <div className="mt-3 p-3 bg-white dark:bg-gray-800 rounded-lg space-y-2">
                                                            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Hedef Seç:</p>

                                                            {/* Target Type Selection */}
                                                            <div className="flex gap-2 mb-2">
                                                                <button
                                                                    onClick={() => setSelectedTargetType('monster')}
                                                                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${selectedTargetType === 'monster'
                                                                        ? 'bg-red-600 text-white'
                                                                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                                                        }`}
                                                                >
                                                                    👹 Canavar
                                                                </button>
                                                                <button
                                                                    onClick={() => setSelectedTargetType('player')}
                                                                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${selectedTargetType === 'player'
                                                                        ? 'bg-purple-600 text-white'
                                                                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                                                        }`}
                                                                >
                                                                    ⚔️ Oyuncu
                                                                </button>
                                                            </div>

                                                            {/* Target Selection */}
                                                            <select
                                                                value={selectedTargetId}
                                                                onChange={(e) => setSelectedTargetId(e.target.value)}
                                                                className="w-full rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-purple-500 focus:outline-none"
                                                            >
                                                                <option value="">-- Hedef Seç --</option>
                                                                {selectedTargetType === 'monster'
                                                                    ? Object.values(lobbyData?.monsters || {}).map((monster) => (
                                                                        <option key={monster.id} value={monster.id}>
                                                                            {monster.name} (HP: {monster.currentHp}/{monster.maxHp})
                                                                        </option>
                                                                    ))
                                                                    : Object.entries(lobbyData?.players || {}).map(([id, player]) =>
                                                                        player.character ? (
                                                                            <option key={id} value={id}>
                                                                                {player.character.name} (HP: {player.character.currentHp}/{player.character.maxHp}, AC: {player.character.armorClass || 10})
                                                                            </option>
                                                                        ) : null
                                                                    )
                                                                }
                                                            </select>

                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={() => handleUseAbility(ability)}
                                                                    disabled={!selectedTargetId}
                                                                    className="flex-1 rounded-lg bg-purple-600 px-4 py-2 text-sm font-bold text-white hover:bg-purple-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                                                >
                                                                    ⚡ Kullan
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedAbility(null);
                                                                        setSelectedTargetId('');
                                                                    }}
                                                                    className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
                                                                >
                                                                    İptal
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => setSelectedAbility(ability)}
                                                            disabled={isExhausted}
                                                            className={`w-full mt-2 rounded-lg px-4 py-2 text-sm font-bold transition-all duration-300 ${isExhausted
                                                                ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                                                                : 'bg-purple-600 text-white hover:bg-purple-500'
                                                                }`}
                                                        >
                                                            {isExhausted ? '❌ Kullanım Hakkı Bitti' : '⚡ Yetenek Kullan'}
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })}
                                        {(!myCharacter.abilities || myCharacter.abilities.length === 0) && (
                                            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                                                Henüz yetenek yok. Yukarıdaki butona tıklayarak yetenek ekleyin!
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Inventory */}
                                <div className="mb-8">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 px-1">
                                            <Scroll className="w-5 h-5 text-orange-600" />
                                            Çanta
                                        </h3>
                                        <button
                                            onClick={() => setShowAddItem(!showAddItem)}
                                            className="rounded-lg bg-orange-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-orange-500 transition-all duration-300 shadow-lg hover:shadow-orange-500/30"
                                        >
                                            {showAddItem ? 'İptal' : '+ Eşya Ekle'}
                                        </button>
                                    </div>

                                    {/* Add Item Form */}
                                    {showAddItem && (
                                        <div className="mb-4 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl space-y-3">
                                            <input
                                                type="text"
                                                value={newItemName}
                                                onChange={(e) => setNewItemName(e.target.value)}
                                                placeholder="Eşya Adı (örn: Şifa İksiri)"
                                                className="w-full rounded-lg border-2 border-orange-300 dark:border-orange-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                                            />
                                            <div className="flex gap-2">
                                                <select
                                                    value={newItemType}
                                                    onChange={(e) => setNewItemType(e.target.value as any)}
                                                    className="flex-1 rounded-lg border-2 border-orange-300 dark:border-orange-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-orange-500 focus:outline-none"
                                                >
                                                    <option value="weapon">⚔️ Silah</option>
                                                    <option value="armor">🛡️ Zırh</option>
                                                    <option value="potion">🧪 İksir</option>
                                                    <option value="misc">📦 Diğer</option>
                                                </select>
                                                <input
                                                    type="number"
                                                    value={newItemQuantity}
                                                    onChange={(e) => setNewItemQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                                    placeholder="Adet"
                                                    className="w-24 rounded-lg border-2 border-orange-300 dark:border-orange-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-orange-500 focus:outline-none"
                                                />
                                            </div>
                                            <textarea
                                                value={newItemDesc}
                                                onChange={(e) => setNewItemDesc(e.target.value)}
                                                placeholder="Açıklama"
                                                rows={2}
                                                className="w-full rounded-lg border-2 border-orange-300 dark:border-orange-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 resize-none"
                                            />
                                            {newItemType === 'potion' && (
                                                <div className="flex gap-2 items-center">
                                                    <span className="text-sm font-bold text-orange-600 dark:text-orange-400">İyileştirme:</span>
                                                    <select
                                                        value={newItemDiceCount}
                                                        onChange={(e) => setNewItemDiceCount(parseInt(e.target.value))}
                                                        className="flex-1 rounded-lg border-2 border-orange-300 dark:border-orange-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-orange-500 focus:outline-none"
                                                    >
                                                        {[1, 2, 3, 4, 5].map(n => (
                                                            <option key={n} value={n}>{n} Zar</option>
                                                        ))}
                                                    </select>
                                                    <select
                                                        value={newItemDiceType}
                                                        onChange={(e) => setNewItemDiceType(parseInt(e.target.value))}
                                                        className="flex-1 rounded-lg border-2 border-orange-300 dark:border-orange-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-orange-500 focus:outline-none"
                                                    >
                                                        {[4, 6, 8, 10, 12, 20].map(n => (
                                                            <option key={n} value={n}>d{n}</option>
                                                        ))}
                                                    </select>
                                                    <input
                                                        type="number"
                                                        value={newItemModifier}
                                                        onChange={(e) => setNewItemModifier(parseInt(e.target.value) || 0)}
                                                        placeholder="Bonus"
                                                        className="w-20 rounded-lg border-2 border-orange-300 dark:border-orange-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-orange-500 focus:outline-none"
                                                    />
                                                </div>
                                            )}
                                            <button
                                                onClick={handleAddItem}
                                                className="w-full rounded-lg bg-orange-600 px-4 py-2 text-sm font-bold text-white hover:bg-orange-500 transition-all duration-300"
                                            >
                                                Ekle
                                            </button>
                                        </div>
                                    )}

                                    {/* Inventory List */}
                                    <div className="space-y-3">
                                        {(myCharacter.inventory || []).map((item) => (
                                            <div key={item.id} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm ring-1 ring-gray-900/5 dark:ring-white/10 flex items-center justify-between group">
                                                <div className="flex items-start gap-3">
                                                    <span className="text-2xl mt-1">
                                                        {item.type === 'weapon' ? '⚔️' :
                                                            item.type === 'armor' ? '🛡️' :
                                                                item.type === 'potion' ? '🧪' : '📦'}
                                                    </span>
                                                    <div>
                                                        <h4 className="font-bold text-gray-900 dark:text-white text-sm">
                                                            {item.name} <span className="text-gray-500 dark:text-gray-400 font-normal">x{item.quantity}</span>
                                                        </h4>
                                                        <p className="text-xs text-gray-600 dark:text-gray-400">
                                                            {item.description}
                                                        </p>
                                                        {item.effect && (
                                                            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                                                                {item.effect}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {item.type === 'potion' && (
                                                        <button
                                                            onClick={() => handleUseItem(item)}
                                                            className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50"
                                                            title="Kullan"
                                                        >
                                                            ⚡
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleRemoveItem(item.id)}
                                                        className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50"
                                                        title="Sil"
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                        {(!myCharacter.inventory || myCharacter.inventory.length === 0) && (
                                            <p className="text-center text-gray-500 dark:text-gray-400 py-4 text-sm">
                                                Çantanız boş.
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-4">
                                    <button
                                        onClick={handleLeaveLobby}
                                        className="flex-1 rounded-xl bg-gray-200 dark:bg-gray-700 px-6 py-3 text-sm font-bold text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-300"
                                    >
                                        Lobby'den Ayrıl
                                    </button>
                                    <button
                                        onClick={() => navigate('/')}
                                        className="flex-1 rounded-xl bg-purple-600 px-6 py-3 text-sm font-bold text-white hover:bg-purple-500 transition-all duration-300"
                                    >
                                        Ana Sayfaya Dön
                                    </button>
                                </div>
                            </div>
                        ) : (
                            // Player View - Character Creation
                            <div className="bg-white dark:bg-gray-800/50 backdrop-blur-lg rounded-3xl p-8 shadow-xl ring-1 ring-gray-900/10 dark:ring-white/10">
                                <div className="text-center mb-8">
                                    <div className="inline-flex items-center gap-2 rounded-full bg-purple-100 dark:bg-purple-900/30 px-4 py-2 mb-4">
                                        <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
                                            Lobby ID:
                                        </span>
                                        <span className="text-lg font-mono font-bold text-purple-900 dark:text-purple-200">
                                            {lobbyId}
                                        </span>
                                    </div>

                                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                                        ⚔️ Karakter Oluştur
                                    </h2>
                                    <p className="text-gray-600 dark:text-gray-400">
                                        Maceraya başlamak için karakterini oluştur
                                    </p>
                                </div>

                                {/* Tabs */}
                                <div className="flex gap-2 mb-6">
                                    <button
                                        onClick={() => setCharacterTab('custom')}
                                        className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${characterTab === 'custom'
                                            ? 'bg-purple-600 text-white'
                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                                            }`}
                                    >
                                        Özel Karakter
                                    </button>
                                    <button
                                        onClick={() => setCharacterTab('preset')}
                                        className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${characterTab === 'preset'
                                            ? 'bg-purple-600 text-white'
                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                                            }`}
                                    >
                                        Hazır Karakterler
                                    </button>
                                </div>

                                {characterTab === 'custom' ? (
                                    <div className="space-y-6">
                                        {/* Character Name */}
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                Karakter Adı
                                            </label>
                                            <input
                                                type="text"
                                                value={characterName}
                                                onChange={(e) => setCharacterName(e.target.value)}
                                                placeholder="Örn: Aragorn"
                                                className="w-full rounded-xl border-0 bg-gray-50 dark:bg-gray-700 px-4 py-3 text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-purple-500"
                                            />
                                        </div>

                                        {/* Race and Class */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                    Irk
                                                </label>
                                                <select
                                                    value={selectedRace}
                                                    onChange={(e) => setSelectedRace(e.target.value as Race)}
                                                    className="w-full rounded-xl border-0 bg-gray-50 dark:bg-gray-700 px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                                                >
                                                    {RACES.map(race => (
                                                        <option key={race} value={race}>{race}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                    Sınıf
                                                </label>
                                                <select
                                                    value={selectedClass}
                                                    onChange={(e) => setSelectedClass(e.target.value as CharacterClass)}
                                                    className="w-full rounded-xl border-0 bg-gray-50 dark:bg-gray-700 px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                                                >
                                                    {CLASSES.map(cls => (
                                                        <option key={cls} value={cls}>{cls}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        {/* HP */}
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                Maksimum Can (HP)
                                            </label>
                                            <input
                                                type="number"
                                                value={maxHp}
                                                onChange={(e) => setMaxHp(parseInt(e.target.value) || 30)}
                                                min="1"
                                                className="w-full rounded-xl border-0 bg-gray-50 dark:bg-gray-700 px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                                            />
                                        </div>

                                        {/* Armor Class */}
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                Zırh Sınıfı (AC)
                                            </label>
                                            <input
                                                type="number"
                                                value={armorClass}
                                                onChange={(e) => setArmorClass(parseInt(e.target.value) || 10)}
                                                min="1"
                                                max="30"
                                                className="w-full rounded-xl border-0 bg-gray-50 dark:bg-gray-700 px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                                            />
                                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                                Varsayılan: 10 (Zırhsız)
                                            </p>
                                        </div>

                                        {/* Stats Grid */}
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                Özellikler
                                            </label>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                                        STR (Güç)
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={stats.str}
                                                        onChange={(e) => updateStat('str', parseInt(e.target.value) || 10)}
                                                        min="1"
                                                        max="20"
                                                        className="w-full rounded-lg border-0 bg-gray-50 dark:bg-gray-700 px-3 py-2 text-center text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                                        DEX (Çeviklik)
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={stats.dex}
                                                        onChange={(e) => updateStat('dex', parseInt(e.target.value) || 10)}
                                                        min="1"
                                                        max="20"
                                                        className="w-full rounded-lg border-0 bg-gray-50 dark:bg-gray-700 px-3 py-2 text-center text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                                        CON (Dayanıklılık)
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={stats.con}
                                                        onChange={(e) => updateStat('con', parseInt(e.target.value) || 10)}
                                                        min="1"
                                                        max="20"
                                                        className="w-full rounded-lg border-0 bg-gray-50 dark:bg-gray-700 px-3 py-2 text-center text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                                        INT (Zeka)
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={stats.int}
                                                        onChange={(e) => updateStat('int', parseInt(e.target.value) || 10)}
                                                        min="1"
                                                        max="20"
                                                        className="w-full rounded-lg border-0 bg-gray-50 dark:bg-gray-700 px-3 py-2 text-center text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                                        WIS (Bilgelik)
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={stats.wis}
                                                        onChange={(e) => updateStat('wis', parseInt(e.target.value) || 10)}
                                                        min="1"
                                                        max="20"
                                                        className="w-full rounded-lg border-0 bg-gray-50 dark:bg-gray-700 px-3 py-2 text-center text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                                        CHA (Karizma)
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={stats.cha}
                                                        onChange={(e) => updateStat('cha', parseInt(e.target.value) || 10)}
                                                        min="1"
                                                        max="20"
                                                        className="w-full rounded-lg border-0 bg-gray-50 dark:bg-gray-700 px-3 py-2 text-center text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Create Button */}
                                        <button
                                            onClick={handleCreateCharacter}
                                            disabled={isLoading || !characterName.trim()}
                                            className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4 text-lg font-bold text-white shadow-lg hover:from-purple-500 hover:to-pink-500 hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                        >
                                            {isLoading ? 'Oluşturuluyor...' : 'Karakteri Oluştur'}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <div className="text-6xl mb-4">🎭</div>
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                            Çok Yakında
                                        </h3>
                                        <p className="text-gray-600 dark:text-gray-400">
                                            Hazır karakterler yakında eklenecek!
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div >

            {/* Game Log - Fixed Bottom Left */}
            {
                currentLobby && (
                    <div className="fixed bottom-4 left-4 w-96 max-h-80 bg-gray-900/95 backdrop-blur-lg rounded-2xl shadow-2xl ring-1 ring-white/10 overflow-hidden z-50">
                        <div className="px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-between">
                            <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                📜 Oyun Logu
                            </h3>
                            <span className="text-xs text-white/80">{logs.length} kayıt</span>
                        </div>
                        <div
                            ref={logContainerRef}
                            className="overflow-y-auto max-h-64 p-3 space-y-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800"
                        >
                            {logs.length === 0 ? (
                                <p className="text-center text-gray-500 text-sm py-8">
                                    Henüz kayıt yok. Zar atın veya aksiyon yapın!
                                </p>
                            ) : (
                                logs.map((log) => {
                                    const time = new Date(log.timestamp).toLocaleTimeString('tr-TR', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    });

                                    // Color coding
                                    let valueColor = 'text-blue-400';
                                    if (log.type === 'damage') valueColor = 'text-red-400';
                                    else if (log.type === 'heal') valueColor = 'text-green-400';
                                    else if (log.value === 20) valueColor = 'text-yellow-400'; // Critical hit
                                    else if (log.value === 1) valueColor = 'text-red-400'; // Critical fail

                                    return (
                                        <div key={log.id} className="text-sm bg-gray-800/50 rounded-lg p-2">
                                            <div className="flex items-start gap-2">
                                                <span className="text-gray-500 text-xs mt-0.5">{time}</span>
                                                <div className="flex-1">
                                                    <span className="font-semibold text-purple-400">{log.sender}</span>
                                                    {log.type === 'dice' && log.detail.includes('d') && !log.detail.includes('Kontrolü') ? (
                                                        <>
                                                            <span className="text-gray-300"> zar attı: </span>
                                                            <span className="text-gray-400">{log.detail}</span>
                                                            <span className="text-gray-300"> = </span>
                                                            <span className={`font-bold ${valueColor}`}>{log.value}</span>
                                                            {log.value === 20 && <span className="ml-1">🎯</span>}
                                                            {log.value === 1 && <span className="ml-1">💀</span>}
                                                        </>
                                                    ) : (
                                                        <span className={`${log.type === 'damage' ? 'text-red-300' : log.type === 'heal' ? 'text-green-300' : 'text-gray-300'}`}>
                                                            {' '}{log.detail}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                )
            }

            {/* Dice Tray - Fixed Bottom Center */}
            {
                currentLobby && (
                    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-gray-900/95 backdrop-blur-lg rounded-full shadow-2xl ring-1 ring-white/10 px-6 py-2 z-50 flex items-center gap-4">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider hidden md:block">Zar Tepsisi</span>
                        {[4, 6, 8, 10, 12, 20].map((sides) => (
                            <button
                                key={sides}
                                onClick={() => rollDice(sides)}
                                className={`relative group p-2 rounded-xl transition-all duration-300 hover:scale-125 hover:-translate-y-2 ${sides === 20
                                    ? 'text-yellow-400 hover:text-yellow-300 hover:drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]'
                                    : 'text-purple-400 hover:text-purple-300 hover:drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]'
                                    }`}
                            >
                                <DiceIcon sides={sides} className="w-8 h-8 md:w-10 md:h-10" />
                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-gray-700 shadow-xl pointer-events-none">
                                    D{sides}
                                </div>
                            </button>
                        ))}
                    </div>
                )
            }

            {/* Rolling Animation Overlay */}
            {rollingDice && (
                <RollingOverlay
                    sides={rollingDice.sides}
                    result={rollingDice.result}
                    onClose={() => setRollingDice(null)}
                />
            )}

            {/* Chat Window - Fixed Bottom Right */}
            {
                currentLobby && (
                    <div className="fixed bottom-4 right-4 w-96 max-h-[32rem] bg-gray-900/95 backdrop-blur-lg rounded-2xl shadow-2xl ring-1 ring-white/10 overflow-hidden z-50 flex flex-col">
                        {/* Header */}
                        <div className="px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 flex items-center justify-between">
                            <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                💬 Sohbet
                            </h3>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-white/80">{Object.keys(lobbyData?.players || {}).length + 1} Kişi</span>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800 h-80">
                            {chatMessages.length === 0 ? (
                                <div className="text-center text-gray-500 text-sm py-4">
                                    Henüz mesaj yok.
                                </div>
                            ) : (
                                chatMessages.map((msg) => {
                                    // Filter logic: Show public, or private if I am sender or recipient
                                    if (msg.type === 'whisper') {
                                        if (msg.senderId !== user?.uid && msg.recipientId !== user?.uid) return null;
                                    }

                                    const isMe = msg.senderId === user?.uid;
                                    const isSystem = msg.type === 'system';
                                    const isWhisper = msg.type === 'whisper';

                                    return (
                                        <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                            <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${isSystem
                                                ? 'bg-yellow-900/30 text-yellow-200 border border-yellow-700 w-full text-center'
                                                : isWhisper
                                                    ? 'bg-purple-900/40 text-purple-200 border border-purple-700 italic'
                                                    : isMe
                                                        ? 'bg-blue-600 text-white'
                                                        : 'bg-gray-700 text-gray-200'
                                                }`}>
                                                {!isMe && !isSystem && (
                                                    <span className={`block text-xs font-bold mb-0.5 ${isWhisper ? 'text-purple-400' : 'text-blue-400'}`}>
                                                        {msg.senderName} {isWhisper && '(Fısıltı)'}
                                                    </span>
                                                )}
                                                {isMe && isWhisper && (
                                                    <span className="block text-xs font-bold mb-0.5 text-purple-300">
                                                        (Fısıltı → {msg.recipientId === lobbyData?.dm ? 'DM' : lobbyData?.players?.[msg.recipientId!]?.displayName || 'Oyuncu'})
                                                    </span>
                                                )}
                                                {msg.content}
                                            </div>
                                            <span className="text-[10px] text-gray-500 mt-1 px-1">
                                                {new Date(msg.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={(el) => { if (el) el.scrollIntoView({ behavior: 'smooth' }); }} />
                        </div>

                        {/* Input Area */}
                        <div className="p-3 bg-gray-800/80 border-t border-gray-700">
                            <div className="flex flex-col gap-2">
                                {/* Target Selection (Simple) */}
                                <select
                                    value={chatRecipientId}
                                    onChange={(e) => setChatRecipientId(e.target.value)}
                                    className="text-xs bg-gray-900 text-gray-300 border border-gray-600 rounded px-2 py-1 outline-none focus:border-blue-500"
                                >
                                    <option value="">Herkese (Public)</option>
                                    {isDM ? (
                                        // DM sees all players
                                        getPlayerList().map(p => (
                                            <option key={p.id} value={p.id}>{p.character?.name || p.name}</option>
                                        ))
                                    ) : (
                                        // Player sees DM
                                        lobbyData?.dm && <option value={lobbyData.dm}>Dungeon Master (DM)</option>
                                    )}
                                </select>

                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={chatInput}
                                        onChange={(e) => setChatInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                        placeholder="Mesaj yaz..."
                                        className="flex-1 bg-gray-900 text-white text-sm border border-gray-600 rounded-lg px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50"
                                    />
                                    <button
                                        onClick={handleSendMessage}
                                        disabled={!chatInput.trim()}
                                        className="bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-3 py-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        📩
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </MainLayout >
    );
};

export default DNDGamePage;
