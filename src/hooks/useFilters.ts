import { useState, useMemo } from 'react';
import type { Game } from '../types';

export type PlaysFilter = 'all' | 'new' | 'played';
export type RatingSource = 'bgg' | 'mine';
export type SortKey = 'plays' | 'name' | 'bggRating' | 'myRating' | 'playTime';

export interface FilterState {
  playerCount: number | null;
  maxPlayTime: number | null;
  minRating: number;
  ratingSource: RatingSource;
  plays: PlaysFilter;
  includeUnknownTime: boolean;
  sortKey: SortKey;
}

const INITIAL_FILTERS: FilterState = {
  playerCount: null,
  maxPlayTime: null,
  minRating: 0,
  ratingSource: 'bgg',
  plays: 'all',
  includeUnknownTime: true,
  sortKey: 'plays',
};

function sortGames(games: Game[], sortKey: SortKey): Game[] {
  return [...games].sort((a, b) => {
    switch (sortKey) {
      case 'plays':
        return a.numPlays - b.numPlays;
      case 'name':
        return a.name.localeCompare(b.name);
      case 'bggRating':
        return b.communityRating - a.communityRating;
      case 'myRating': {
        // Games with no personal rating sort to the bottom
        const aRating = a.userRating ?? -Infinity;
        const bRating = b.userRating ?? -Infinity;
        return bRating - aRating;
      }
      case 'playTime': {
        // Unknown play time (0) sorts to the bottom
        const aTime = a.playingTime === 0 ? Infinity : a.playingTime;
        const bTime = b.playingTime === 0 ? Infinity : b.playingTime;
        return aTime - bTime;
      }
      default:
        return 0;
    }
  });
}

export function useFilters(games: Game[], externalFilters?: FilterState, setExternalFilters?: (f: FilterState) => void) {
  const [internalFilters, setInternalFilters] = useState<FilterState>(INITIAL_FILTERS);

  const filters = externalFilters ?? internalFilters;
  const setFilters = setExternalFilters ?? setInternalFilters;

  const filtered = useMemo(() => {
    const result = games.filter(game => {
      if (filters.playerCount !== null) {
        const fits =
          game.minPlayers <= filters.playerCount &&
          (game.maxPlayers === 0 || game.maxPlayers >= filters.playerCount);
        if (!fits) return false;
      }
      if (filters.maxPlayTime !== null) {
        if (game.playingTime === 0) {
          // Unknown play time: respect the includeUnknownTime toggle
          if (!filters.includeUnknownTime) return false;
        } else {
          if (game.playingTime > filters.maxPlayTime) return false;
        }
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
    return sortGames(result, filters.sortKey);
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
