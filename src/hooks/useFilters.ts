import { useState, useMemo } from 'react';
import type { Game } from '../types';

export type PlaysFilter = 'all' | 'new' | 'played';
export type RatingSource = 'bgg' | 'mine';
export type SortKey = 'plays' | 'name' | 'bggRating' | 'myRating' | 'playTime';
export type SortDirection = 'asc' | 'desc';

// Sensible default direction for each sort key
export const SORT_KEY_DEFAULTS: Record<SortKey, SortDirection> = {
  plays: 'asc',
  name: 'asc',
  bggRating: 'desc',
  myRating: 'desc',
  playTime: 'asc',
};

export interface FilterState {
  playerCount: number | null;
  maxPlayTime: number | null;
  minRating: number;
  ratingSource: RatingSource;
  plays: PlaysFilter;
  includeUnknownTime: boolean;
  sortKey: SortKey;
  sortDir: SortDirection;
}

const INITIAL_FILTERS: FilterState = {
  playerCount: null,
  maxPlayTime: null,
  minRating: 0,
  ratingSource: 'bgg',
  plays: 'all',
  includeUnknownTime: true,
  sortKey: 'plays',
  sortDir: SORT_KEY_DEFAULTS['plays'],
};

function sortGames(games: Game[], sortKey: SortKey, sortDir: SortDirection): Game[] {
  const flip = sortDir === 'desc' ? -1 : 1;
  return [...games].sort((a, b) => {
    switch (sortKey) {
      case 'plays':
        return (a.numPlays - b.numPlays) * flip;
      case 'name':
        return a.name.localeCompare(b.name) * flip;
      case 'bggRating':
        // Always push unrated (0) to bottom regardless of direction
        if (a.communityRating === 0 && b.communityRating === 0) return 0;
        if (a.communityRating === 0) return 1;
        if (b.communityRating === 0) return -1;
        return (a.communityRating - b.communityRating) * flip;
      case 'myRating': {
        // Games with no personal rating always sort to the bottom
        const aRating = a.userRating ?? null;
        const bRating = b.userRating ?? null;
        if (aRating === null && bRating === null) return 0;
        if (aRating === null) return 1;
        if (bRating === null) return -1;
        return (aRating - bRating) * flip;
      }
      case 'playTime': {
        // Unknown play time (0) always sorts to the bottom
        const aTime = a.playingTime === 0 ? null : a.playingTime;
        const bTime = b.playingTime === 0 ? null : b.playingTime;
        if (aTime === null && bTime === null) return 0;
        if (aTime === null) return 1;
        if (bTime === null) return -1;
        return (aTime - bTime) * flip;
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
    return sortGames(result, filters.sortKey, filters.sortDir);
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
