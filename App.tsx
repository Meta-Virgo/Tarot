import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
    Sparkles, Mic, MicOff, Volume2, StopCircle,
    ArrowRight, Loader2, Minimize2, Info
} from 'lucide-react';
import { SPREADS, DECKS } from './constants';
import { CardInstance, Spread, GameState } from './types';
import { CardBack, CardFront } from './components/Card';
import { getTarotReading, getSpeechFromText } from './services/geminiService';
import { pcmToWav } from './utils';

export default function TarotApp() {
    // --- State ---
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

    // --- Effects ---

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Shuffle Logic
    useEffect(() => {
        if (gameState === 'shuffling') {
            // Reset state
            setAiReading(''); 
            setAudioUrl(null); 
            setIsPlayingAudio(false); 
            setSelectedCards([]); 
            setRevealedCards(new Array(selectedSpread.cardCount).fill(false)); 
            setCurrentReading(null);
            
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

    // --- Handlers ---

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
        // If not revealed, reveal it
        if (!revealedCards[index]) {
            const newRevealed = [...revealedCards];
            newRevealed[index] = true;
            setRevealedCards(newRevealed);
        }
        
        // Always set as current reading (focus) when clicked, even if already revealed
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

    const handleGenerateReading = async () => {
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
            setAiReading("连接中断");
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

    // --- Render Helpers ---

    const renderCardInLayout = (index: number) => {
        const card = selectedCards[index];
        const revealed = revealedCards[index];
        const position = selectedSpread.positions[index];
        const isDiamond = selectedSpread.layout === 'diamond';
        
        // Grid area for diamond layout
        const gridArea = isDiamond ? ['center', 'left', 'right', 'bottom', 'top'][index] : undefined;

        const cardClass = isDiamond 
            ? 'w-[70px] h-[110px] md:w-24 md:h-40' 
            : 'w-[80px] h-[120px] md:w-32 md:h-52';

        const isActive = currentReading === index;
        const isAnyActive = currentReading !== null;

        return (
            <div key={index} style={{ gridArea }} className={`flex flex-col items-center group relative ${!isDiamond ? 'mx-auto' : ''}`}>
                <p 
                    className={`text-[9px] md:text-[10px] font-serif uppercase tracking-[0.2em] mb-2 md:mb-4 opacity-0 animate-fade-in-up font-medium transition-all duration-500 ${isActive ? 'text-indigo-600 font-bold translate-y-1' : 'text-slate-400'}`} 
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
                    <div className={`relative w-full h-full transition-transform duration-1000 transform-style-3d ${revealed ? 'rotate-y-180' : ''}`}>
                        <div className="absolute inset-0 backface-hidden"><CardBack /></div>
                        <div className="absolute inset-0 backface-hidden rotate-y-180"><CardFront card={card} isReversed={card.isReversed} /></div>
                    </div>
                </div>
            </div>
        );
    };

    // --- Main Render ---

    return (
        <div className="min-h-screen bg-[#f3f4f8] text-slate-800 font-sans selection:bg-indigo-100 selection:text-indigo-900 flex flex-col items-center relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[10%] w-[120vw] md:w-[70vw] h-[120vw] md:h-[70vw] bg-indigo-100/40 rounded-full blur-[80px] md:blur-[120px] animate-pulse-slow mix-blend-multiply"></div>
                <div className="absolute bottom-[-10%] right-[5%] w-[100vw] md:w-[60vw] h-[100vw] md:h-[60vw] bg-violet-100/40 rounded-full blur-[60px] md:blur-[100px] mix-blend-multiply"></div>
            </div>

            <audio ref={audioRef} src={audioUrl || undefined} onEnded={() => setIsPlayingAudio(false)} className="hidden" />
            
            {/* Header */}
            <header className="absolute top-0 w-full p-6 md:p-8 flex justify-center z-20">
                <div className="flex flex-col items-center group cursor-pointer" onClick={() => gameState !== 'intro' && setGameState('intro')}>
                    <h1 className="text-lg md:text-xl font-serif text-slate-700 tracking-[0.3em] font-light">ORACLE</h1>
                    <div className="w-0 group-hover:w-full h-[1px] bg-indigo-300 mt-2 transition-all duration-500"></div>
                </div>
            </header>

            <main className="flex-1 w-full max-w-6xl p-4 md:p-6 z-10 flex flex-col items-center justify-center min-h-[100vh] md:min-h-[600px]">
                
                {/* Intro View */}
                {gameState === 'intro' && (
                    <div className="flex flex-col items-center animate-fade-in w-full max-w-lg mt-10 md:mt-0 gap-8">
                        <div className="flex flex-col items-center gap-6 cursor-pointer group" onClick={() => setGameState('spread_select')}>
                            <div className="w-40 h-64 md:w-56 md:h-80 relative transform transition-all duration-700 group-hover:-translate-y-4 animate-float shadow-2xl shadow-indigo-100/50 rounded-xl">
                                <CardBack />
                            </div>
                            <p className="text-[10px] font-serif text-slate-400 tracking-[0.4em] uppercase opacity-0 group-hover:opacity-100 transition-all duration-700 transform translate-y-2 group-hover:translate-y-0">Begin Journey</p>
                        </div>
                        
                        {/* Question Input */}
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

                        {/* Deck Switch */}
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

                {/* Info Modal */}
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

                {/* Spread Select View */}
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

                {/* Shuffling View - RESTORED ORBIT ANIMATION */}
                {gameState === 'shuffling' && (
                    <div className="relative animate-fade-in flex flex-col items-center justify-center h-[60vh]">
                        <p className="absolute text-xs font-serif text-slate-400 tracking-[0.4em] uppercase animate-pulse font-medium">Shuffling Fate</p>
                        <div className="relative w-32 h-48 md:w-40 md:h-60">
                            {[0,1,2,3,4].map(i => (
                                <div key={i} className="absolute inset-0 rounded-xl overflow-hidden shadow-lg bg-white" style={{ animation: 'orbit 3s infinite ease-in-out', animationDelay: `${i*0.2}s`, opacity: 1 - i * 0.1 }}>
                                    <CardBack />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Picking View */}
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

                {/* Reading View */}
                {gameState === 'reading' && (
                    <div className="w-full flex flex-col lg:flex-row gap-6 md:gap-12 animate-fade-in items-center lg:items-start justify-center h-full pt-16 md:pt-10 pb-6 md:pb-20">
                        
                        {/* Left: Cards Layout */}
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

                        {/* Right: Info Panel */}
                        <div className={`
                            w-full lg:w-[400px] bg-white/95 backdrop-blur-xl border border-white rounded-t-3xl lg:rounded-3xl p-6 md:p-8 shadow-[0_-10px_40px_-12px_rgba(0,0,0,0.1)] flex flex-col transition-all duration-500 relative z-30
                            ${showAiModal ? 'fixed bottom-0 left-0 right-0 h-[80vh] lg:h-[600px] lg:static' : 'h-auto min-h-[300px] md:min-h-[500px]'}
                        `}>
                            {/* Drag Indicator (Mobile) */}
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
                                            <div className="animate-fade-in-up">
                                                <div className="flex items-start gap-4 mb-4 md:mb-6">
                                                    <div className="p-2 md:p-3 bg-white border border-slate-100 rounded-2xl text-indigo-600 shadow-sm">
                                                        {React.createElement(selectedCards[currentReading].icon, { size: 24, strokeWidth: 1.2 })}
                                                    </div>
                                                    <div>
                                                        <div className="text-[9px] md:text-[10px] text-indigo-400 uppercase tracking-widest font-bold mb-1">
                                                            {selectedSpread.positions[currentReading].name}
                                                        </div>
                                                        <div className="text-base md:text-lg font-serif text-slate-800 font-semibold">
                                                            {selectedCards[currentReading].name.split(' ')[0]}
                                                        </div>
                                                        <span className="text-[9px] md:text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full mt-1 inline-block font-medium">
                                                            {selectedCards[currentReading].isReversed ? "Reverse" : "Upright"}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="relative">
                                                    <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-indigo-100 rounded-full"></div>
                                                    <p className="text-xs md:text-sm text-slate-600 leading-relaxed pl-4 md:pl-5 font-light italic">
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
                                    
                                    <button 
                                        onClick={handleGenerateReading} 
                                        disabled={!revealedCards.every(Boolean) || isAiLoading} 
                                        className={`w-full py-3 md:py-4 rounded-xl flex items-center justify-center gap-3 mt-6 md:mt-auto transition-all duration-500 group border active:scale-95 ${revealedCards.every(Boolean) ? 'bg-slate-800 text-white hover:bg-indigo-600 hover:shadow-lg hover:shadow-indigo-200 border-transparent' : 'bg-slate-50 text-slate-300 cursor-not-allowed border-slate-100'}`}
                                    >
                                        {isAiLoading ? <Loader2 className="animate-spin" size={16}/> : <Sparkles size={16} className="group-hover:rotate-12 transition-transform"/>}
                                        <span className="text-[10px] md:text-xs tracking-[0.2em] font-bold">{isAiLoading ? "CONNECTING..." : "REVEAL PROPHECY"}</span>
                                    </button>
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col h-full animate-fade-in">
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
                                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 -mr-2">
                                        {isAiLoading ? (
                                            <div className="h-full flex flex-col items-center justify-center gap-4 text-slate-400">
                                                <Loader2 className="animate-spin text-indigo-300" size={32}/>
                                                <p className="text-[10px] tracking-widest uppercase font-medium">Whispering to the stars...</p>
                                            </div>
                                        ) : (
                                            <div className="prose prose-sm prose-slate max-w-none">
                                                <p className="text-xs md:text-sm text-slate-600 leading-7 md:leading-8 font-serif whitespace-pre-wrap font-light">{aiReading}</p>
                                                <div className="mt-8 flex justify-center"><Sparkles className="text-indigo-200" size={16} /></div>
                                            </div>
                                        )}
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