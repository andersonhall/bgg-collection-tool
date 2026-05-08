import { useState, useCallback } from 'react';
import type { Game } from '../types';

type Status = 'idle' | 'loading' | 'success' | 'error';

interface CollectionState {
  status: Status;
  games: Game[];
  error: string | null;
}

interface UseCollectionReturn extends CollectionState {
  fetchCollection: (username: string) => Promise<void>;
  reset: () => void;
}

const INITIAL_STATE: CollectionState = {
  status: 'idle',
  games: [],
  error: null,
};

export function useCollection(): UseCollectionReturn {
  const [state, setState] = useState<CollectionState>(INITIAL_STATE);

  const fetchCollection = useCallback(async (username: string) => {
    setState({ status: 'loading', games: [], error: null });

    try {
      const response = await fetch(
        `/api/bgg/collection?username=${encodeURIComponent(username)}`
      );

      // BGG still processing — proxy returns 503
      if (response.status === 503) {
        setState({
          status: 'error',
          games: [],
          error: 'BGG is still processing your collection. Try again in a few seconds.',
        });
        return;
      }

      const data: unknown = await response.json();

      if (!response.ok) {
        // Proxy returned a structured error object
        if (
          data !== null &&
          typeof data === 'object' &&
          'error' in data &&
          typeof (data as { error: unknown }).error === 'string'
        ) {
          setState({
            status: 'error',
            games: [],
            error: (data as { error: string }).error,
          });
        } else {
          setState({
            status: 'error',
            games: [],
            error: 'Something went wrong. Please try again.',
          });
        }
        return;
      }

      // Success — data should be a Game array
      // Deep-clone via JSON round-trip to ensure a plain, detached array (guards
      // against any proxy or special-object edge case from the fetch response).
      if (Array.isArray(data)) {
        const games = JSON.parse(JSON.stringify(data)) as Game[];
        setState({ status: 'success', games, error: null });
      } else {
        // Unexpected shape
        setState({
          status: 'error',
          games: [],
          error: 'Something went wrong. Please try again.',
        });
      }
    } catch {
      setState({
        status: 'error',
        games: [],
        error: 'Could not reach the server. Check your connection.',
      });
    }
  }, []);

  const reset = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  return {
    ...state,
    fetchCollection,
    reset,
  };
}
