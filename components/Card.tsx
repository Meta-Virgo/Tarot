import React from 'react';
import { Sparkles } from 'lucide-react';
import { CardInstance } from '../types';

export const CardBack = () => (
    <div className="w-full h-full bg-white rounded-xl flex items-center justify-center relative overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.08)] group hover:shadow-[0_8px_20px_rgba(100,100,255,0.15)] transition-all duration-700 ease-out border border-slate-200/60">
        <div className="absolute inset-1.5 md:inset-2 border-[0.5px] border-indigo-100 rounded-lg"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,#eef2ff,transparent)] opacity-60"></div>
        <div className="absolute inset-0 opacity-[0.05] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        <div className="relative w-10 h-10 md:w-16 md:h-16 flex items-center justify-center opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700">
            <div className="absolute w-full h-full border-[0.5px] border-indigo-300/40 rotate-45 group-hover:rotate-90 transition-transform duration-[1.5s] ease-in-out"></div>
            <div className="absolute w-8 h-8 md:w-10 md:h-10 border-[0.5px] border-violet-400/30 rotate-0"></div>
            <Sparkles className="text-violet-500/50 w-3 h-3 md:w-4 md:h-4 animate-pulse-slow" strokeWidth={1} />
        </div>
    </div>
);

interface CardFrontProps {
    card: CardInstance;
    isReversed: boolean;
}

export const CardFront: React.FC<CardFrontProps> = ({ card, isReversed }) => {
    const Icon = card.icon;
    
    // Clean, Apple-esque color palette
    const getTheme = (element: string) => {
        switch(element) {
            case 'Fire': return { 
                icon: 'text-rose-500', 
                bg: 'bg-rose-50/30',
                border: 'border-rose-100',
                accent: 'bg-rose-400'
            };
            case 'Water': return { 
                icon: 'text-sky-500', 
                bg: 'bg-sky-50/30',
                border: 'border-sky-100',
                accent: 'bg-sky-400'
            };
            case 'Air': return { 
                icon: 'text-slate-500', 
                bg: 'bg-slate-50/30',
                border: 'border-slate-100',
                accent: 'bg-slate-400'
            };
            case 'Earth': return { 
                icon: 'text-emerald-500', 
                bg: 'bg-emerald-50/30',
                border: 'border-emerald-100',
                accent: 'bg-emerald-400'
            };
            default: return { 
                icon: 'text-violet-500', 
                bg: 'bg-violet-50/30',
                border: 'border-violet-100',
                accent: 'bg-violet-400'
            };
        }
    };

    const theme = getTheme(card.element);

    return (
        <div className={`w-full h-full rounded-xl relative overflow-hidden bg-white shadow-sm border-[0.5px] ${theme.border}`}>
            {/* Subtle background texture */}
            <div className={`absolute inset-0 ${theme.bg}`}></div>
            <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>

            {/* Rotatable Content Container */}
            <div className={`w-full h-full flex flex-col items-center justify-center transition-transform duration-700 ${isReversed ? 'rotate-180' : ''}`}>
                
                {/* Minimalist Inner Frame */}
                <div className={`absolute inset-2 border-[0.5px] ${theme.border} rounded-lg opacity-40`}></div>

                {/* Central Icon / Art */}
                <div className="relative z-10 flex flex-col items-center justify-center p-4">
                     {/* Soft Glow Behind Icon */}
                    <div className="absolute w-12 h-12 md:w-16 md:h-16 bg-white blur-xl rounded-full opacity-70"></div>
                    <Icon 
                        size={40} 
                        strokeWidth={1.2}
                        className={`${theme.icon} relative z-10 drop-shadow-sm opacity-90 md:w-14 md:h-14`} 
                    />
                </div>

                {/* Orientation Indicator (Dot at the bottom when upright) */}
                <div className={`absolute bottom-4 w-1 h-1 rounded-full ${theme.accent} opacity-30`}></div>
            </div>
        </div>
    );
};