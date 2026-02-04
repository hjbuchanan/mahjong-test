/**
 * Simple AI: Charleston pass selection and play (claim/discard).
 */

import type { GameState, Tile } from './types';
import { tileKey } from './tiles';
import { validateHand } from './validate-hand';
import { HAND_CARD } from './hand-card';
import { HUMAN_INDEX, NUM_PLAYERS } from './types';

function tileEquals(a: Tile, b: Tile): boolean {
    if (a.isJoker || b.isJoker) return true;
    if (a.type.kind !== b.type.kind) return false;
    switch (a.type.kind) {
        case 'suit':
            return b.type.kind === 'suit' && a.type.suit === b.type.suit && a.type.value === b.type.value;
        case 'wind':
            return b.type.kind === 'wind' && a.type.wind === b.type.wind;
        case 'dragon':
            return b.type.kind === 'dragon' && a.type.dragon === b.type.dragon;
        default:
            return false;
    }
}

export function getCharlestonPass(state: GameState, playerIndex: number): string[] {
    const hand = state.hands[playerIndex] ?? [];
    if (hand.length < 3) return [];
    const byKey = new Map<string, Tile[]>();
    for (const t of hand) {
        const k = tileKey(t);
        if (!byKey.has(k)) byKey.set(k, []);
        byKey.get(k)!.push(t);
    }
    const sorted = Array.from(byKey.entries()).sort((a, b) => a[1].length - b[1].length);
    return sorted.flatMap(([, tiles]) => tiles).slice(0, 3).map((t) => t.id);
}

export function getClaimDecision(state: GameState, playerIndex: number): 'pung' | 'kong' | 'mahjong' | null {
    if (!state.pendingClaim || state.pendingClaim.playerIndex !== playerIndex) return null;
    const { claimType } = state.pendingClaim;
    const hand = state.hands[playerIndex] ?? [];
    const tile = state.pendingClaim.tile;
    if (claimType === 'mahjong') {
        return validateHand([...hand, tile], HAND_CARD) ? 'mahjong' : null;
    }
    if (claimType === 'kong') {
        return hand.filter((t) => tileEquals(t, tile)).length >= 3 ? 'kong' : null;
    }
    if (claimType === 'pung') {
        return hand.filter((t) => tileEquals(t, tile)).length >= 2 ? 'pung' : null;
    }
    return null;
}

export function getDiscardChoice(state: GameState, playerIndex: number): string | null {
    const hand = state.hands[playerIndex] ?? [];
    if (hand.length === 0) return null;
    const counts = new Map<string, number>();
    for (const t of hand) {
        const k = tileKey(t);
        counts.set(k, (counts.get(k) ?? 0) + 1);
    }
    let worst: Tile | null = null;
    let worstCount = 1e9;
    for (const t of hand) {
        const c = counts.get(tileKey(t)) ?? 0;
        if (c < worstCount) {
            worstCount = c;
            worst = t;
        }
    }
    return worst?.id ?? hand[0].id;
}

export function isAIPlayer(index: number): boolean {
    return index !== HUMAN_INDEX;
}
