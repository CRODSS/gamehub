import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
    const { loginWithGoogle, loginAsGuest, loginWithEmail, registerWithEmail } = useAuth();

    // UI State
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [showGuest, setShowGuest] = useState(false);

    // Form State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [nickname, setNickname] = useState('');
    const [guestName, setGuestName] = useState('');

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (mode === 'login') {
                await loginWithEmail(email, password);
                // Başarı durumunda loading true kalır, yönlendirme beklenir
            } else {
                if (!nickname.trim()) throw new Error('Takma ad gereklidir.');
                await registerWithEmail(email, password, nickname);
            }
        } catch (err: any) {
            console.error(err);
            setLoading(false); // Sadece hata olursa loading kapat
            if (err.code === 'auth/invalid-credential') setError('Hatalı e-posta veya şifre.');
            else if (err.code === 'auth/email-already-in-use') setError('Bu e-posta zaten kullanımda.');
            else if (err.code === 'auth/weak-password') setError('Şifre çok zayıf (en az 6 karakter).');
            else if (err.code === 'auth/network-request-failed') setError('Ağ hatası. Bağlantınızı kontrol edin.');
            else setError(err.message || 'Bir hata oluştu.');
        }
    };

    const handleGuestLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!guestName.trim()) return;
        try {
            await loginAsGuest(guestName);
        } catch (err) {
            setError('Misafir girişi yapılırken bir hata oluştu.');
        }
    };

    if (showGuest) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
                <div className="w-full max-w-md bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-700">
                    <div className="p-8 text-center border-b border-gray-700">
                        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-2">GameHub</h1>
                        <p className="text-gray-400">Misafir Girişi</p>
                    </div>
                    <div className="p-8 space-y-6">
                        <form onSubmit={handleGuestLogin} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Takma Ad</label>
                                <input
                                    type="text"
                                    placeholder="Kaptan"
                                    value={guestName}
                                    onChange={(e) => setGuestName(e.target.value)}
                                    className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
                                    maxLength={15}
                                />
                            </div>
                            <button type="submit" disabled={!guestName.trim()} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-all">
                                Başla
                            </button>
                        </form>
                        <button onClick={() => setShowGuest(false)} className="w-full text-sm text-gray-400 hover:text-white">
                            ← Giriş ekranına dön
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
            <div className="w-full max-w-md bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-700">

                {/* Header */}
                <div className="p-8 text-center border-b border-gray-700">
                    <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-2">
                        GameHub
                    </h1>
                    <p className="text-gray-400">Hesabınla giriş yap ve karakterini koru</p>
                </div>

                {/* Body */}
                <div className="p-8">
                    {/* Tabs */}
                    <div className="flex bg-gray-700 rounded-lg p-1 mb-6">
                        <button
                            onClick={() => setMode('login')}
                            className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${mode === 'login' ? 'bg-gray-600 text-white shadow' : 'text-gray-400 hover:text-gray-200'}`}
                        >
                            Giriş Yap
                        </button>
                        <button
                            onClick={() => setMode('register')}
                            className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${mode === 'register' ? 'bg-gray-600 text-white shadow' : 'text-gray-400 hover:text-gray-200'}`}
                        >
                            Kayıt Ol
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleEmailAuth} className="space-y-4">
                        {mode === 'register' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Takma Ad</label>
                                <input
                                    type="text"
                                    placeholder="Oyun içi ismin"
                                    value={nickname}
                                    onChange={(e) => setNickname(e.target.value)}
                                    className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 outline-none"
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">E-posta</label>
                            <input
                                type="email"
                                placeholder="ornek@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Şifre</label>
                            <input
                                type="password"
                                placeholder="******"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 outline-none"
                            />
                        </div>

                        {error && <p className="text-red-400 text-sm text-center">{error}</p>}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-3 px-4 rounded-xl transition-all hover:scale-[1.02] shadow-lg"
                        >
                            {loading ? 'İşleniyor...' : mode === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}
                        </button>
                    </form>

                    <div className="relative flex items-center justify-center my-6">
                        <div className="border-t border-gray-600 w-full"></div>
                        <span className="absolute bg-gray-800 px-3 text-sm text-gray-500">veya</span>
                    </div>

                    <button
                        onClick={loginWithGoogle}
                        className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-900 font-semibold py-3 px-4 rounded-xl transition-all duration-200 mb-4"
                    >
                        <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                        Google ile {mode === 'login' ? 'Giriş' : 'Kayıt'}
                    </button>

                    <button
                        onClick={() => setShowGuest(true)}
                        className="w-full text-sm text-gray-500 hover:text-gray-300 underline"
                    >
                        Misafir olarak devam et
                    </button>
                </div>
            </div>
        </div>
    );
}