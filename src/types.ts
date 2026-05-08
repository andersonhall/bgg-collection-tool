export interface Game {
  id: string;
  name: string;
  thumbnail: string;
  minPlayers: number;
  maxPlayers: number;
  playingTime: number;
  minPlayTime: number;
  maxPlayTime: number;
  weight: number;
  communityRating: number;
  userRating: number | null;
  numPlays: number;
}
