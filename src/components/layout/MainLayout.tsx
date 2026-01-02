import type { ReactNode } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import { Home, User, Settings, LogOut, Gamepad2 } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface MainLayoutProps {
    children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
    const { user, logout } = useAuth();
    const { t } = useSettings();
    const location = useLocation();

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex transition-colors duration-300">
            {/* Sidebar (Sol Menü) */}
            <aside className="w-20 lg:w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col fixed h-full z-20 transition-all duration-300">
                <div className="h-20 flex items-center justify-center lg:justify-start lg:px-6 border-b border-gray-200 dark:border-gray-700">
                    <Gamepad2 className="w-8 h-8 text-blue-500" />
                    <span className="hidden lg:block ml-3 font-bold text-xl tracking-tight text-gray-800 dark:text-white">GameHub</span>
                </div>

                <nav className="flex-1 py-6 px-3 space-y-2">
                    <SidebarItem icon={<Home size={22} />} label={t('games')} path="/" active={location.pathname === '/'} />
                    <SidebarItem icon={<User size={22} />} label={t('profile')} path="/profile" active={location.pathname === '/profile'} />
                    <SidebarItem icon={<Settings size={22} />} label={t('settings')} path="/settings" active={location.pathname === '/settings'} />
                </nav>

                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                        onClick={logout}
                        className="w-full flex items-center justify-center lg:justify-start gap-3 p-3 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors"
                    >
                        <LogOut size={20} />
                        <span className="hidden lg:inline font-medium">{t('logout')}</span>
                    </button>
                </div>
            </aside>

            {/* Ana İçerik Alanı */}
            <main className="flex-1 ml-20 lg:ml-64 p-4 lg:p-8">
                {/* Üst Bar (Mobil uyumlu header) */}
                <header className="flex justify-between items-center mb-8 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm p-4 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 sticky top-4 z-10 transition-colors duration-300">
                    <div>
                        <h2 className="text-gray-500 dark:text-gray-400 text-sm">{t('welcome')},</h2>
                        <p className="font-bold text-lg text-gray-900 dark:text-white">{user?.nickname || t('guest')}</p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center font-bold text-white shadow-lg">
                        {user?.nickname?.charAt(0).toUpperCase()}
                    </div>
                </header>

                {children}
            </main>
        </div>
    );
}

// Yardımcı Bileşen: Menü Öğesi
function SidebarItem({ icon, label, path, active = false }: { icon: any, label: string, path: string, active?: boolean }) {
    return (
        <Link
            to={path}
            className={`w-full flex items-center justify-center lg:justify-start gap-4 p-3 rounded-xl transition-all ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'}`}
        >
            {typeof icon === 'string' ? <span className="text-xl">{icon}</span> : icon}
            <span className="hidden lg:inline font-medium">{label}</span>
        </Link>
    );
}