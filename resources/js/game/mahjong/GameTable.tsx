import { useEffect, useCallback } from 'react';
import type { GameState, CharlestonDirection } from './types';
import { HUMAN_INDEX, NUM_PLAYERS } from './types';
import { createInitialState, gameReducer, type GameAction } from './game-reducer';
import {
    getCharlestonPass as getAICharlestonPass,
    getClaimDecision,
    getDiscardChoice,
    isAIPlayer,
} from './ai';
import { Hand, DISCARD_ZONE_ATTR } from './Hand';
import { DiscardPile } from './DiscardPile';
import { CharlestonPass } from './CharlestonPass';
import { Tile } from './Tile';

const CHARLESTON_DIRECTIONS: CharlestonDirection[] = ['left', 'across', 'right'];

function getCharlestonDirection(passIndex: number): CharlestonDirection {
    return CHARLESTON_DIRECTIONS[passIndex] ?? 'left';
}

function getDiscarderLabel(playerIndex: number): string {
    switch (playerIndex) {
        case 0:
            return 'You';
        case 1:
            return 'Left';
        case 2:
            return 'Top';
        case 3:
            return 'Right';
        default:
            return `Player ${playerIndex + 1}`;
    }
}

interface GameTableProps {
    state: GameState;
    dispatch: React.Dispatch<GameAction>;
}

