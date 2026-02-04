/**
 * Validate a 14-tile hand against the hand card. Jokers are wild.
 */

import type { Tile } from './types';
import { tileKey } from './tiles';
import type { HandDefinition, MeldSpec } from './hand-card';

export function validateHand(tiles: Tile[], handCard: HandDefinition[]): boolean {
    if (tiles.length !== 14) return false;
    const counts = countByKey(tiles);
    for (const hand of handCard) {
        if (tryMatchHand(counts, hand.melds)) return true;
    }
    return false;
}

function countByKey(tiles: Tile[]): Map<string, number> {
    const map = new Map<string, number>();
    for (const t of tiles) {
        const k = tileKey(t);
        map.set(k, (map.get(k) ?? 0) + 1);
    }
    return map;
}

function tryMatchHand(counts: Map<string, number>, meldSpecs: MeldSpec[]): boolean {
    const totalRequired = meldSpecs.reduce((s, m) => s + m.count, 0);
    if (totalRequired !== 14) return false;
    const jokers = counts.get('J') ?? 0;
    counts.delete('J');
    const keys = Array.from(counts.keys());
    return matchMelds(counts, keys, jokers, meldSpecs, 0);
}

function matchMelds(
    counts: Map<string, number>,
    keys: string[],
    jokers: number,
    specs: MeldSpec[],
    specIndex: number,
): boolean {
    if (specIndex >= specs.length) {
        return counts.size === 0 && jokers === 0;
    }
    const spec = specs[specIndex];
    const need = spec.count;

    for (const key of keys) {
        const c = counts.get(key) ?? 0;
        if (c === 0) continue;
        const use = Math.min(c, need);
        const jokerUse = need - use;
        if (jokerUse > jokers) continue;

        counts.set(key, c - use);
        if (counts.get(key) === 0) counts.delete(key);
        const ok = matchMelds(counts, keys, jokers - jokerUse, specs, specIndex + 1);
        counts.set(key, (counts.get(key) ?? 0) + use);
        if (ok) return true;
    }
    if (need <= jokers) {
        const ok = matchMelds(counts, keys, jokers - need, specs, specIndex + 1);
        if (ok) return true;
    }
    return false;
}
