/**
 * Game state reducer: deal, charleston, draw, discard, claim.
 */

import type {
    GameState,
    Tile,
    Meld,
    PendingClaim,
    ClaimType,
    CharlestonDirection,
} from './types';
import { HUMAN_INDEX, NUM_PLAYERS } from './types';
import { buildTileSet, shuffleTiles, tileEquals } from './tiles';
import { validateHand } from './validate-hand';
import { HAND_CARD } from './hand-card';

export type GameAction =
    | { type: 'INIT_DEAL' }
    | { type: 'CHARLESTON_PASS'; payload: { tileIds: string[] } }
    | { type: 'CHARLESTON_SELECT'; payload: { tileId: string } }
    | { type: 'DISCARD'; payload: { tileId: string } }
    | { type: 'DRAW' }
    | { type: 'CLAIM'; payload: { claimType: ClaimType } }
    | { type: 'SKIP_CLAIM' }
    | { type: 'REORDER_HAND'; payload: { tileId: string; beforeTileId: string | null } };

const CHARLESTON_DIRECTIONS: CharlestonDirection[] = ['left', 'across', 'right'];

function getCharlestonDirection(passIndex: number): CharlestonDirection {
    return CHARLESTON_DIRECTIONS[passIndex] ?? 'left';
}

function getCharlestonRecipient(playerIndex: number, direction: CharlestonDirection): number {
    switch (direction) {
        case 'left':
            return (playerIndex + 1) % NUM_PLAYERS;
        case 'right':
            return (playerIndex + NUM_PLAYERS - 1) % NUM_PLAYERS;
        case 'across':
            return (playerIndex + 2) % NUM_PLAYERS;
    }
}

function canClaim(state: GameState, playerIndex: number, claimType: ClaimType): boolean {
    if (!state.pendingClaim || state.pendingClaim.playerIndex !== playerIndex) return false;
    const hand = state.hands[playerIndex] ?? [];
    const { tile } = state.pendingClaim;
    if (claimType === 'mahjong') {
        const withTile = [...hand, tile];
        return validateHand(withTile, HAND_CARD);
    }
    if (claimType === 'pung') {
        return hand.filter((t) => tileEquals(t, tile)).length >= 2;
    }
    if (claimType === 'kong') {
        return hand.filter((t) => tileEquals(t, tile)).length >= 3;
    }
    return false;
}

