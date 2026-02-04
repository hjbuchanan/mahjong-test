import type { Tile as TileType } from './types';
import { Tile } from './Tile';

interface DiscardPileProps {
    tiles: TileType[];
    onDrop?: (tileId: string) => void;
    onDragOver?: (e: React.DragEvent) => void;
    /** When true, the last tile is visually highlighted (e.g. claimable). */
    highlightLastTile?: boolean;
    className?: string;
}

export function DiscardPile({
    tiles,
    onDrop,
    onDragOver,
    highlightLastTile = false,
    className = '',
}: DiscardPileProps) {
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const id = e.dataTransfer.getData('text/plain');
        if (id && onDrop) onDrop(id);
    };
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        onDragOver?.(e);
    };
    const lastIndex = tiles.length > 0 ? tiles.length - 1 : -1;
    return (
        <div
            className={`min-h-12 min-w-12 rounded border border-dashed border-stone-400 bg-stone-100/50 p-1 dark:border-stone-600 dark:bg-stone-800/50 ${className}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
        >
            <div className="flex flex-wrap gap-0.5">
                {tiles.map((t, i) => {
                    const isLastAndHighlight = highlightLastTile && i === lastIndex;
                    return isLastAndHighlight ? (
                        <span
                            key={t.id}
                            className="inline-flex rounded-lg ring-2 ring-amber-500 ring-offset-1 dark:ring-amber-400 dark:ring-offset-stone-800"
                            title="Claimable"
                        >
                            <Tile tile={t} faceUp />
                        </span>
                    ) : (
                        <Tile key={t.id} tile={t} faceUp />
                    );
                })}
            </div>
        </div>
    );
}
