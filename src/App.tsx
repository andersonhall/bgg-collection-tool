import { useState, useEffect, useRef } from 'react';
import { useCollection } from './hooks/useCollection';
import { useFilters } from './hooks/useFilters';
import type { FilterState } from './hooks/useFilters';
import type { Game } from './types';

// ─── Spinner ─────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <div
      className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"
      role="status"
      aria-label="Loading"
    />
  );
}

// ─── Username Input Screen ────────────────────────────────────────────────────

interface UsernameFormProps {
  onSubmit: (username: string) => void;
  isLoading: boolean;
}

function UsernameForm({ onSubmit, isLoading }: UsernameFormProps) {
  const [username, setUsername] = useState('');

  function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = username.trim();
    if (trimmed) {
      onSubmit(trimmed);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col items-center justify-center px-4">
      <div className="max-w-lg w-full space-y-8">

        {/* Badge */}
        <div className="flex justify-center">
          <div className="bg-amber-500 text-gray-950 font-bold text-sm px-3 py-1 rounded-full tracking-widest uppercase">
            BGG Collection Tool
          </div>
        </div>

        {/* Headline */}
        <div className="text-center space-y-3">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white">
            What should we play tonight?
          </h1>
          <p className="text-lg text-gray-400 leading-relaxed">
            Enter your BoardGameGeek username to load your collection
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="bgg-username" className="sr-only">
              BoardGameGeek username
            </label>
            <input
              id="bgg-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="BoardGameGeek username"
              autoFocus
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              disabled={isLoading}
              className="w-full bg-gray-900 border border-gray-700 text-white placeholder-gray-500 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !username.trim()}
            className="w-full bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-gray-950 font-bold text-base rounded-xl px-4 py-3 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Load My Collection
          </button>
        </form>

      </div>
    </div>
  );
}

// ─── Loading Screen ───────────────────────────────────────────────────────────

const SLOW_LOAD_THRESHOLD_MS = 8000;

