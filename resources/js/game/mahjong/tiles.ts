/**
 * American Mah Jong tile set: 152 tiles.
 * 8 jokers, 4 flowers, 4 seasons, 4 winds × 4, 4 dragons × 4, 3 suits × 9 × 4 = 108.
 */

import type { Tile, TileType } from './types';

let idCounter = 0;

function nextId(): string {
    idCounter += 1;
    return `tile-${idCounter}`;
}

function makeTile(type: TileType): Tile {
    const isJoker = type.kind === 'joker';
    return { id: nextId(), type, isJoker };
}

function buildSuitTiles(
    suit: 'dots' | 'bams' | 'cracks',
    countPerValue: number,
): Tile[] {
    const tiles: Tile[] = [];
    for (let value = 1; value <= 9; value++) {
        for (let i = 0; i < countPerValue; i++) {
            tiles.push(makeTile({ kind: 'suit', suit, value }));
        }
    }
    return tiles;
}

function buildHonorTiles(): Tile[] {
    const tiles: Tile[] = [];
    const winds: Array<'E' | 'S' | 'W' | 'N'> = ['E', 'S', 'W', 'N'];
    const dragons: Array<'R' | 'G' | 'W'> = ['R', 'G', 'W'];
    for (const w of winds) {
        for (let i = 0; i < 4; i++) {
            tiles.push(makeTile({ kind: 'wind', wind: w }));
        }
    }
    for (const d of dragons) {
        for (let i = 0; i < 4; i++) {
            tiles.push(makeTile({ kind: 'dragon', dragon: d }));
        }
    }
    return tiles;
}

function buildFlowersAndSeasons(): Tile[] {
    const tiles: Tile[] = [];
    for (let i = 1; i <= 4; i++) {
        tiles.push(makeTile({ kind: 'flower', flower: `F${i}` as 'F1' | 'F2' | 'F3' | 'F4' }));
        tiles.push(makeTile({ kind: 'season', season: `S${i}` as 'S1' | 'S2' | 'S3' | 'S4' }));
    }
    return tiles;
}

function buildJokers(count: number): Tile[] {
    const tiles: Tile[] = [];
    for (let i = 0; i < count; i++) {
        tiles.push(makeTile({ kind: 'joker' }));
    }
    return tiles;
}

/**
 * Build a full American set. Ids are unique per call.
 */
export function buildTileSet(): Tile[] {
    idCounter = 0;
    const tiles: Tile[] = [];
    tiles.push(...buildSuitTiles('dots', 4));
    tiles.push(...buildSuitTiles('bams', 4));
    tiles.push(...buildSuitTiles('cracks', 4));
    tiles.push(...buildHonorTiles());
    tiles.push(...buildFlowersAndSeasons());
    tiles.push(...buildJokers(8));
    return tiles;
}

/**
 * Fisher-Yates shuffle in place.
 */
export function shuffleTiles(tiles: Tile[]): void {
    for (let i = tiles.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
    }
}

/**
 * Build set, shuffle, and deal one hand of 13 tiles (e.g. for the human player).
 */
export function dealOneHand(): Tile[] {
    const set = buildTileSet();
    shuffleTiles(set);
    return set.splice(0, 13);
}

/** String key for a tile (for grouping melds). Jokers have key 'J'. */
export function tileKey(t: Tile): string {
    if (t.isJoker) return 'J';
    switch (t.type.kind) {
        case 'suit':
            return `${t.type.suit}-${t.type.value}`;
        case 'wind':
            return `wind-${t.type.wind}`;
        case 'dragon':
            return `dragon-${t.type.dragon}`;
        case 'flower':
            return t.type.flower;
        case 'season':
            return t.type.season;
        case 'joker':
            return 'J';
    }
}

export function tileEquals(a: Tile, b: Tile): boolean {
    if (a.isJoker || b.isJoker) return true;
    if (a.type.kind !== b.type.kind) return false;
    switch (a.type.kind) {
        case 'suit':
            return b.type.kind === 'suit' && a.type.suit === b.type.suit && a.type.value === b.type.value;
        case 'wind':
            return b.type.kind === 'wind' && a.type.wind === b.type.wind;
        case 'dragon':
            return b.type.kind === 'dragon' && a.type.dragon === b.type.dragon;
        case 'flower':
            return b.type.kind === 'flower' && a.type.flower === b.type.flower;
        case 'season':
            return b.type.kind === 'season' && a.type.season === b.type.season;
        case 'joker':
            return true;
    }
}
