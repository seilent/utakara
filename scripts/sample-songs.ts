import type { Song } from '../src/types/song';

export const SAMPLE_SONGS: Partial<Song>[] = [
  {
    title: {
      japanese: "ゴーストルール",
      english: "Ghost Rule"
    },
    artist: {
      japanese: "DECO*27",
      english: "DECO*27"
    },
    artwork: "/placeholder/ghostrule.jpg",
    lyrics: {
      japanese: "ああ 止まらない 止まらない\nこの歌声は 止まらない\nそうやって 優しい言葉で\n二人を繋ぎ止めた",
      romaji: "Aa tomaranai tomaranai\nKono utagoe wa tomaranai\nSou yatte yasashii kotoba de\nFutari wo tsunagitometa"
    }
  },
  {
    title: {
      japanese: "千本桜",
      english: "Senbonzakura"
    },
    artist: {
      japanese: "黒うさP",
      english: "KurousaP"
    },
    artwork: "/placeholder/senbonzakura.jpg",
    lyrics: {
      japanese: "大胆不敵にハイカラ革命\n磊々落々 反戦国家\n日の丸印の二輪車転がし\nあら漫画的な日本現代",
      romaji: "Daitan futeki ni haikara kakumei\nRairai rakuraku hansen kokka\nHinomaru jirushi no nirinsha korogashi\nAra manga-teki na nihon gendai"
    }
  }
];