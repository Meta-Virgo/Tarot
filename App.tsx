import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
    Sparkles, Mic, MicOff, Volume2, StopCircle,
    ArrowRight, Loader2, Minimize2, Info, Eye
} from 'lucide-react';
import { SPREADS, DECKS } from './constants';
import { CardInstance, Spread, GameState } from './types';
import { CardBack, CardFront } from './components/Card';
import { getTarotReading, getSpeechFromText } from './services/geminiService';
import { pcmToWav } from './utils';

// --- Ambient Background Magic Circle ---
// A massive, simplified version of the circle that creates atmosphere
const AmbientMagicCircle = ({ active }: { active: boolean }) => {
    return (
        <div 
            className={`fixed inset-0 pointer-events-none z-0 flex items-center justify-center transition-all duration-[3000ms] ease-in-out ${active ? 'opacity-20 scale-110' : 'opacity-[0.03] scale-100'}`}
        >
            <div className="w-[140vmax] h-[140vmax] animate-spin-ultra-slow text-indigo-900">
                <svg viewBox="0 0 600 600" className="w-full h-full overflow-visible">
                    {/* Giant Outer Ring */}
                    <circle cx="300" cy="300" r="280" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 6" />
                    <circle cx="300" cy="300" r="260" fill="none" stroke="currentColor" strokeWidth="0.5" />
                    
                    {/* Large Geometric Star */}
                    <path d="M300 50 L360 200 L550 300 L360 400 L300 550 L240 400 L50 300 L240 200 Z" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.5" />
                    
                    {/* Inner Pattern */}
                    <rect x="150" y="150" width="300" height="300" fill="none" stroke="currentColor" strokeWidth="0.5" transform="rotate(45 300 300)" opacity="0.3" />
                </svg>
            </div>
        </div>
    );
};

