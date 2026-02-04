/**
 * American Mah Jong types (NMJL-style).
 * Human player is index 0 (bottom). AI are 1, 2, 3 (left, top, right).
 */

export type Suit = 'dots' | 'bams' | 'cracks';
export type Wind = 'E' | 'S' | 'W' | 'N';
export type Dragon = 'R' | 'G' | 'W';
export type Flower = 'F1' | 'F2' | 'F3' | 'F4';
export type Season = 'S1' | 'S2' | 'S3' | 'S4';

export type TileType =
    | { kind: 'suit'; suit: Suit; value: number }
    | { kind: 'wind'; wind: Wind }
    | { kind: 'dragon'; dragon: Dragon }
    | { kind: 'flower'; flower: Flower }
    | { kind: 'season'; season: Season }
    | { kind: 'joker' };

export interface Tile {
    id: string;
    type: TileType;
    isJoker: boolean;
}

export type MeldType = 'pung' | 'kong' | 'pair';

export interface Meld {
    type: MeldType;
    tiles: Tile[];
    fromPlayer?: number;
}

export type Phase = 'deal' | 'charleston' | 'play' | 'game_over';

export type CharlestonDirection = 'left' | 'across' | 'right';

export type ClaimType = 'pung' | 'kong' | 'mahjong';

export interface PendingClaim {
    playerIndex: number;
    discardPlayerIndex: number;
    claimType: ClaimType;
    tile: Tile;
}

export interface GameState {
    phase: Phase;
    wall: Tile[];
    hands: Tile[][];
    discards: Tile[][];
    exposures: Meld[][];
    currentPlayer: number;
    charlestonPassIndex: number;
    charlestonPlayerIndex: number;
    charlestonSelectedIds: string[];
    pendingClaim: PendingClaim | null;
    lastDrawnTile: Tile | null;
    winner: number | null;
}

export const HUMAN_INDEX = 0;
export const NUM_PLAYERS = 4;