export function createInitialState(): GameState {
    const tiles = buildTileSet();
    shuffleTiles(tiles);
    const hands: Tile[][] = [[], [], [], []];
    for (let i = 0; i < NUM_PLAYERS; i++) {
        for (let j = 0; j < 13; j++) {
            const t = tiles.pop();
            if (t) hands[i].push(t);
        }
    }
    return {
        phase: 'charleston',
        wall: tiles,
        hands,
        discards: [[], [], [], []],
        exposures: [[], [], [], []],
        currentPlayer: 0,
        charlestonPassIndex: 0,
        charlestonPlayerIndex: 0,
        charlestonSelectedIds: [],
        pendingClaim: null,
        lastDrawnTile: null,
        winner: null,
    };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
    switch (action.type) {
        case 'INIT_DEAL':
            return createInitialState();

        case 'CHARLESTON_SELECT': {
            if (state.phase !== 'charleston' || state.charlestonPlayerIndex !== HUMAN_INDEX) return state;
            const id = action.payload.tileId;
            const selected = state.charlestonSelectedIds;
            const next = selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id].slice(-3);
            return { ...state, charlestonSelectedIds: next };
        }

        case 'CHARLESTON_PASS': {
            if (state.phase !== 'charleston') return state;
            const tileIds = action.payload.tileIds;
            if (tileIds.length !== 3) return state;
            const playerIndex = state.charlestonPlayerIndex;
            const hand = state.hands[playerIndex] ?? [];
            const toPass = tileIds.map((id) => hand.find((t) => t.id === id)).filter(Boolean) as Tile[];
            if (toPass.length !== 3) return state;
            const recipient = getCharlestonRecipient(playerIndex, getCharlestonDirection(state.charlestonPassIndex));
            const newHands = state.hands.map((h, i) => [...h]);
            for (const t of toPass) {
                newHands[playerIndex] = newHands[playerIndex].filter((x) => x.id !== t.id);
                newHands[recipient].push(t);
            }
            let nextPlayer = playerIndex + 1;
            let nextPassIndex = state.charlestonPassIndex;
            if (nextPlayer >= NUM_PLAYERS) {
                nextPlayer = 0;
                nextPassIndex += 1;
            }
            const phase = nextPassIndex >= 3 ? 'play' : 'charleston';
            return {
                ...state,
                hands: newHands,
                charlestonPlayerIndex: nextPlayer,
                charlestonPassIndex: nextPassIndex,
                charlestonSelectedIds: [],
                phase,
            };
        }

        case 'DRAW': {
            if (state.phase !== 'play' || state.pendingClaim) return state;
            const wall = [...state.wall];
            const drawn = wall.pop();
            if (!drawn) return state;
            const hands = state.hands.map((h, i) => (i === state.currentPlayer ? [...h, drawn] : h));
            return {
                ...state,
                wall,
                hands,
                lastDrawnTile: drawn,
            };
        }

        case 'DISCARD': {
            if (state.phase !== 'play') return state;
            const { tileId } = action.payload;
            const hands = state.hands.map((h, i) => [...h]);
            const hand = hands[state.currentPlayer] ?? [];
            const tile = hand.find((t) => t.id === tileId);
            if (!tile) return state;
            hands[state.currentPlayer] = hand.filter((t) => t.id !== tileId);
            const discards = state.discards.map((d, i) => (i === state.currentPlayer ? [...d, tile] : d));
            const nextPlayer = (state.currentPlayer + 1) % NUM_PLAYERS;
            const claimers = [nextPlayer, (state.currentPlayer + 2) % NUM_PLAYERS, (state.currentPlayer + 3) % NUM_PLAYERS];
            let pendingClaim: PendingClaim | null = null;
            for (const idx of claimers) {
                if (validateHand([...(hands[idx] ?? []), tile], HAND_CARD)) {
                    pendingClaim = { playerIndex: idx, discardPlayerIndex: state.currentPlayer, claimType: 'mahjong', tile };
                    break;
                }
            }
            if (!pendingClaim) {
                for (const idx of claimers) {
                    const h = hands[idx] ?? [];
                    const kongCount = h.filter((t) => tileEquals(t, tile)).length >= 3;
                    const pungCount = h.filter((t) => tileEquals(t, tile)).length >= 2;
                    if (kongCount) {
                        pendingClaim = { playerIndex: idx, discardPlayerIndex: state.currentPlayer, claimType: 'kong', tile };
                        break;
                    }
                    if (pungCount) {
                        pendingClaim = { playerIndex: idx, discardPlayerIndex: state.currentPlayer, claimType: 'pung', tile };
                        break;
                    }
                }
            }
            return {
                ...state,
                hands,
                discards,
                currentPlayer: pendingClaim ? state.currentPlayer : nextPlayer,
                pendingClaim,
                lastDrawnTile: null,
            };
        }

        case 'CLAIM': {
            if (!state.pendingClaim) return state;
            const { claimType } = action.payload;
            const { playerIndex, discardPlayerIndex, tile } = state.pendingClaim;
            if (claimType !== state.pendingClaim.claimType) return state;
            if (!canClaim(state, playerIndex, claimType)) return state;
            const hands = state.hands.map((h) => [...h]);
            const discards = state.discards.map((d) => [...d]);
            const lastDiscard = discards[discardPlayerIndex];
            const discardedTile = lastDiscard[lastDiscard.length - 1];
            if (!discardedTile) return state;
            discards[discardPlayerIndex] = lastDiscard.slice(0, -1);
            const hand = hands[playerIndex] ?? [];

            if (claimType === 'mahjong') {
                hands[playerIndex] = [...hand, discardedTile];
                return {
                    ...state,
                    hands,
                    discards,
                    pendingClaim: null,
                    currentPlayer: playerIndex,
                    phase: 'game_over',
                    winner: playerIndex,
                };
            }

            const count = claimType === 'pung' ? 2 : 3;
            const same = hand.filter((t) => tileEquals(t, discardedTile)).slice(0, count);
            const meldTiles = [...same, discardedTile];
            const meldType = claimType === 'pung' ? 'pung' : 'kong';
            const newHand = hand.filter((t) => !meldTiles.some((m) => m.id === t.id));
            const meld: Meld = { type: meldType, tiles: meldTiles, fromPlayer: discardPlayerIndex };
            const exposures = state.exposures.map((e, i) => (i === playerIndex ? [...e, meld] : e));
            hands[playerIndex] = newHand;
            return {
                ...state,
                hands,
                discards,
                exposures,
                pendingClaim: null,
                currentPlayer: playerIndex,
                lastDrawnTile: null,
            };
        }

        case 'SKIP_CLAIM': {
            if (!state.pendingClaim) return state;
            const discarder = state.pendingClaim.discardPlayerIndex;
            const claimers = [
                (discarder + 1) % NUM_PLAYERS,
                (discarder + 2) % NUM_PLAYERS,
                (discarder + 3) % NUM_PLAYERS,
            ];
            const idx = claimers.indexOf(state.pendingClaim.playerIndex);
            if (idx < 0) return state;
            if (idx === claimers.length - 1) {
                return {
                    ...state,
                    pendingClaim: null,
                    currentPlayer: claimers[0],
                };
            }
            const nextClaimer = claimers[idx + 1];
            return {
                ...state,
                pendingClaim: { ...state.pendingClaim, playerIndex: nextClaimer },
                currentPlayer: nextClaimer,
            };
        }

        case 'REORDER_HAND': {
            const { tileId, beforeTileId } = action.payload;
            const hand = [...(state.hands[HUMAN_INDEX] ?? [])];
            const from = hand.findIndex((t) => t.id === tileId);
            if (from < 0) return state;
            const [tile] = hand.splice(from, 1);
            let toIndex =
                beforeTileId === null
                    ? hand.length
                    : hand.findIndex((t) => t.id === beforeTileId);
            if (toIndex < 0) toIndex = hand.length;
            if (toIndex > from) toIndex -= 1;
            hand.splice(toIndex, 0, tile);
            return {
                ...state,
                hands: state.hands.map((h, i) => (i === HUMAN_INDEX ? hand : h)),
            };
        }

        default:
            return state;
    }
}