export function GameTable({ state, dispatch }: GameTableProps) {
    const humanHand = state.hands[HUMAN_INDEX] ?? [];
    const humanDiscards = state.discards[HUMAN_INDEX] ?? [];
    const humanExposures = state.exposures[HUMAN_INDEX] ?? [];
    const isHumanTurn = state.currentPlayer === HUMAN_INDEX;
    const humanCanClaim = state.pendingClaim?.playerIndex === HUMAN_INDEX;
    const humanMustDraw =
        state.phase === 'play' && isHumanTurn && !state.lastDrawnTile && !state.pendingClaim;
    const humanMustDiscard =
        state.phase === 'play' &&
        isHumanTurn &&
        !humanCanClaim &&
        (humanHand.length === 14 || humanHand.length === 11 || humanHand.length === 10);
    const isCharlestonHumanTurn =
        state.phase === 'charleston' && state.charlestonPlayerIndex === HUMAN_INDEX;
    const claimableDiscardPlayerIndex =
        humanCanClaim && state.pendingClaim ? state.pendingClaim.discardPlayerIndex : null;

    const handleDiscard = useCallback(
        (tileId: string) => {
            dispatch({ type: 'DISCARD', payload: { tileId } });
        },
        [dispatch],
    );

    const handleCharlestonConfirm = useCallback(() => {
        if (state.charlestonSelectedIds.length !== 3) return;
        dispatch({ type: 'CHARLESTON_PASS', payload: { tileIds: state.charlestonSelectedIds } });
    }, [dispatch, state.charlestonSelectedIds]);

    useEffect(() => {
        if (state.phase !== 'play' && state.phase !== 'charleston') return;
        const actor =
            state.phase === 'charleston'
                ? state.charlestonPlayerIndex
                : state.phase === 'play' && state.pendingClaim
                  ? state.pendingClaim.playerIndex
                  : state.currentPlayer;
        if (!isAIPlayer(actor)) return;

        const t = setTimeout(() => {
            if (state.phase === 'charleston') {
                const tileIds = getAICharlestonPass(state, actor);
                if (tileIds.length === 3) {
                    dispatch({ type: 'CHARLESTON_PASS', payload: { tileIds } });
                }
                return;
            }
            if (state.pendingClaim && state.pendingClaim.playerIndex === actor) {
                const claim = getClaimDecision(state, actor);
                if (claim) {
                    dispatch({ type: 'CLAIM', payload: { claimType: claim } });
                } else {
                    dispatch({ type: 'SKIP_CLAIM' });
                }
                return;
            }
            const handLen = (state.hands[actor] ?? []).length;
            const mustDiscard = handLen === 14 || handLen === 11 || handLen === 10;
            if (mustDiscard) {
                const toDiscard = getDiscardChoice(state, actor);
                if (toDiscard) dispatch({ type: 'DISCARD', payload: { tileId: toDiscard } });
                return;
            }
            if (state.wall.length > 0) {
                dispatch({ type: 'DRAW' });
            }
        }, 600);
        return () => clearTimeout(t);
    }, [
        state.phase,
        state.currentPlayer,
        state.pendingClaim,
        state.wall.length,
        state.hands,
        state.charlestonPlayerIndex,
        dispatch,
    ]);

    if (state.phase === 'game_over') {
        const winner =
            state.winner === HUMAN_INDEX ? 'You' : `Player ${(state.winner ?? 0) + 1}`;
        return (
            <div className="flex flex-col items-center justify-center gap-4 p-8">
                <p className="text-xl font-semibold">Game over. {winner} win!</p>
                <button
                    type="button"
                    onClick={() => dispatch({ type: 'INIT_DEAL' })}
                    className="rounded bg-stone-700 px-4 py-2 text-white dark:bg-stone-600"
                >
                    New game
                </button>
            </div>
        );
    }

    if (state.phase === 'charleston' && isCharlestonHumanTurn) {
        const direction = getCharlestonDirection(state.charlestonPassIndex);
        return (
            <div className="flex flex-col items-center justify-center p-8">
                <CharlestonPass
                    direction={direction}
                    hand={humanHand}
                    selectedIds={state.charlestonSelectedIds}
                    onToggleTile={(tileId) =>
                        dispatch({ type: 'CHARLESTON_SELECT', payload: { tileId } })
                    }
                    onConfirm={handleCharlestonConfirm}
                />
            </div>
        );
    }

    if (state.phase === 'charleston' && !isCharlestonHumanTurn) {
        return (
            <div className="flex flex-col items-center justify-center p-8">
                <p className="text-stone-600 dark:text-stone-400">
                    Other players are passing tiles...
                </p>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen flex-col bg-stone-100 dark:bg-stone-900">
            <div className="grid flex-1 grid-cols-4 grid-rows-[1fr_auto_1fr_auto] gap-2 p-4">
                <div className="col-span-4 flex flex-col items-center gap-1">
                    <span className="text-xs text-stone-500">Top</span>
                    <div className="flex gap-2">
                        <Hand tiles={state.hands[2] ?? []} faceUp={false} />
                        <span className="text-sm">({(state.hands[2] ?? []).length} tiles)</span>
                    </div>
                    <div className="flex flex-wrap gap-0.5">
                        {(state.exposures[2] ?? []).map((m, i) =>
                            m.tiles.map((t) => (
                                <Tile key={`${i}-${t.id}`} tile={t} faceUp />
                            )),
                        )}
                    </div>
                </div>

                <div className="col-span-4 flex flex-wrap items-start justify-center gap-6 border-y border-stone-300 py-3 dark:border-stone-600">
                    <div className="flex flex-col items-center gap-1">
                        <span className="text-xs font-medium text-stone-600 dark:text-stone-400">You</span>
                        <DiscardPile
                            tiles={state.discards[0] ?? []}
                            highlightLastTile={claimableDiscardPlayerIndex === 0}
                        />
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <span className="text-xs font-medium text-stone-600 dark:text-stone-400">Left</span>
                        <DiscardPile
                            tiles={state.discards[1] ?? []}
                            highlightLastTile={claimableDiscardPlayerIndex === 1}
                        />
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <span className="text-xs font-medium text-stone-600 dark:text-stone-400">Top</span>
                        <DiscardPile
                            tiles={state.discards[2] ?? []}
                            highlightLastTile={claimableDiscardPlayerIndex === 2}
                        />
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <span className="text-xs font-medium text-stone-600 dark:text-stone-400">Right</span>
                        <DiscardPile
                            tiles={state.discards[3] ?? []}
                            highlightLastTile={claimableDiscardPlayerIndex === 3}
                        />
                    </div>
                </div>

                <div className="flex flex-col items-center gap-1">
                    <span className="text-xs text-stone-500">Left</span>
                    <Hand tiles={state.hands[1] ?? []} faceUp={false} />
                    <span className="text-sm">({(state.hands[1] ?? []).length})</span>
                </div>
                <div className="col-span-2 flex flex-col items-center justify-center gap-2">
                    {humanCanClaim && state.pendingClaim && (
                        <div className="flex min-h-[8rem] min-w-[12rem] flex-1 flex-col items-center justify-center gap-3 rounded-xl border-2 border-amber-500 bg-amber-50/90 px-4 py-5 dark:border-amber-400 dark:bg-amber-950/40">
                            <p className="text-center text-sm font-medium text-amber-900 dark:text-amber-100">
                                {getDiscarderLabel(state.pendingClaim.discardPlayerIndex)} discarded — you can claim
                                for{' '}
                                {state.pendingClaim.claimType === 'mahjong'
                                    ? 'Mah Jong'
                                    : state.pendingClaim.claimType === 'kong'
                                      ? 'Kong'
                                      : 'Pung'}
                            </p>
                            <div className="flex justify-center">
                                <Tile tile={state.pendingClaim.tile} faceUp />
                            </div>
                            <div className="flex flex-wrap justify-center gap-2">
                                {state.pendingClaim.claimType === 'mahjong' && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            dispatch({ type: 'CLAIM', payload: { claimType: 'mahjong' } })
                                        }
                                        className="rounded bg-green-600 px-3 py-1 text-sm text-white"
                                    >
                                        Mah Jong!
                                    </button>
                                )}
                                {state.pendingClaim.claimType === 'pung' && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            dispatch({ type: 'CLAIM', payload: { claimType: 'pung' } })
                                        }
                                        className="rounded bg-stone-600 px-3 py-1 text-sm text-white dark:bg-stone-500"
                                    >
                                        Pung
                                    </button>
                                )}
                                {state.pendingClaim.claimType === 'kong' && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            dispatch({ type: 'CLAIM', payload: { claimType: 'kong' } })
                                        }
                                        className="rounded bg-stone-600 px-3 py-1 text-sm text-white dark:bg-stone-500"
                                    >
                                        Kong
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={() => dispatch({ type: 'SKIP_CLAIM' })}
                                    className="rounded border border-stone-400 px-3 py-1 text-sm dark:border-stone-500"
                                >
                                    Skip
                                </button>
                            </div>
                        </div>
                    )}
                    {!humanCanClaim && humanMustDiscard && (
                        <div
                            {...{ [DISCARD_ZONE_ATTR]: true }}
                            className="flex min-h-[8rem] min-w-[12rem] flex-1 flex-col items-center justify-center rounded-xl border-2 border-dashed border-amber-500 bg-amber-50/80 py-6 text-amber-800 dark:border-amber-400 dark:bg-amber-950/30 dark:text-amber-200"
                        >
                            <span className="text-sm font-medium">Discard here</span>
                            <span className="text-xs opacity-80">Drag a tile from your hand</span>
                        </div>
                    )}
                    {!humanCanClaim && (
                        <div className="rounded bg-stone-200/80 px-4 py-2 text-sm dark:bg-stone-700">
                            Wall: {state.wall.length} tiles
                            {state.phase === 'play' && (
                                <span className="ml-2">
                                    Turn:{' '}
                                    {(state.pendingClaim
                                        ? state.pendingClaim.playerIndex
                                        : state.currentPlayer) === HUMAN_INDEX
                                        ? 'You'
                                        : `Player ${
                                              (state.pendingClaim
                                                  ? state.pendingClaim.playerIndex
                                                  : state.currentPlayer) + 1
                                          }`}
                                </span>
                            )}
                        </div>
                    )}
                </div>
                <div className="flex flex-col items-center gap-1">
                    <span className="text-xs text-stone-500">Right</span>
                    <Hand tiles={state.hands[3] ?? []} faceUp={false} />
                    <span className="text-sm">({(state.hands[3] ?? []).length})</span>
                </div>

                <div className="col-span-4 flex flex-col gap-2 border-t border-stone-300 pt-4 dark:border-stone-600">
                    {humanCanClaim && (
                        <div className="flex gap-2">
                            {state.pendingClaim?.claimType === 'mahjong' && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        dispatch({ type: 'CLAIM', payload: { claimType: 'mahjong' } })
                                    }
                                    className="rounded bg-green-600 px-3 py-1 text-sm text-white"
                                >
                                    Mah Jong!
                                </button>
                            )}
                            {state.pendingClaim?.claimType === 'pung' && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        dispatch({ type: 'CLAIM', payload: { claimType: 'pung' } })
                                    }
                                    className="rounded bg-stone-600 px-3 py-1 text-sm text-white"
                                >
                                    Pung
                                </button>
                            )}
                            {state.pendingClaim?.claimType === 'kong' && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        dispatch({ type: 'CLAIM', payload: { claimType: 'kong' } })
                                    }
                                    className="rounded bg-stone-600 px-3 py-1 text-sm text-white"
                                >
                                    Kong
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => dispatch({ type: 'SKIP_CLAIM' })}
                                className="rounded border border-stone-400 px-3 py-1 text-sm dark:border-stone-500"
                            >
                                Skip
                            </button>
                        </div>
                    )}
                    {humanMustDraw && (
                        <button
                            type="button"
                            onClick={() => dispatch({ type: 'DRAW' })}
                            className="w-fit rounded bg-stone-700 px-4 py-2 text-sm text-white dark:bg-stone-600"
                        >
                            Draw tile
                        </button>
                    )}
                    <div className="flex flex-wrap items-end gap-2">
                        <div>
                            <p className="mb-1 text-xs text-stone-500">Your hand</p>
                            <Hand
                                tiles={humanHand}
                                faceUp
                                draggable
                                onDragStart={(e, tileId) => {
                                    e.dataTransfer.setData('text/plain', tileId);
                                    e.dataTransfer.effectAllowed = 'move';
                                }}
                                onReorder={(draggedTileId, beforeTileId) => {
                                    dispatch({
                                        type: 'REORDER_HAND',
                                        payload: { tileId: draggedTileId, beforeTileId },
                                    });
                                }}
                                onDiscardDrop={
                                    humanMustDiscard
                                        ? (tileId) => dispatch({ type: 'DISCARD', payload: { tileId } })
                                        : undefined
                                }
                            />
                        </div>
                    </div>
                    {humanExposures.length > 0 && (
                        <div className="flex flex-wrap gap-0.5">
                            {(state.exposures[HUMAN_INDEX] ?? []).map((m, i) =>
                                m.tiles.map((t) => (
                                    <Tile key={`e0-${i}-${t.id}`} tile={t} faceUp />
                                )),
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export { createInitialState, gameReducer };
