import { Play, Users } from 'lucide-react';

export interface Game {
    id: string;
    title: string;
    description: string;
    playerCount: number;
    category: string;
    status: 'active' | 'maintenance' | 'coming_soon';
    imageUrl: string;
    tags: string[];
}

interface GameCardProps {
    game: Game;
    onPlay: () => void;
}

export default function GameCard({ game, onPlay }: GameCardProps) {
    return (
        <div className="group relative bg-white dark:bg-gray-800 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 hover:border-purple-500/50 dark:hover:border-purple-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/10 hover:-translate-y-1 cursor-pointer flex flex-col h-full">

            {/* Image Section */}
            <div className="h-48 relative overflow-hidden">
                <div className="absolute inset-0 bg-gray-900/10 dark:bg-black/20 group-hover:bg-transparent transition-all z-10" />
                <img
                    src={game.imageUrl}
                    alt={game.title}
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                />

                {/* Overlay Tags/Badges */}
                <div className="absolute top-3 left-3 z-20 flex gap-2">
                    <span className="px-2 py-1 rounded-lg bg-black/50 backdrop-blur-md text-xs font-medium text-white border border-white/10">
                        {game.category}
                    </span>
                </div>

                <div className="absolute bottom-3 right-3 z-20 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-xs text-white border border-white/10">
                    <Users size={12} />
                    <span>{game.playerCount.toLocaleString()}</span>
                </div>
            </div>

            {/* Content Section */}
            <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                        {game.title}
                    </h3>
                    {game.status === 'active' ? (
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                        </span>
                    ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-600">
                            {game.status === 'coming_soon' ? 'Yakında' : 'Bakımda'}
                        </span>
                    )}
                </div>

                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                    {game.description}
                </p>

                {/* Tags Grid */}
                <div className="flex flex-wrap gap-2 mb-6">
                    {game.tags.map((tag, index) => (
                        <span key={index} className="text-xs text-gray-500 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/50 px-2 py-1 rounded border border-gray-100 dark:border-gray-700/50">
                            #{tag}
                        </span>
                    ))}
                </div>

                {/* Action Button */}
                <div className="mt-auto">
                    <button
                        onClick={onPlay}
                        disabled={game.status !== 'active'}
                        className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${game.status === 'active'
                            ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 group-hover:bg-purple-600 dark:group-hover:bg-purple-500 group-hover:text-white dark:group-hover:text-white shadow-lg shadow-purple-500/20'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                            }`}
                    >
                        {game.status === 'active' ? (
                            <>
                                <Play size={18} fill="currentColor" />
                                Oyna
                            </>
                        ) : (
                            game.status === 'coming_soon' ? 'Çok Yakında' : 'Bakımda'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}