// --- Advanced Mystic Magic Circle (Sakura Style - Complex) ---
// Features: Nested circles, Planetary gears, High density geometry
const SakuraMagicCircle = () => {
    return (
        <div className="relative w-80 h-80 md:w-[450px] md:h-[450px] flex items-center justify-center pointer-events-none select-none">
            
            {/* --- Layer 1: Base Runes (Slow Clockwise) --- */}
            <div className="absolute inset-0 animate-spin-ultra-slow opacity-60">
                <svg viewBox="0 0 400 400" className="w-full h-full text-indigo-400 overflow-visible">
                    <defs>
                        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="2" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                    </defs>
                    {/* Main Rings */}
                    <circle cx="200" cy="200" r="195" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.5" />
                    <circle cx="200" cy="200" r="150" fill="none" stroke="currentColor" strokeWidth="0.8" opacity="0.8" />
                    
                    {/* Complex Ticks */}
                    {Array.from({length: 60}).map((_, i) => (
                        <line key={i} x1="200" y1="5" x2="200" y2={i % 5 === 0 ? "25" : "15"} stroke="currentColor" strokeWidth={i % 5 === 0 ? "1" : "0.5"} transform={`rotate(${i * 6} 200 200)`} opacity={i % 5 === 0 ? "0.8" : "0.3"} />
                    ))}
                    
                    {/* Cardinal Directions */}
                    <path d="M200 10 L200 50 M200 350 L200 390 M10 200 L50 200 M350 200 L390 200" stroke="currentColor" strokeWidth="1.5" />
                </svg>
            </div>

            {/* --- Layer 2: Planetary Gears (Counter-Clockwise - Nested Circles) --- */}
            <div className="absolute inset-[-10%] animate-spin-reverse-slower opacity-70">
                <svg viewBox="0 0 500 500" className="w-full h-full text-indigo-300 overflow-visible">
                    {/* Four Satellite Circles at Cardinals */}
                    {[0, 90, 180, 270].map((deg, i) => (
                        <g key={i} transform={`rotate(${deg} 250 250) translate(0, -200)`}>
                            {/* The Satellite Circle Itself */}
                            <g className="animate-spin-slow origin-center">
                                <circle cx="0" cy="0" r="35" fill="none" stroke="currentColor" strokeWidth="0.8" />
                                <circle cx="0" cy="0" r="28" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="3 2" />
                                {/* Inner Star of Satellite */}
                                <path d="M0 -35 L0 35 M-35 0 L35 0" stroke="currentColor" strokeWidth="0.5" opacity="0.5" />
                                <rect x="-15" y="-15" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="0.5" transform="rotate(45)" />
                            </g>
                        </g>
                    ))}
                </svg>
            </div>

            {/* --- Layer 3: Geometric Web (Counter-Clockwise Rotation) --- */}
            <div className="absolute inset-[15%] animate-spin-reverse-slower opacity-80">
                <svg viewBox="0 0 300 300" className="w-full h-full text-indigo-500 overflow-visible">
                    {/* Intersecting Squares */}
                    <rect x="50" y="50" width="200" height="200" fill="none" stroke="currentColor" strokeWidth="0.8" opacity="0.7" />
                    <rect x="50" y="50" width="200" height="200" fill="none" stroke="currentColor" strokeWidth="0.8" opacity="0.7" transform="rotate(45 150 150)" />
                    
                    {/* Connecting Hexagram Lines */}
                    <path d="M150 20 L262 215 L38 215 Z" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.4" transform="rotate(0 150 150)" />
                    <path d="M150 280 L262 85 L38 85 Z" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.4" transform="rotate(0 150 150)" />
                    
                    <circle cx="150" cy="150" r="80" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="4 4" opacity="0.5" />
                </svg>
            </div>

            {/* --- Layer 4: Celestial Orbit (Medium Clockwise Rotation) --- */}
            <div className="absolute inset-[5%] animate-spin-slower">
                <svg viewBox="0 0 360 360" className="w-full h-full text-indigo-400 overflow-visible">
                     {/* Sun (Right) */}
                     <g transform="translate(290, 180) rotate(90)">
                        <circle r="22" fill="white" fillOpacity="0.05" stroke="currentColor" strokeWidth="1" />
                        <circle r="8" fill="currentColor" opacity="0.4" />
                        {Array.from({length: 12}).map((_, i) => (
                             <line key={i} x1="0" y1="-14" x2="0" y2="-26" stroke="currentColor" strokeWidth="0.8" transform={`rotate(${i * 30})`} />
                        ))}
                    </g>

                    {/* Moon (Left) */}
                    <g transform="translate(70, 180) rotate(-90)">
                        <circle r="22" fill="white" fillOpacity="0.05" stroke="currentColor" strokeWidth="1" />
                        <path d="M-8 -12 A 12 12 0 1 0 -8 12 A 10 10 0 1 1 -8 -12" fill="currentColor" opacity="0.4" />
                        <circle r="28" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 4" />
                    </g>
                </svg>
            </div>

            {/* --- Layer 5: Central Star Core (No Dot, Just Geometry) --- */}
            <div className="absolute inset-[25%] animate-breathing">
                <svg viewBox="0 0 200 200" className="w-full h-full text-indigo-600 drop-shadow-[0_0_15px_rgba(99,102,241,0.6)] overflow-visible">
                    {/* Large Star */}
                    <polygon 
                        points="100,10 125,80 195,80 140,125 160,190 100,150 40,190 60,125 5,80 75,80" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="1.2" 
                    />
                    {/* Inner Star Details */}
                    <polygon 
                        points="100,10 125,80 195,80 140,125 160,190 100,150 40,190 60,125 5,80 75,80" 
                        fill="currentColor" 
                        fillOpacity="0.08"
                        stroke="none"
                        transform="scale(0.6) translate(66 66)"
                    />
                </svg>
            </div>

            {/* Background Ambient Glow (Breathing) */}
            <div className="absolute w-2/3 h-2/3 bg-indigo-500/10 rounded-full blur-[60px] animate-pulse-slow"></div>
        </div>
    );
};

// --- Reveal Magic Effect (Behind cards when flipped) ---
const RevealMagicEffect = () => (
    <div className="absolute inset-[-60%] z-0 pointer-events-none animate-spin-slow opacity-0 animate-fade-in">
        {/* INCREASED VISIBILITY: Darker text, thicker stroke, opacity bumped up */}
        <svg viewBox="0 0 200 200" className="w-full h-full text-indigo-500/70 drop-shadow-md">
             <defs>
                <radialGradient id="fadeGrad" cx="50%" cy="50%" r="50%">
                    <stop offset="50%" stopColor="currentColor" stopOpacity="1"/>
                    <stop offset="100%" stopColor="currentColor" stopOpacity="0"/>
                </radialGradient>
            </defs>
            {/* Thicker strokes for better visibility */}
            <circle cx="100" cy="100" r="90" fill="none" stroke="url(#fadeGrad)" strokeWidth="2" />
            <circle cx="100" cy="100" r="70" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4" />
            <path d="M100 20 L100 180 M20 100 L180 100" stroke="currentColor" strokeWidth="1.5" opacity="0.6" transform="rotate(45 100 100)" />
            {/* Added inner ring for more visual weight */}
            <circle cx="100" cy="100" r="50" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.5" />
        </svg>
    </div>
);

