import { NextResponse } from 'next/server';
import kuromoji from 'kuromoji';
import path from 'path';

// Initialize dictionary loader once
const dictLoader = kuromoji.builder({
  dicPath: path.join(process.cwd(), 'node_modules', 'kuromoji', 'dict')
});

let tokenizerPromise: Promise<any> | null = null;

const getTokenizer = async () => {
  if (!tokenizerPromise) {
    tokenizerPromise = new Promise((resolve, reject) => {
      dictLoader.build((err, tokenizer) => {
        if (err) reject(err);
        else resolve(tokenizer);
      });
    });
  }
  return tokenizerPromise;
};

// Check if a character is kanji
const isKanji = (char: string) => {
  return /[\u4e00-\u9faf]/.test(char);
};

// Check if a token needs furigana
const needsFurigana = (token: kuromoji.Token) => {
  return token.surface_form.split('').some(isKanji) && 
         token.reading && 
         token.reading !== token.surface_form;
};

const convertToFurigana = async (text: string) => {
  const tokenizer = await getTokenizer();
  const tokens = tokenizer.tokenize(text);
  let result = '';
  
  for (const token of tokens) {
    if (needsFurigana(token)) {
      // Convert katakana reading to hiragana
      const hiragana = token.reading.replace(/[\u30A0-\u30FF]/g, char => 
        String.fromCharCode(char.charCodeAt(0) - 0x60)
      );
      result += `{${token.surface_form}|${hiragana}}`;
    } else {
      result += token.surface_form;
    }
  }
  
  return result;
};

const convertToRomaji = async (text: string) => {
  const tokenizer = await getTokenizer();
  const tokens = tokenizer.tokenize(text);
  
  return tokens.map(token => {
    // Use reading if available, otherwise use surface form
    let reading = token.reading || token.surface_form;
    
    // Convert katakana/hiragana to basic romaji
    // This is a simple conversion - you might want to use a more sophisticated romaji converter
    return reading
      .replace(/[\u30A1-\u30F6]/g, char => {
        const base = String.fromCharCode(char.charCodeAt(0) - 0x60);
        return toRomaji(base);
      })
      .replace(/[\u3041-\u3096]/g, char => toRomaji(char));
  }).join('');
};

// Basic hiragana to romaji mapping
const hiraganaToRomaji: { [key: string]: string } = {
  'あ': 'a', 'い': 'i', 'う': 'u', 'え': 'e', 'お': 'o',
  'か': 'ka', 'き': 'ki', 'く': 'ku', 'け': 'ke', 'こ': 'ko',
  'さ': 'sa', 'し': 'shi', 'す': 'su', 'せ': 'se', 'そ': 'so',
  'た': 'ta', 'ち': 'chi', 'つ': 'tsu', 'て': 'te', 'と': 'to',
  'な': 'na', 'に': 'ni', 'ぬ': 'nu', 'ね': 'ne', 'の': 'no',
  'は': 'ha', 'ひ': 'hi', 'ふ': 'fu', 'へ': 'he', 'ほ': 'ho',
  'ま': 'ma', 'み': 'mi', 'む': 'mu', 'め': 'me', 'も': 'mo',
  'や': 'ya', 'ゆ': 'yu', 'よ': 'yo',
  'ら': 'ra', 'り': 'ri', 'る': 'ru', 'れ': 're', 'ろ': 'ro',
  'わ': 'wa', 'を': 'wo', 'ん': 'n',
  'が': 'ga', 'ぎ': 'gi', 'ぐ': 'gu', 'げ': 'ge', 'ご': 'go',
  'ざ': 'za', 'じ': 'ji', 'ず': 'zu', 'ぜ': 'ze', 'ぞ': 'zo',
  'だ': 'da', 'ぢ': 'ji', 'づ': 'zu', 'で': 'de', 'ど': 'do',
  'ば': 'ba', 'び': 'bi', 'ぶ': 'bu', 'べ': 'be', 'ぼ': 'bo',
  'ぱ': 'pa', 'ぴ': 'pi', 'ぷ': 'pu', 'ぺ': 'pe', 'ぽ': 'po',
  'きょ': 'kyo', 'しょ': 'sho', 'ちょ': 'cho', 'にょ': 'nyo', 'ひょ': 'hyo',
  'みょ': 'myo', 'りょ': 'ryo', 'ぎょ': 'gyo', 'じょ': 'jo', 'びょ': 'byo',
  'ぴょ': 'pyo',
  'っ': '',  // Small tsu - doubles the following consonant
  'ー': '',  // Long vowel mark
};

const toRomaji = (hiragana: string): string => {
  return hiraganaToRomaji[hiragana] || hiragana;
};

export async function POST(request: Request) {
  try {
    const { japanese, romaji } = await request.json();
    
    if (!japanese || !romaji) {
      return NextResponse.json(
        { error: 'Both japanese and romaji text are required' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      japanese,
      romaji
    });
  } catch (error) {
    console.error('Error processing lyrics:', error);
    return NextResponse.json(
      { error: 'Failed to process lyrics: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}