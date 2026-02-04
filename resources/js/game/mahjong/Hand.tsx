import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Tile as TileType } from './types';
import { Tile } from './Tile';

const DROP_ZONE_ATTR = 'data-drop-before';
export const DISCARD_ZONE_ATTR = 'data-discard-zone';

interface HandProps {
    tiles: TileType[];
    faceUp: boolean;
    draggable?: boolean;
    selectedIds?: string[];
    onTileClick?: (tileId: string) => void;
    onDragStart?: (e: React.DragEvent, tileId: string) => void;
    /** When set, tiles can be dropped on each other to reorder; (draggedId, beforeTileId) with beforeTileId null = move to end. */
    onReorder?: (draggedTileId: string, beforeTileId: string | null) => void;
    /** When set, dropping a tile on an element with [data-discard-zone] calls this with the tile id (e.g. to discard). */
    onDiscardDrop?: (tileId: string) => void;
    className?: string;
}

export function Hand({
    tiles,
    faceUp,
    draggable = false,
    selectedIds = [],
    onTileClick,
    onDragStart,
    onReorder,
    onDiscardDrop,
    className = '',
}: HandProps) {
    const [draggingTileId, setDraggingTileId] = useState<string | null>(null);
    const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null);
    const dropTargetRef = useRef<string | null | undefined>(undefined);
    const hasMovedRef = useRef(false);
    const onReorderRef = useRef(onReorder);
    const onTileClickRef = useRef(onTileClick);
    const onDiscardDropRef = useRef(onDiscardDrop);
    onReorderRef.current = onReorder;
    onTileClickRef.current = onTileClick;
    onDiscardDropRef.current = onDiscardDrop;

    const startPointerDrag = (tileId: string, clientX: number, clientY: number) => {
        setDraggingTileId(tileId);
        setDragPosition({ x: clientX, y: clientY });
        dropTargetRef.current = undefined;
        hasMovedRef.current = false;
    };

    useEffect(() => {
        if (!draggingTileId) return;

        const onPointerMove = (e: PointerEvent) => {
            hasMovedRef.current = true;
            setDragPosition({ x: e.clientX, y: e.clientY });
            const el = document.elementFromPoint(e.clientX, e.clientY);
            const zone = el?.closest(`[${DROP_ZONE_ATTR}]`);
            if (zone == null) {
                dropTargetRef.current = undefined;
            } else {
                const value = zone.getAttribute(DROP_ZONE_ATTR);
                dropTargetRef.current = value === '' ? null : value;
            }
        };

        const onPointerUp = (e: PointerEvent) => {
            const beforeTileId = dropTargetRef.current;
            const draggedId = draggingTileId;
            setDraggingTileId(null);
            setDragPosition(null);

            const under = document.elementFromPoint(e.clientX, e.clientY);
            const isDiscardZone = under?.closest(`[${DISCARD_ZONE_ATTR}]`);
            if (hasMovedRef.current && draggedId && isDiscardZone && onDiscardDropRef.current) {
                onDiscardDropRef.current(draggedId);
                document.removeEventListener('pointermove', onPointerMove);
                document.removeEventListener('pointerup', onPointerUp);
                return;
            }

            if (hasMovedRef.current && draggedId && beforeTileId !== undefined && onReorderRef.current) {
                if (beforeTileId === null || draggedId !== beforeTileId) {
                    onReorderRef.current(draggedId, beforeTileId);
                }
            } else if (!hasMovedRef.current && onTileClickRef.current && draggedId) {
                onTileClickRef.current(draggedId);
            }

            document.removeEventListener('pointermove', onPointerMove);
            document.removeEventListener('pointerup', onPointerUp);
        };

        document.addEventListener('pointermove', onPointerMove);
        document.addEventListener('pointerup', onPointerUp);
        return () => {
            document.removeEventListener('pointermove', onPointerMove);
            document.removeEventListener('pointerup', onPointerUp);
        };
    }, [draggingTileId]);

    const allowDrop = (e: React.DragEvent, beforeTileId: string | null) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e: React.DragEvent, beforeTileId: string | null) => {
        e.preventDefault();
        e.stopPropagation();
        const draggedId = e.dataTransfer.getData('text/plain');
        if (draggedId && onReorder) {
            if (beforeTileId === null || draggedId !== beforeTileId) {
                onReorder(draggedId, beforeTileId);
            }
        }
    };

    const draggedTile = draggingTileId ? tiles.find((t) => t.id === draggingTileId) : null;
    const ghost =
        draggedTile && dragPosition
            ? createPortal(
                  <div
                    className="pointer-events-none z-[9999] opacity-95 shadow-lg"
                    style={{
                        position: 'fixed',
                        left: dragPosition.x,
                        top: dragPosition.y,
                        transform: 'translate(-50%, -50%)',
                    }}
                  >
                    <Tile tile={draggedTile} faceUp={faceUp} />
                  </div>,
                  document.body,
              )
            : null;

    return (
        <>
            {ghost}
            <div className={`flex flex-wrap items-center gap-[30px] ${className}`}>
                {tiles.map((tile) => (
                <div
                    key={tile.id}
                    {...{ [DROP_ZONE_ATTR]: tile.id }}
                    className={`inline-flex min-h-[5rem] min-w-[3.5rem] flex-col items-center justify-center touch-none ${onReorder || onDiscardDrop ? 'cursor-grab active:cursor-grabbing' : ''}`}
                    onPointerDown={
                        onReorder || onDiscardDrop
                            ? (e) => {
                                  if (e.button === 0) {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      startPointerDrag(tile.id, e.clientX, e.clientY);
                                  }
                              }
                            : undefined
                    }
                    onDragEnter={onReorder ? (e) => allowDrop(e, tile.id) : undefined}
                    onDragOver={onReorder ? (e) => allowDrop(e, tile.id) : undefined}
                    onDrop={onReorder ? (e) => handleDrop(e, tile.id) : undefined}
                >
                    <Tile
                        tile={tile}
                        faceUp={faceUp}
                        draggable={draggable}
                        isDragging={draggingTileId === tile.id}
                        selected={selectedIds.includes(tile.id)}
                        onClick={onTileClick ? () => onTileClick(tile.id) : undefined}
                        onPointerDown={undefined}
                        onDragStart={
                            onReorder
                                ? (e, tileId) => {
                                      setDraggingTileId(tileId);
                                      onDragStart?.(e, tileId);
                                  }
                                : onDragStart
                        }
                        onDragEnd={onReorder ? () => setDraggingTileId(null) : undefined}
                    />
                </div>
            ))}
            {onReorder && (
                <div
                    {...{ [DROP_ZONE_ATTR]: '' }}
                    className="min-h-[5rem] min-w-[3.5rem] flex-1 rounded border-2 border-dashed border-stone-300 bg-stone-200/20 dark:border-stone-600 dark:bg-stone-700/20 touch-none"
                    onDragEnter={(e) => allowDrop(e, null)}
                    onDragOver={(e) => allowDrop(e, null)}
                    onDrop={(e) => handleDrop(e, null)}
                    aria-hidden
                />
            )}
            </div>
        </>
    );
}
