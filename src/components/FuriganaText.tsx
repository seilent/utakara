import React from 'react';

interface FuriganaTextProps {
  text: string;
}

export const FuriganaText: React.FC<FuriganaTextProps> = ({ text }) => {
  // Parse text with format: normal text and {漢字|かんじ} for furigana
  // Also handles HTML format from Kuroshiro: <ruby><rb>漢字</rb><rt>かんじ</rt></ruby>
  const parts = text.split(/(\{[^}]+\}|<ruby>[^<]+<\/ruby>)/g);
  
  return (
    <span className="inline-flex flex-wrap items-center">
      {parts.map((part, index) => {
        // Check if this part is a furigana pair in our format
        if (part.startsWith('{') && part.endsWith('}')) {
          const [kanji, furigana] = part.slice(1, -1).split('|');
          return (
            <ruby key={index} className="group mx-0.5">
              {kanji}
              <rt className="text-[0.6em] opacity-70 group-hover:opacity-100 transition-opacity">
                {furigana}
              </rt>
            </ruby>
          );
        }
        
        // Check if this part is HTML from Kuroshiro
        if (part.startsWith('<ruby>')) {
          const kanjiMatch = part.match(/<rb>(.+?)<\/rb>/);
          const furiganaMatch = part.match(/<rt>(.+?)<\/rt>/);
          
          if (kanjiMatch && furiganaMatch) {
            return (
              <ruby key={index} className="group mx-0.5">
                {kanjiMatch[1]}
                <rt className="text-[0.6em] opacity-70 group-hover:opacity-100 transition-opacity">
                  {furiganaMatch[1]}
                </rt>
              </ruby>
            );
          }
        }
        
        // Regular text without furigana
        return <span key={index}>{part}</span>;
      })}
    </span>
  );
};