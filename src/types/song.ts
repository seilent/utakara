export interface Song {
  id: string;
  title: {
    japanese: string;
    english: string;
  };
  artist: {
    japanese: string;
    english: string;
  };
  artwork: string;
  lyrics: {
    japanese: string;
    romaji: string;
  };
}