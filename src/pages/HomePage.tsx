import React from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';

const HomePage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <MainLayout>
            <div className="relative isolate pt-14">
                {/* Background Effects */}
                <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
                    <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" style={{ clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)' }} />
                </div>

                <div className="py-24 sm:py-32 lg:pb-40">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="mx-auto max-w-2xl text-center">
                            <h1 className="text-4xl font-black tracking-tight text-gray-900 dark:text-white sm:text-6xl bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 animate-pulse">
                                Oyun Dünyasına Hoşgeldin
                            </h1>
                            <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
                                Arkadaşlarınla toplan, stratejini kur ve eğlencenin doruklarına çık.
                                En popüler parti oyunları şimdi parmaklarının ucunda.
                            </p>
                            <div className="mt-10 flex items-center justify-center gap-x-6">
                                <button
                                    onClick={() => document.getElementById('games')?.scrollIntoView({ behavior: 'smooth' })}
                                    className="rounded-full bg-purple-600 px-8 py-3.5 text-sm font-bold text-white shadow-lg hover:bg-purple-500 hover:scale-105 hover:shadow-purple-500/50 transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600"
                                >
                                    Hemen Oyna 🚀
                                </button>
                                <a href="#" className="text-sm font-semibold leading-6 text-gray-900 dark:text-white hover:text-purple-500 transition-colors">
                                    Daha Fazla Bilgi <span aria-hidden="true">→</span>
                                </a>
                            </div>
                        </div>

                        {/* Featured Stats or Floating Elements could go here */}
                    </div>
                </div>

                {/* Game Grid Section */}
                <div id="games" className="mx-auto max-w-7xl px-6 lg:px-8 pb-24">
                    <div className="mx-auto max-w-2xl text-center mb-12">
                        <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">Popüler Oyunlar</h2>
                        <p className="mt-2 text-lg leading-8 text-gray-600 dark:text-gray-400">Hemen oynamaya başlayabileceğin oyunlar.</p>
                    </div>

                    <div className="mx-auto grid max-w-lg grid-cols-1 gap-x-8 gap-y-12 sm:max-w-xl sm:grid-cols-2 lg:mx-0 lg:max-w-none lg:grid-cols-3">
                        {/* Casus Kim Card */}
                        <div
                            onClick={() => navigate('/spyfall')}
                            className="flex flex-col items-start justify-between bg-white dark:bg-gray-800/50 backdrop-blur-lg rounded-3xl p-6 shadow-xl ring-1 ring-gray-900/10 dark:ring-white/10 hover:ring-purple-500/50 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 cursor-pointer group"
                        >
                            <div className="relative w-full">
                                <img
                                    src="/images/spy-cover.png"
                                    alt="Casus Kim?"
                                    className="aspect-[16/9] w-full rounded-2xl bg-gray-100 object-cover sm:aspect-[2/1] lg:aspect-[3/2] group-hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-gray-900/10" />
                                <div className="absolute top-0 right-0 p-2">
                                    <span className="inline-flex items-center rounded-md bg-red-400/10 px-2 py-1 text-xs font-medium text-red-400 ring-1 ring-inset ring-red-400/20 backdrop-blur-md">Hot 🔥</span>
                                </div>
                            </div>
                            <div className="max-w-xl">
                                <div className="mt-8 flex items-center gap-x-4 text-xs">
                                    <span className="text-gray-500 dark:text-gray-400">Dedektiflik</span>
                                    <span className="relative z-10 rounded-full bg-gray-50 dark:bg-gray-700 px-3 py-1.5 font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600">3-10 Oyuncu</span>
                                </div>
                                <div className="group relative">
                                    <h3 className="mt-3 text-lg font-semibold leading-6 text-gray-900 dark:text-white group-hover:text-purple-400 transition-colors">
                                        <span className="absolute inset-0" />
                                        Casus Kim?
                                    </h3>
                                    <p className="mt-5 line-clamp-3 text-sm leading-6 text-gray-600 dark:text-gray-400">
                                        Aranızdaki casusu bulun! Zekanızı ve sezgilerinizi kullanarak sorular sorun, cevapları analiz edin ve haini ortaya çıkarın.
                                    </p>
                                </div>
                            </div>
                            <div className="mt-8 w-full">
                                <div className="w-full rounded-xl bg-purple-600/10 dark:bg-purple-900/20 py-3 text-center text-sm font-semibold text-purple-600 dark:text-purple-400 group-hover:bg-purple-600 group-hover:text-white transition-all">
                                    Oyuna Katıl →
                                </div>
                            </div>
                        </div>

                        {/* D&D Game Card */}
                        <div
                            onClick={() => navigate('/dnd-game')}
                            className="flex flex-col items-start justify-between bg-white dark:bg-gray-800/50 backdrop-blur-lg rounded-3xl p-6 shadow-xl ring-1 ring-gray-900/10 dark:ring-white/10 hover:ring-purple-500/50 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 cursor-pointer group"
                        >
                            <div className="relative w-full">
                                <div className="aspect-[16/9] w-full rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center sm:aspect-[2/1] lg:aspect-[3/2] group-hover:scale-105 transition-transform duration-500">
                                    <span className="text-6xl">🐉</span>
                                </div>
                                <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-gray-900/10" />
                                <div className="absolute top-0 right-0 p-2">
                                    <span className="inline-flex items-center rounded-md bg-green-400/10 px-2 py-1 text-xs font-medium text-green-400 ring-1 ring-inset ring-green-400/20 backdrop-blur-md">Yeni ✨</span>
                                </div>
                            </div>
                            <div className="max-w-xl">
                                <div className="mt-8 flex items-center gap-x-4 text-xs">
                                    <span className="text-gray-500 dark:text-gray-400">RPG</span>
                                    <span className="relative z-10 rounded-full bg-gray-50 dark:bg-gray-700 px-3 py-1.5 font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600">2-8 Oyuncu</span>
                                </div>
                                <div className="group relative">
                                    <h3 className="mt-3 text-lg font-semibold leading-6 text-gray-900 dark:text-white group-hover:text-purple-400 transition-colors">
                                        <span className="absolute inset-0" />
                                        D&D Macera
                                    </h3>
                                    <p className="mt-5 line-clamp-3 text-sm leading-6 text-gray-600 dark:text-gray-400">
                                        Metin tabanlı çok oyunculu RPG deneyimi. Dungeon Master olarak macera yarat veya oyuncu olarak efsanevi maceralara katıl.
                                    </p>
                                </div>
                            </div>
                            <div className="mt-8 w-full">
                                <div className="w-full rounded-xl bg-purple-600/10 dark:bg-purple-900/20 py-3 text-center text-sm font-semibold text-purple-600 dark:text-purple-400 group-hover:bg-purple-600 group-hover:text-white transition-all">
                                    Maceraya Başla →
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Background Blobs Bottom */}
                <div className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]" aria-hidden="true">
                    <div className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]" style={{ clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)' }} />
                </div>
            </div>
        </MainLayout>
    );
};

export default HomePage;