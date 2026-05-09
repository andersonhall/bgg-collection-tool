import { useState, useMemo } from 'react';
import type { Game } from '../types';

export type PlaysFilter = 'all' | 'new' | 'played';
export type RatingSource = 'bgg' | 'mine';

export interface FilterState {
  playerCount: number | null;
  maxPlayTime: number | null;
  minRating: number;
  ratingSource: RatingSource;
  plays: PlaysFilter;
}

const INITIAL_FILTERS: FilterState = {
  playerCount: null,
  maxPlayTime: null,
  minRating: 0,
  ratingSource: 'bgg',
  plays: 'all',
};

export function useFilters(games: Game[]) {
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);

  const filtered = useMemo(() => {
    return games.filter(game => {
      if (filters.playerCount !== null) {
        const fits =
          game.minPlayers <= filters.playerCount &&
          (game.maxPlayers === 0 || game.maxPlayers >= filters.playerCount);
        if (!fits) return false;
      }
      if (filters.maxPlayTime !== null && game.playingTime > 0) {
        if (game.playingTime > filters.maxPlayTime) return false;
      }
      if (filters.minRating > 0) {
        if (filters.ratingSource === 'mine') {
          // Exclude games with no personal rating, or rating below threshold
          if (!game.userRating || game.userRating < filters.minRating) return false;
        } else {
          if (game.communityRating < filters.minRating) return false;
        }
      }
      if (filters.plays === 'new' && game.numPlays > 0) return false;
      if (filters.plays === 'played' && game.numPlays === 0) return false;
      return true;
    });
  }, [games, filters]);

  const isFiltered =
    filters.playerCount !== null ||
    filters.maxPlayTime !== null ||
    filters.minRating > 0 ||
    filters.plays !== 'all';

  function resetFilters() {
    setFilters(INITIAL_FILTERS);
  }

  return { filters, setFilters, filtered, isFiltered, resetFilters };
}
