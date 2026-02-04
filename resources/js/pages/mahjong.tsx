import { Head, router } from '@inertiajs/react';
import { useReducer } from 'react';
import { createInitialState, gameReducer, GameTable } from '@/game/mahjong';

export default function Mahjong() {
    const [state, dispatch] = useReducer(
        gameReducer,
        undefined,
        () => createInitialState(),
    );

    return (
        <>
            <Head title="Mah Jong" />
            <div className="min-h-screen bg-stone-100 dark:bg-stone-900">
                <header className="flex items-center justify-between border-b border-stone-300 bg-white px-4 py-2 dark:border-stone-600 dark:bg-stone-800">
                    <h1 className="text-lg font-semibold">American Mah Jong</h1>
                    <button
                        type="button"
                        onClick={() => router.reload()}
                        className="rounded border border-stone-400 px-3 py-1.5 text-sm hover:bg-stone-100 dark:border-stone-500 dark:hover:bg-stone-700"
                    >
                        New game
                    </button>
                </header>
                <GameTable state={state} dispatch={dispatch} />
            </div>
        </>
    );
}
