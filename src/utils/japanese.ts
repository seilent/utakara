import Kuroshiro from 'kuroshiro';
import KuromojiAnalyzer from 'kuroshiro-analyzer-kuromoji';
import path from 'path';

let kuroshiroInstance: Kuroshiro | null = null;
let isInitializing = false;

const initializeKuroshiro = async () => {
  if (!kuroshiroInstance && !isInitializing) {
    isInitializing = true;
    try {
      kuroshiroInstance = new Kuroshiro();
      const analyzer = new KuromojiAnalyzer({
        dictPath: path.join(process.cwd(), 'node_modules', 'kuromoji', 'dict')
      });
      await kuroshiroInstance.init(analyzer);
      isInitializing = false;
    } catch (error) {
      console.error('Error initializing Kuroshiro:', error);
      isInitializing = false;
      throw error;
    }
  }
  return kuroshiroInstance;
};

export const convertToFurigana = async (text: string): Promise<string> => {
  try {
    const kuroshiro = await initializeKuroshiro();
    if (!kuroshiro) throw new Error('Failed to initialize Kuroshiro');
    
    const result = await kuroshiro.convert(text, {
      mode: 'furigana',
      to: 'hiragana'
    });

    // Convert Kuroshiro's HTML output to our {漢字|かな} format
    return result.replace(/<ruby><rb>(.+?)<\/rb><rt>(.+?)<\/rt><\/ruby>/g, '{$1|$2}');
  } catch (error) {
    console.error('Error converting to furigana:', error);
    throw error;
  }
};

export const convertToRomaji = async (text: string): Promise<string> => {
  try {
    const kuroshiro = await initializeKuroshiro();
    if (!kuroshiro) throw new Error('Failed to initialize Kuroshiro');
    
    return await kuroshiro.convert(text, {
      mode: 'romaji',
      romajiSystem: 'hepburn'
    });
  } catch (error) {
    console.error('Error converting to romaji:', error);
    throw error;
  }
};