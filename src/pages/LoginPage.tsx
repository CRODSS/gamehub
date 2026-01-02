import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
    const { loginWithGoogle, loginAsGuest } = useAuth();
    const [guestName, setGuestName] = useState('');
    const [error, setError] = useState('');

    const handleGuestLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!guestName.trim()) return;
        try {
            await loginAsGuest(guestName);
        } catch (err) {
            setError('Giriş yapılırken bir hata oluştu.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
            {/* Kart Yapısı */}
            <div className="w-full max-w-md bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-700">

                {/* Üst Kısım: Logo ve Başlık */}
                <div className="p-8 text-center border-b border-gray-700">
                    <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-2">
                        GameHub
                    </h1>
                    <p className="text-gray-400">Arkadaşlarınla hemen oynamaya başla</p>
                </div>

                {/* Orta Kısım: Butonlar */}
                <div className="p-8 space-y-6">

                    {/* Google Butonu */}
                    <button
                        onClick={loginWithGoogle}
                        className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-900 font-semibold py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02]"
                    >
                        <img
                            src="https://www.google.com/favicon.ico"
                            alt="Google"
                            className="w-5 h-5"
                        />
                        Google ile Devam Et
                    </button>

                    {/* Ayırıcı Çizgi */}
                    <div className="relative flex items-center justify-center">
                        <div className="border-t border-gray-600 w-full"></div>
                        <span className="absolute bg-gray-800 px-3 text-sm text-gray-500">veya</span>
                    </div>

                    {/* Misafir Girişi Formu */}
                    <form onSubmit={handleGuestLogin} className="space-y-4">
                        <div>
                            <label htmlFor="nickname" className="block text-sm font-medium text-gray-300 mb-1">
                                Misafir Girişi
                            </label>
                            <input
                                type="text"
                                id="nickname"
                                placeholder="Bir takma ad gir (Örn: Kaptan)"
                                value={guestName}
                                onChange={(e) => setGuestName(e.target.value)}
                                className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-gray-500"
                                maxLength={15}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={!guestName.trim()}
                            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-xl transition-all duration-200"
                        >
                            Başla
                        </button>
                    </form>

                    {error && (
                        <p className="text-red-400 text-sm text-center mt-2">{error}</p>
                    )}
                </div>

                {/* Alt Bilgi */}
                <div className="bg-gray-750 p-4 text-center text-xs text-gray-500 border-t border-gray-700">
                    Dark Mode • Türkçe • Güvenli Giriş
                </div>
            </div>
        </div>
    );
}