function LoadingScreen() {
  const [showSlowMessage, setShowSlowMessage] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      setShowSlowMessage(true);
    }, SLOW_LOAD_THRESHOLD_MS);

    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col items-center justify-center px-4">
      <div className="flex flex-col items-center gap-6 text-center">
        <Spinner />
        <p className="text-lg text-gray-300">Fetching your collection from BGG...</p>
        {showSlowMessage && (
          <p className="text-sm text-gray-500">
            Large collections can take a moment...
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Error Screen ─────────────────────────────────────────────────────────────

interface ErrorScreenProps {
  message: string;
  onReset: () => void;
}

function ErrorScreen({ message, onReset }: ErrorScreenProps) {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col items-center justify-center px-4">
      <div className="max-w-lg w-full space-y-6">

        {/* Error box */}
        <div className="bg-gray-900 border border-red-700 rounded-xl p-5 space-y-2">
          <p className="text-red-400 font-semibold text-sm uppercase tracking-wide">Error</p>
          <p className="text-red-300 text-base">{message}</p>
        </div>

        <button
          type="button"
          onClick={onReset}
          className="w-full bg-gray-800 hover:bg-gray-700 active:bg-gray-600 text-gray-100 font-semibold text-base rounded-xl px-4 py-3 transition border border-gray-700"
        >
          Try again
        </button>

      </div>
    </div>
  );
}

// ─── Filter Panel ─────────────────────────────────────────────────────────────

interface FilterButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function FilterButton({ active, onClick, children }: FilterButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
        active
          ? 'bg-amber-500 text-gray-950'
          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
      }`}
    >
      {children}
    </button>
  );
}

const PLAYER_COUNTS = [2, 3, 4, 5, 6] as const;

const TIME_OPTIONS = [
  { label: '≤30 min', value: 30 },
  { label: '≤60 min', value: 60 },
  { label: '≤90 min', value: 90 },
  { label: '≤2 hrs', value: 120 },
] as const;

const RATING_OPTIONS = [
  { label: '6+', value: 6 },
  { label: '7+', value: 7 },
  { label: '7.5+', value: 7.5 },
  { label: '8+', value: 8 },
] as const;

interface FilterPanelProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
}

function FilterPanel({ filters, onChange }: FilterPanelProps) {
  function set<K extends keyof FilterState>(key: K, value: FilterState[K]) {
    onChange({ ...filters, [key]: value });
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">

      {/* Players */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-gray-400 w-16 shrink-0">Players</span>
        <FilterButton
          active={filters.playerCount === null}
          onClick={() => set('playerCount', null)}
        >
          Any
        </FilterButton>
        {PLAYER_COUNTS.map(n => (
          <FilterButton
            key={n}
            active={filters.playerCount === n}
            onClick={() => set('playerCount', n)}
          >
            {n}
          </FilterButton>
        ))}
      </div>

      {/* Time */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-gray-400 w-16 shrink-0">Time</span>
        <FilterButton
          active={filters.maxPlayTime === null}
          onClick={() => set('maxPlayTime', null)}
        >
          Any
        </FilterButton>
        {TIME_OPTIONS.map(opt => (
          <FilterButton
            key={opt.value}
            active={filters.maxPlayTime === opt.value}
            onClick={() => set('maxPlayTime', opt.value)}
          >
            {opt.label}
          </FilterButton>
        ))}
      </div>

      {/* Rating */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-gray-400 w-16 shrink-0">Rating</span>
        <FilterButton
          active={filters.minRating === 0}
          onClick={() => set('minRating', 0)}
        >
          Any
        </FilterButton>
        {RATING_OPTIONS.map(opt => (
          <FilterButton
            key={opt.value}
            active={filters.minRating === opt.value}
            onClick={() => set('minRating', opt.value)}
          >
            {opt.label}
          </FilterButton>
        ))}
      </div>

      {/* Plays */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-gray-400 w-16 shrink-0">Plays</span>
        <FilterButton
          active={filters.plays === 'all'}
          onClick={() => set('plays', 'all')}
        >
          All games
        </FilterButton>
        <FilterButton
          active={filters.plays === 'new'}
          onClick={() => set('plays', 'new')}
        >
          New to me
        </FilterButton>
        <FilterButton
          active={filters.plays === 'played'}
          onClick={() => set('plays', 'played')}
        >
          Played before
        </FilterButton>
      </div>

    </div>
  );
}

// ─── Collection View (success state) ─────────────────────────────────────────

interface CollectionViewProps {
  games: Game[];
  onReset: () => void;
}

function CollectionView({ games, onReset }: CollectionViewProps) {
  const { filters, setFilters, filtered, isFiltered, resetFilters } = useFilters(games);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

        {/* Header bar */}
        <div className="bg-gray-900 border border-amber-700 rounded-xl p-5 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-amber-300 font-semibold text-lg">
              {isFiltered
                ? `Showing ${filtered.length} of ${games.length} games`
                : `${games.length} ${games.length === 1 ? 'game' : 'games'} in your collection`}
            </p>
            {isFiltered && (
              <button
                type="button"
                onClick={resetFilters}
                className="text-sm text-gray-400 hover:text-amber-400 underline underline-offset-2 transition mt-1"
              >
                Clear filters
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={onReset}
            className="text-sm text-gray-400 hover:text-amber-400 underline underline-offset-2 whitespace-nowrap transition"
          >
            Load a different username
          </button>
        </div>

        {/* Filter panel */}
        <FilterPanel filters={filters} onChange={setFilters} />

        {/* Results placeholder — Session 5 */}
        {filtered.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
            <p className="text-gray-400 text-base">No games match your filters.</p>
            <button
              type="button"
              onClick={resetFilters}
              className="mt-3 text-sm text-amber-400 hover:text-amber-300 underline underline-offset-2 transition"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center text-gray-500 text-sm">
            Game cards coming in Session 5 — {filtered.length} {filtered.length === 1 ? 'game' : 'games'} ready to display.
          </div>
        )}

      </div>
    </div>
  );
}

// ─── App Shell ────────────────────────────────────────────────────────────────

function App() {
  const { status, games, error, fetchCollection, reset } = useCollection();

  if (status === 'loading') {
    return <LoadingScreen />;
  }

  if (status === 'error' && error !== null) {
    return <ErrorScreen message={error} onReset={reset} />;
  }

  if (status === 'success') {
    return <CollectionView games={games} onReset={reset} />;
  }

  // idle
  return (
    <UsernameForm
      onSubmit={fetchCollection}
      isLoading={false}
    />
  );
}

export default App;
