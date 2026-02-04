import { useRef } from 'react';
import type { Tile as TileType } from './types';
import { getTileSymbol, getTileLabel, getTileBgClass, getTileBackSymbol } from './tile-symbols';

interface TileProps {
    tile: TileType;
    faceUp?: boolean;
    draggable?: boolean;
    selected?: boolean;
    /** When true, tile ignores pointer events so drop hits the wrapper (for reorder). */
    isDragging?: boolean;
    onDragStart?: (e: React.DragEvent, tileId: string) => void;
    onDragEnd?: () => void;
    /** Pointer-based drag: called on pointerdown with (tileId, clientX, clientY). */
    onPointerDown?: (tileId: string, clientX: number, clientY: number) => void;
    onClick?: () => void;
    className?: string;
}

export function Tile({
    tile,
    faceUp = true,
    draggable = false,
    selected = false,
    isDragging = false,
    onDragStart,
    onDragEnd,
    onPointerDown,
    onClick,
    className = '',
}: TileProps) {
    const rootRef = useRef<HTMLSpanElement>(null);
    const symbol = faceUp ? getTileSymbol(tile) : getTileBackSymbol();
    const label = faceUp ? getTileLabel(tile) : '';
    const bgClass = faceUp ? getTileBgClass(tile) : 'bg-stone-400 text-stone-600 dark:bg-stone-600 dark:text-stone-400';
    const base =
        'inline-flex h-20 w-14 shrink-0 cursor-default flex-col items-center justify-center gap-0.5 rounded-lg border-2 border-stone-300 py-1 shadow-sm transition-shadow dark:border-stone-600';
    const labelClass = 'text-xs font-semibold leading-none select-none opacity-90';
    const symbolClass = 'text-3xl leading-none select-none';

    const handlePointerDown = (e: React.PointerEvent) => {
        if (draggable && onPointerDown) {
            e.preventDefault();
            onPointerDown(tile.id, e.clientX, e.clientY);
        }
    };

    const handleDragStart = (e: React.DragEvent) => {
        e.dataTransfer.setData('text/plain', tile.id);
        e.dataTransfer.effectAllowed = 'move';
        onDragStart?.(e, tile.id);
        requestAnimationFrame(() => {
            if (rootRef.current) rootRef.current.style.pointerEvents = 'none';
        });
    };

    const handleDragEnd = () => {
        if (rootRef.current) rootRef.current.style.pointerEvents = '';
        onDragEnd?.();
    };

    const usePointerDrag = draggable && !!onPointerDown;

    return (
        <span
            ref={rootRef}
            className={`relative inline-block ${selected ? 'ring-2 ring-primary ring-offset-2 dark:ring-offset-stone-900' : ''} ${isDragging ? 'pointer-events-none' : ''} ${usePointerDrag ? 'cursor-grab active:cursor-grabbing select-none touch-none' : ''} ${className}`}
            onClick={onClick}
            role={draggable ? 'button' : undefined}
            onPointerDown={usePointerDrag ? handlePointerDown : undefined}
        >
            {draggable && !onPointerDown && (
                <span
                    className="absolute inset-x-0 top-0 z-10 h-4 cursor-grab rounded-t-md active:cursor-grabbing"
                    style={{ background: 'rgba(0,0,0,0.15)' }}
                    draggable
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    aria-hidden
                />
            )}
            <span
                className={`${base} ${bgClass} ${symbolClass}`}
                style={{ fontFamily: 'Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif' }}
            >
                {label && <span className={labelClass}>{label}</span>}
                <span>{symbol}</span>
            </span>
        </span>
    );
}
