import type { CharlestonDirection, Tile } from './types';
import { Hand } from './Hand';

interface CharlestonPassProps {
    direction: CharlestonDirection;
    hand: Tile[];
    selectedIds: string[];
    onToggleTile: (tileId: string) => void;
    onConfirm: () => void;
}

const DIRECTION_LABEL: Record<CharlestonDirection, string> = {
    left: 'Pass 3 tiles to the left',
    across: 'Pass 3 tiles across',
    right: 'Pass 3 tiles to the right',
};

export function CharlestonPass({
    direction,
    hand,
    selectedIds,
    onToggleTile,
    onConfirm,
}: CharlestonPassProps) {
    const canConfirm = selectedIds.length === 3;
    return (
        <div className="flex flex-col items-center gap-4 rounded-lg border border-stone-300 bg-stone-50 p-4 dark:border-stone-600 dark:bg-stone-800">
            <p className="text-sm font-medium text-stone-700 dark:text-stone-300">{DIRECTION_LABEL[direction]}</p>
            <Hand tiles={hand} faceUp selectedIds={selectedIds} onTileClick={onToggleTile} />
            <button
                type="button"
                disabled={!canConfirm}
                onClick={onConfirm}
                className="rounded bg-stone-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-stone-600"
            >
                Pass 3 tiles
            </button>
        </div>
    );
}
