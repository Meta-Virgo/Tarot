import { LucideIcon } from 'lucide-react';

export interface CardDefinition {
    id: number;
    name: string;
    icon: LucideIcon;
    element: string;
    upright: string;
    reversed: string;
    type?: 'Major' | 'Minor';
    suit?: string;
    rank?: string;
}

export interface CardInstance extends CardDefinition {
    uuid: string;
    isReversed: boolean;
}

export interface SpreadPosition {
    id: number;
    name: string;
    desc: string;
}

export interface Spread {
    id: string;
    name: string;
    enName: string;
    icon: LucideIcon;
    description: string;
    cardCount: number;
    positions: SpreadPosition[];
    layout: 'single' | 'row' | 'diamond';
}

export type GameState = 'intro' | 'spread_select' | 'shuffling' | 'picking' | 'reading';