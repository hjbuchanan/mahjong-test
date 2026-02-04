/**
 * Unicode Mahjong Tiles (U+1F000 block) for visual tile display.
 * See: https://unicode.org/charts/nameslist/n_1F000.html
 */
const WIND = {
    E: '\u{1F000}', // East
    S: '\u{1F001}', // South
    W: '\u{1F002}', // West
    N: '\u{1F003}', // North
} as const;
const DRAGON = {
    R: '\u{1F004}', // Red
    G: '\u{1F005}', // Green
    W: '\u{1F006}', // White
} as const;
const FLOWERS = ['\u{1F022}', '\u{1F023}', '\u{1F024}', '\u{1F025}']; // Plum, Orchid, Bamboo, Chrysanthemum
const SEASONS = ['\u{1F026}', '\u{1F027}', '\u{1F028}', '\u{1F029}']; // Spring, Summer, Autumn, Winter
const JOKER = '\u{1F02A}';
const TILE_BACK = '\u{1F02B}';

function crack(value: number): string {
    return String.fromCodePoint(0x1f007 + (value - 1));
}
function bam(value: number): string {
    return String.fromCodePoint(0x1f010 + (value - 1));
}
function dot(value: number): string {
    return String.fromCodePoint(0x1f019 + (value - 1));
}

import type { Tile as TileType } from './types';

/** Short label for the top of the tile (e.g. number 1-9, E/S/W/N, J). */
export function getTileLabel(tile: TileType): string {
    if (tile.isJoker) return 'J';
    switch (tile.type.kind) {
        case 'suit':
            return String(tile.type.value);
        case 'wind':
            return tile.type.wind;
        case 'dragon':
            return tile.type.dragon;
        case 'flower':
            return tile.type.flower[1];
        case 'season':
            return tile.type.season[1];
        case 'joker':
            return 'J';
    }
}

export function getTileSymbol(tile: TileType): string {
    if (tile.isJoker) return JOKER;
    switch (tile.type.kind) {
        case 'wind':
            return WIND[tile.type.wind];
        case 'dragon':
            return DRAGON[tile.type.dragon];
        case 'suit':
            if (tile.type.suit === 'cracks') return crack(tile.type.value);
            if (tile.type.suit === 'bams') return bam(tile.type.value);
            return dot(tile.type.value);
        case 'flower':
            return FLOWERS[parseInt(tile.type.flower[1], 10) - 1] ?? FLOWERS[0];
        case 'season':
            return SEASONS[parseInt(tile.type.season[1], 10) - 1] ?? SEASONS[0];
        case 'joker':
            return JOKER;
    }
}

export function getTileBackSymbol(): string {
    return TILE_BACK;
}

/** CSS color hints by category for tile background */
export function getTileBgClass(tile: TileType): string {
    if (tile.isJoker) return 'bg-amber-200/90 text-amber-900 dark:bg-amber-800/90 dark:text-amber-100';
    switch (tile.type.kind) {
        case 'suit':
            if (tile.type.suit === 'dots') return 'bg-emerald-100/90 text-emerald-900 dark:bg-emerald-900/90 dark:text-emerald-100';
            if (tile.type.suit === 'bams') return 'bg-sky-100/90 text-sky-900 dark:bg-sky-900/90 dark:text-sky-100';
            return 'bg-rose-100/90 text-rose-900 dark:bg-rose-900/90 dark:text-rose-100';
        case 'wind':
        case 'dragon':
            return 'bg-stone-100/90 text-stone-900 dark:bg-stone-700/90 dark:text-stone-100';
        case 'flower':
            return 'bg-violet-100/90 text-violet-900 dark:bg-violet-900/90 dark:text-violet-100';
        case 'season':
            return 'bg-teal-100/90 text-teal-900 dark:bg-teal-900/90 dark:text-teal-100';
        case 'joker':
            return 'bg-amber-200/90 text-amber-900 dark:bg-amber-800/90 dark:text-amber-100';
    }
}