export default function TarotApp() {
    const [gameState, setGameState] = useState<GameState>('intro');
    const [selectedSpread, setSelectedSpread] = useState<Spread>(SPREADS[1]);
    const [deck, setDeck] = useState<CardInstance[]>([]);
    const [selectedCards, setSelectedCards] = useState<CardInstance[]>([]);
    const [revealedCards, setRevealedCards] = useState<boolean[]>([]);
    const [currentReading, setCurrentReading] = useState<number | null>(null);
    
    // AI & Input
    const [userQuestion, setUserQuestion] = useState('');
    const [aiReading, setAiReading] = useState('');
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [showAiModal, setShowAiModal] = useState(false);
    
    // Voice
    const [isListening, setIsListening] = useState(false);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [isPlayingAudio, setIsPlayingAudio] = useState(false);
    const audioRef = useRef<HTMLAudioElement>(null);

    // Deck Settings
    const [useFullDeck, setUseFullDeck] = useState(false);
    const [showDeckInfo, setShowDeckInfo] = useState(false);
    
    // UI Helpers
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Shuffle Logic
    useEffect(() => {
        if (gameState === 'shuffling') {
            // Reset reading state specifically for new game round
            setAiReading(''); 
            setAudioUrl(null); 
            setIsPlayingAudio(false); 
            setSelectedCards([]); 
            setRevealedCards(new Array(selectedSpread.cardCount).fill(false)); 
            setCurrentReading(null);
            setShowAiModal(false);
            
            // Choose deck
            const sourceDeck = useFullDeck ? DECKS.full : DECKS.majors;
            
            // Shuffle
            const shuffled = [...sourceDeck]
                .sort(() => Math.random() - 0.5)
                .map(card => ({ 
                    ...card, 
                    isReversed: Math.random() > 0.3, 
                    uuid: Math.random().toString(36).substr(2, 9) 
                }));
            
            setDeck(shuffled);
            
            const timer = setTimeout(() => setGameState('picking'), 2500);
            return () => clearTimeout(timer);
        }
    }, [gameState, useFullDeck, selectedSpread.cardCount]);

    // Completely reset the game to initial state
    const resetFullGame = () => {
        setGameState('intro');
        setUserQuestion('');
        setAiReading('');
        setAudioUrl(null);
        setIsPlayingAudio(false);
        setSelectedCards([]);
        setRevealedCards([]);
        setCurrentReading(null);
        setShowAiModal(false);
        setDeck([]);
        setIsAiLoading(false);
    };

    const handleCardPick = (index: number) => {
        if (selectedCards.length >= selectedSpread.cardCount) return;
        
        const newCard = deck[index];
        const newDeck = deck.filter((_, i) => i !== index);
        
        setDeck(newDeck);
        const nextSelected = [...selectedCards, newCard];
        setSelectedCards(nextSelected);

        if (nextSelected.length === selectedSpread.cardCount) {
            setTimeout(() => setGameState('reading'), 800);
        }
    };

    const handleCardInteraction = (index: number) => {
        if (!revealedCards[index]) {
            const newRevealed = [...revealedCards];
            newRevealed[index] = true;
            setRevealedCards(newRevealed);
        }
        setCurrentReading(index);
    };

    const toggleVoiceInput = () => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) { 
            alert("您的浏览器不支持语音功能"); 
            return; 
        }
        
        if (isListening) { 
            setIsListening(false); 
            return; 
        }

        setIsListening(true);
        const recognition = new SpeechRecognition();
        recognition.lang = 'zh-CN';
        recognition.start();

        recognition.onresult = (e: any) => { 
            setUserQuestion(e.results[0][0].transcript); 
            setIsListening(false); 
        };
        recognition.onspeechend = () => { 
            recognition.stop(); 
            setIsListening(false); 
        };
        recognition.onerror = () => setIsListening(false);
    };

    const handleActionClick = async () => {
        // 1. If we already have a reading, just show it (Persistence)
        if (aiReading) {
            setShowAiModal(true);
            return;
        }

        // 2. Otherwise generate new
        if (isAiLoading) return;
        
        setIsAiLoading(true);
        setShowAiModal(true);
        
        if (audioRef.current) { 
            audioRef.current.pause(); 
            setIsPlayingAudio(false); 
        }

        try {
            // Text Gen
            const text = await getTarotReading(userQuestion, selectedSpread, selectedCards);
            setAiReading(text);

            // Audio Gen
            const audioData = await getSpeechFromText(text);
            if (audioData) {
                setAudioUrl(pcmToWav(audioData));
            }
        } catch (e) {
            console.error(e);
            setAiReading("连接中断，请重试");
        } finally {
            setIsAiLoading(false);
        }
    };

    const toggleAudio = () => {
        if (!audioRef.current) return;
        if (isPlayingAudio) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlayingAudio(!isPlayingAudio);
    };

    const renderCardInLayout = (index: number) => {
        const card = selectedCards[index];
        const revealed = revealedCards[index];
        const position = selectedSpread.positions[index];
        const isDiamond = selectedSpread.layout === 'diamond';
        
        const gridArea = isDiamond ? ['center', 'left', 'right', 'bottom', 'top'][index] : undefined;

        const cardClass = isDiamond 
            ? 'w-[70px] h-[110px] md:w-24 md:h-40' 
            : 'w-[80px] h-[120px] md:w-32 md:h-52';

        const isActive = currentReading === index;
        const isAnyActive = currentReading !== null;

        return (
            <div key={index} style={{ gridArea }} className={`flex flex-col items-center group relative ${!isDiamond ? 'mx-auto' : ''}`}>
                <p 
                    className={`text-[9px] md:text-[10px] font-serif uppercase tracking-[0.2em] mb-2 md:mb-4 opacity-0 animate-fade-in-up font-medium transition-all duration-500 ${isActive ? 'text-indigo-600 font-bold -translate-y-10 scale-105' : 'text-slate-400'}`} 
                    style={{ animationDelay: `${index * 0.15 + 0.5}s`, animationFillMode: 'forwards' }}
                >
                    {position.name}
                </p>
                <div 
                    onClick={() => handleCardInteraction(index)} 
                    className={`
                        relative cursor-pointer perspective-1000 transition-all duration-700 cubic-bezier(0.34, 1.56, 0.64, 1) ${cardClass}
                        ${isActive 
                            ? 'z-30 scale-110 md:scale-125 shadow-[0_20px_50px_-12px_rgba(99,102,241,0.5)]' 
                            : ''
                        }
                        ${!isActive && revealed && !isAnyActive ? 'hover:scale-105 hover:shadow-xl' : ''}
                        ${!isActive && !revealed ? 'hover:-translate-y-3 hover:shadow-2xl hover:shadow-indigo-100 active:scale-95' : ''}
                        ${!isActive && isAnyActive ? 'opacity-50 scale-95 blur-[0.5px] grayscale-[0.5]' : ''}
                    `}
                >
                    {/* --- Reveal Magic Effect (Behind Card) --- */}
                    {revealed && <RevealMagicEffect />}

                    <div className={`relative w-full h-full transition-transform duration-1000 transform-style-3d ${revealed ? 'rotate-y-180' : ''} z-10`}>
                        <div className="absolute inset-0 backface-hidden"><CardBack /></div>
                        <div className="absolute inset-0 backface-hidden rotate-y-180"><CardFront card={card} isReversed={card.isReversed} /></div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-[#f3f4f8] text-slate-800 font-sans selection:bg-indigo-100 selection:text-indigo-900 flex flex-col items-center relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[10%] w-[120vw] md:w-[70vw] h-[120vw] md:h-[70vw] bg-indigo-100/40 rounded-full blur-[80px] md:blur-[120px] animate-pulse-slow mix-blend-multiply"></div>
                <div className="absolute bottom-[-10%] right-[5%] w-[100vw] md:w-[60vw] h-[100vw] md:h-[60vw] bg-violet-100/40 rounded-full blur-[60px] md:blur-[100px] mix-blend-multiply"></div>
            </div>

            {/* --- Ambient Background Circle (Always visible, pulses when active) --- */}
            <AmbientMagicCircle active={isAiLoading} />

            <audio ref={audioRef} src={audioUrl || undefined} onEnded={() => setIsPlayingAudio(false)} className="hidden" />
            
            {/* Header - Resets Full Game on click */}
            <header className="absolute top-0 w-full p-6 md:p-8 flex justify-center z-20">
                <div className="flex flex-col items-center group cursor-pointer" onClick={() => gameState !== 'intro' && resetFullGame()}>
                    <h1 className="text-lg md:text-xl font-serif text-slate-700 tracking-[0.3em] font-light">ORACLE</h1>
                    <div className="w-0 group-hover:w-full h-[1px] bg-indigo-300 mt-2 transition-all duration-500"></div>
                </div>
            </header>

            <main className="flex-1 w-full max-w-6xl p-4 md:p-6 z-10 flex flex-col items-center justify-center min-h-[100vh] md:min-h-[600px]">
                
                {gameState === 'intro' && (
                    <div className="flex flex-col items-center animate-fade-in w-full max-w-lg mt-10 md:mt-0 gap-8">
                        <div className="flex flex-col items-center gap-6 cursor-pointer group" onClick={() => setGameState('spread_select')}>
                            <div className="w-40 h-64 md:w-56 md:h-80 relative transform transition-all duration-700 group-hover:-translate-y-4 animate-float shadow-2xl shadow-indigo-100/50 rounded-xl">
                                <CardBack />
                            </div>
                            <p className="text-[10px] font-serif text-slate-400 tracking-[0.4em] uppercase opacity-0 group-hover:opacity-100 transition-all duration-700 transform translate-y-2 group-hover:translate-y-0">Begin Journey</p>
                        </div>
                        
                        <div className="w-full relative group transition-all duration-300 focus-within:scale-[1.01] px-4">
                            <div className="absolute inset-0 bg-gradient-to-r from-indigo-100 to-white rounded-full blur opacity-40 group-hover:opacity-60 transition-opacity"></div>
                            <div className="relative bg-white border border-white rounded-full px-4 py-3 md:px-6 md:py-4 shadow-[0_8px_30px_-6px_rgba(0,0,0,0.05)] flex items-center gap-3 md:gap-4 transition-all duration-300 focus-within:shadow-[0_12px_40px_-6px_rgba(99,102,241,0.15)] focus-within:border-indigo-50">
                                <input 
                                    type="text" 
                                    value={userQuestion} 
                                    onChange={(e) => setUserQuestion(e.target.value)} 
                                    placeholder="Ask the cards..." 
                                    className="flex-1 bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-sm md:text-base text-slate-700 placeholder:text-slate-400 font-serif tracking-wide" 
                                />
                                <button 
                                    onClick={toggleVoiceInput} 
                                    className={`p-2 rounded-full transition-colors duration-300 ${isListening ? 'text-rose-500 bg-rose-50' : 'text-slate-300 hover:text-indigo-500 hover:bg-indigo-50'}`}
                                >
                                    {isListening ? <Mic size={18} className="animate-pulse" /> : <MicOff size={18} />}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 bg-white/60 px-4 py-2 rounded-full border border-white/60 shadow-sm backdrop-blur-sm">
                            <button onClick={() => setUseFullDeck(!useFullDeck)} className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-300 ${useFullDeck ? 'bg-indigo-400' : 'bg-slate-300'}`}>
                                <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-300 ${useFullDeck ? 'translate-x-4' : 'translate-x-0'}`}></div>
                            </button>
                            <span className="text-[10px] text-slate-500 font-medium tracking-wide flex items-center gap-1 cursor-pointer" onClick={() => setShowDeckInfo(true)}>
                                {useFullDeck ? "完整塔罗 (78张)" : "大阿卡纳 (22张)"} <Info size={12} className="opacity-50 hover:opacity-100 transition-opacity"/>
                            </span>
                        </div>
                    </div>
                )}

                {showDeckInfo && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/20 backdrop-blur-sm p-6" onClick={() => setShowDeckInfo(false)}>
                        <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-white max-w-xs animate-fade-in text-center" onClick={e => e.stopPropagation()}>
                            <h3 className="text-sm font-serif text-slate-800 mb-4 tracking-widest">DECK INFO</h3>
                            <div className="space-y-4 text-xs text-slate-600 leading-relaxed text-left">
                                <p><strong className="text-indigo-600">大阿卡纳 (22张)</strong>：象征人生重大课题与精神原型。适合宏观方向指引。</p>
                                <p><strong className="text-indigo-600">完整塔罗 (78张)</strong>：加入56张小阿卡纳（权杖/圣杯/宝剑/星币），补充生活细节与情感流动。</p>
                            </div>
                            <button onClick={() => setShowDeckInfo(false)} className="mt-6 text-xs text-slate-400 hover:text-indigo-600 transition-colors tracking-widest uppercase">Close</button>
                        </div>
                    </div>
                )}

                {gameState === 'spread_select' && (
                    <div className="w-full animate-fade-in flex flex-col items-center mt-16 md:mt-0">
                        <h2 className="text-lg md:text-xl font-serif text-slate-700 mb-8 md:mb-12 tracking-[0.2em] font-light">CHOOSE SPREAD</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 w-full max-w-4xl px-4 overflow-y-auto max-h-[60vh] md:max-h-none pb-4 custom-scrollbar">
                            {SPREADS.map((spread, idx) => (
                                <div 
                                    key={spread.id} 
                                    onClick={() => setSelectedSpread(spread)} 
                                    className={`relative cursor-pointer group p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border transition-all duration-500 flex flex-col items-center text-center gap-4 md:gap-6 overflow-hidden active:scale-95 ${selectedSpread.id === spread.id ? 'bg-white border-indigo-200 shadow-[0_20px_40px_-10px_rgba(99,102,241,0.15)] z-10' : 'bg-white/60 border-white hover:bg-white hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-50 hover:-translate-y-1'}`} 
                                    style={{ animationDelay: `${idx * 0.1}s` }}
                                >
                                    <div className={`w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center transition-colors duration-500 ${selectedSpread.id === spread.id ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-400 group-hover:text-indigo-400 group-hover:bg-indigo-50/50'}`}>
                                        <spread.icon size={20} className="md:w-6 md:h-6" strokeWidth={1.2} />
                                    </div>
                                    <div>
                                        <h3 className="font-serif text-base md:text-lg text-slate-800 mb-1 md:mb-2 font-medium">{spread.name}</h3>
                                        <p className="text-[9px] md:text-[10px] text-slate-400 uppercase tracking-[0.15em]">{spread.enName}</p>
                                    </div>
                                    <p className="text-[10px] md:text-xs text-slate-500 font-light leading-relaxed">{spread.description}</p>
                                    <div className={`absolute bottom-0 left-0 w-full h-1 md:h-1.5 bg-indigo-400 transition-transform duration-500 origin-left ${selectedSpread.id === spread.id ? 'scale-x-100' : 'scale-x-0'}`}></div>
                                </div>
                            ))}
                        </div>
                        <button onClick={() => setGameState('shuffling')} className="mt-8 md:mt-16 px-10 py-3 md:px-12 md:py-4 bg-slate-800 text-white rounded-full text-xs tracking-[0.3em] hover:bg-indigo-900 shadow-lg active:scale-95 transition-all duration-500">CONFIRM</button>
                    </div>
                )}

                {gameState === 'shuffling' && (
                    <div className="relative animate-fade-in flex flex-col items-center justify-center h-[60vh]">
                        <div className="relative w-32 h-48 md:w-40 md:h-60">
                            {[0,1,2,3,4].map(i => (
                                <div key={i} className="absolute inset-0 rounded-xl overflow-hidden shadow-lg bg-white" style={{ animation: 'orbit 3s infinite ease-in-out', animationDelay: `${i*0.2}s`, opacity: 1 - i * 0.1 }}>
                                    <CardBack />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {gameState === 'picking' && (
                    <div className="flex flex-col items-center animate-fade-in w-full h-full justify-center mt-10 md:mt-0">
                        <h2 className="text-base md:text-lg font-serif text-slate-700 mb-2 tracking-widest">SELECT {selectedSpread.cardCount} CARDS</h2>
                        <p className="text-[10px] md:text-xs text-slate-400 mb-8 md:mb-12 font-light">Follow your intuition</p>
                        
                        <div className="flex flex-wrap justify-center items-center h-56 md:h-64 w-full max-w-5xl relative">
                            {deck.slice(0, 20).map((c, i) => {
                                const offset = i - 10;
                                const xMultiplier = isMobile ? 12 : 30; 
                                const rotMultiplier = isMobile ? 3 : 2;
                                const rotation = offset * rotMultiplier;
                                const translateY = Math.abs(offset) * (isMobile ? 1 : 2);
                                return (
                                    <div 
                                        key={c.uuid} 
                                        onClick={() => handleCardPick(i)} 
                                        className="absolute w-14 h-24 md:w-20 md:h-32 bg-white rounded-lg shadow-md cursor-pointer transition-all duration-300 hover:-translate-y-8 hover:z-50 hover:shadow-2xl hover:shadow-indigo-100 origin-bottom active:-translate-y-4" 
                                        style={{ transform: `translateX(${offset * xMultiplier}px) translateY(${translateY}px) rotate(${rotation}deg)`, zIndex: 20 - Math.abs(offset) }}
                                    >
                                        <CardBack />
                                    </div>
                                )
                            })}
                        </div>
                        <div className="mt-12 md:mt-16 flex gap-2 md:gap-3">
                            {Array.from({length: selectedSpread.cardCount}).map((_, i) => (
                                <div key={i} className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full transition-all duration-500 ${i < selectedCards.length ? 'bg-indigo-500 scale-125' : 'bg-slate-300/50'}`}></div>
                            ))}
                        </div>
                    </div>
                )}

                {gameState === 'reading' && (
                    <div className="w-full flex flex-col lg:flex-row gap-6 md:gap-12 animate-fade-in items-center lg:items-start justify-center h-full pt-16 md:pt-10 pb-6 md:pb-20">
                        
                        <div className="flex-1 w-full flex items-center justify-center min-h-[350px] md:min-h-[500px] relative">
                            <div className="absolute w-[300px] h-[300px] md:w-[500px] md:h-[500px] border border-indigo-100/50 rounded-full animate-spin-slow opacity-60 pointer-events-none"></div>
                            
                            <div className={`${selectedSpread.layout === 'diamond' && isMobile ? 'scale-90 origin-center' : ''}`}>
                                {selectedSpread.layout === 'diamond' ? (
                                    <div className="grid gap-2 md:gap-6 place-items-center" style={{ gridTemplateAreas: `". top ." "left center right" ". bottom ."`, gridTemplateColumns: 'repeat(3, min-content)', gridTemplateRows: 'repeat(3, min-content)' }}>
                                        {[0,1,2,3,4].map(i => renderCardInLayout(i))}
                                    </div>
                                ) : (
                                    <div className="flex flex-wrap justify-center gap-4 md:gap-12">
                                        {selectedCards.map((_, i) => renderCardInLayout(i))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className={`
                            w-full lg:w-[400px] bg-white/95 backdrop-blur-xl border border-white rounded-t-3xl lg:rounded-3xl p-6 md:p-8 shadow-[0_-10px_40px_-12px_rgba(0,0,0,0.1)] flex flex-col transition-all duration-500 relative z-30
                            ${showAiModal ? 'fixed bottom-0 left-0 right-0 h-[80vh] lg:h-[600px] lg:static' : 'h-auto min-h-[300px] md:min-h-[500px]'}
                        `}>
                            <div className="lg:hidden w-12 h-1 bg-slate-200 rounded-full mx-auto mb-4"></div>
                            
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-2xl -z-10 pointer-events-none"></div>
                            
                            {!showAiModal ? (
                                <div className="flex-1 flex flex-col">
                                    <div className="text-center mb-6 md:mb-8 pb-4 border-b border-slate-100">
                                        <h3 className="font-serif text-lg md:text-xl text-slate-800 tracking-wide font-medium">INSIGHT</h3>
                                        <p className="text-[9px] md:text-[10px] text-slate-400 mt-1 md:mt-2 uppercase tracking-[0.2em]">Mystic Interpretation</p>
                                    </div>
                                    
                                    <div className="flex-1 flex flex-col justify-center gap-4 md:gap-6">
                                        {currentReading !== null ? (
                                            <div className="animate-fade-in-up relative w-full h-full flex flex-col items-center">
                                                {/* --- Watermark Background --- */}
                                                {(() => {
                                                    const Icon = selectedCards[currentReading].icon;
                                                    return <Icon className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 text-slate-900 opacity-[0.02] -rotate-12 pointer-events-none" strokeWidth={0.5} />;
                                                })()}
                                                
                                                {/* --- Centered Content --- */}
                                                <div className="flex-1 flex flex-col items-center justify-center text-center z-10 w-full">
                                                    <div className="text-[10px] md:text-xs text-indigo-400 uppercase tracking-[0.3em] font-bold mb-3 md:mb-4">
                                                        {selectedSpread.positions[currentReading].name}
                                                    </div>
                                                    
                                                    <h2 className="text-2xl md:text-3xl font-serif text-slate-800 font-medium mb-2">
                                                        {selectedCards[currentReading].name.split(' ')[0]}
                                                    </h2>
                                                    
                                                    <div className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-medium mb-6 md:mb-8 ${selectedCards[currentReading].isReversed ? "bg-rose-50 text-rose-500" : "bg-emerald-50 text-emerald-600"}`}>
                                                        {selectedCards[currentReading].isReversed ? "Reversed" : "Upright"}
                                                    </div>
                                                    
                                                    <div className="w-12 h-[1px] bg-slate-200 mb-6 md:mb-8"></div>
                                                    
                                                    <p className="text-sm md:text-base text-slate-600 leading-relaxed font-light italic max-w-xs">
                                                        "{selectedCards[currentReading].isReversed ? selectedCards[currentReading].reversed : selectedCards[currentReading].upright}"
                                                    </p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center text-slate-300 py-10 md:py-20 flex flex-col items-center gap-4">
                                                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full border border-dashed border-slate-300 flex items-center justify-center">
                                                    <ArrowRight size={16} />
                                                </div>
                                                <p className="text-[10px] md:text-xs font-medium tracking-wide">Select a card to reveal its meaning</p>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Action Button */}
                                    <button 
                                        onClick={handleActionClick} 
                                        disabled={!revealedCards.every(Boolean) || (isAiLoading && !aiReading)} 
                                        className={`w-full py-3 md:py-4 rounded-xl flex items-center justify-center gap-3 mt-6 md:mt-auto transition-all duration-500 group border active:scale-95 ${revealedCards.every(Boolean) ? 'bg-slate-800 text-white hover:bg-indigo-600 hover:shadow-lg hover:shadow-indigo-200 border-transparent' : 'bg-slate-50 text-slate-300 cursor-not-allowed border-slate-100'}`}
                                    >
                                        {isAiLoading ? (
                                            <Loader2 className="animate-spin" size={16}/> 
                                        ) : aiReading ? (
                                            <Eye size={16} className="group-hover:scale-110 transition-transform"/>
                                        ) : (
                                            <Sparkles size={16} className="group-hover:rotate-12 transition-transform"/>
                                        )}
                                        
                                        <span className="text-[10px] md:text-xs tracking-[0.2em] font-bold">
                                            {isAiLoading ? "CONNECTING..." : aiReading ? "VIEW PROPHECY" : "REVEAL PROPHECY"}
                                        </span>
                                    </button>
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col h-full animate-fade-in relative">
                                    <div className="flex justify-between items-center mb-4 md:mb-6 pb-4 border-b border-slate-100">
                                        <span className="text-[10px] md:text-xs font-serif text-indigo-600 tracking-[0.2em] uppercase font-bold">The Prophecy</span>
                                        <div className="flex gap-3">
                                            {audioUrl && (
                                                <button onClick={toggleAudio} className="text-slate-400 hover:text-indigo-500 transition-colors">
                                                    {isPlayingAudio ? <StopCircle size={18}/> : <Volume2 size={18}/>}
                                                </button>
                                            )}
                                            <button onClick={() => setShowAiModal(false)} className="text-slate-400 hover:text-slate-800 transition-colors">
                                                <Minimize2 size={18}/>
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex-1 relative">
                                        {/* Loading Overlay - Positioned absolutely relative to the container, ALLOWING OVERFLOW */}
                                        {isAiLoading && (
                                            <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
                                                <div className="relative w-full h-full flex items-center justify-center overflow-visible bg-white/60 backdrop-blur-sm">
                                                    <SakuraMagicCircle />
                                                </div>
                                            </div>
                                        )}
                                        
                                        {/* Scrollable Content */}
                                        <div className={`absolute inset-0 overflow-y-auto custom-scrollbar pr-2 -mr-2 ${isAiLoading ? 'opacity-0' : 'opacity-100'}`}>
                                            <div className="prose prose-sm prose-slate max-w-none">
                                                <p className="text-xs md:text-sm text-slate-600 leading-7 md:leading-8 font-serif whitespace-pre-wrap font-light">{aiReading}</p>
                                                <div className="mt-8 flex justify-center"><Sparkles className="text-indigo-200" size={16} /></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}