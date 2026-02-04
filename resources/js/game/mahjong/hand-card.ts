/**
 * Fixed hand card (NMJL-style subset). Each hand is 14 tiles: melds + pair.
 */

export type MeldSpecType = 'pung' | 'kong' | 'pair';

export interface MeldSpec {
    type: MeldSpecType;
    count: number;
    suit?: 'dots' | 'bams' | 'cracks';
    wind?: 'E' | 'S' | 'W' | 'N';
    dragon?: 'R' | 'G' | 'W';
    value?: number;
}

export interface HandDefinition {
    name: string;
    melds: MeldSpec[];
}

export const HAND_CARD: HandDefinition[] = [
    {
        name: 'Four Pungs and a Pair',
        melds: [
            { type: 'pung', count: 3 },
            { type: 'pung', count: 3 },
            { type: 'pung', count: 3 },
            { type: 'pung', count: 3 },
            { type: 'pair', count: 2 },
        ],
    },
    {
        name: 'Three Pungs, One Kong, and a Pair',
        melds: [
            { type: 'pung', count: 3 },
            { type: 'pung', count: 3 },
            { type: 'pung', count: 3 },
            { type: 'kong', count: 4 },
            { type: 'pair', count: 2 },
        ],
    },
    {
        name: 'Two Kongs, One Pung, and a Pair',
        melds: [
            { type: 'kong', count: 4 },
            { type: 'kong', count: 4 },
            { type: 'pung', count: 3 },
            { type: 'pair', count: 2 },
        ],
    },
    {
        name: 'One Kong, Three Pungs, and a Pair',
        melds: [
            { type: 'kong', count: 4 },
            { type: 'pung', count: 3 },
            { type: 'pung', count: 3 },
            { type: 'pung', count: 3 },
            { type: 'pair', count: 2 },
        ],
    },
];
