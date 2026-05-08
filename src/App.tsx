/**
 * BGG Collection Tool — App entry point
 *
 * Architecture note:
 * All BoardGameGeek (BGG) API calls are routed through a Cloudflare Pages Function
 * serverless proxy (see /functions/ at the project root). Direct browser-to-BGG API
 * calls are blocked by CORS, so the browser never calls the BGG API directly.
 *
 * Session 3: Username input and collection fetch
 */

import { useState, useEffect, useRef } from 'react';
import { useCollection } from './hooks/useCollection';

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

// ─── Success Screen ───────────────────────────────────────────────────────────

interface SuccessScreenProps {
  gameCount: number;
  onReset: () => void;
}

function SuccessScreen({ gameCount, onReset }: SuccessScreenProps) {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col items-center justify-center px-4">
      <div className="max-w-2xl w-full space-y-6">

        {/* Confirmation banner */}
        <div className="bg-gray-900 border border-amber-700 rounded-xl p-5 flex items-center justify-between gap-4">
          <p className="text-amber-300 font-semibold text-lg">
            Collection loaded — {gameCount} {gameCount === 1 ? 'game' : 'games'} found
          </p>
          <button
            type="button"
            onClick={onReset}
            className="text-sm text-gray-400 hover:text-amber-400 underline underline-offset-2 whitespace-nowrap transition"
          >
            Load a different username
          </button>
        </div>

        {/* Placeholder for Sessions 4 and 5 */}
        {/* Filters and results will go here in Sessions 4 and 5 */}

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
    return <SuccessScreen gameCount={games.length} onReset={reset} />;
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
