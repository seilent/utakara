declare module 'kuromoji' {
  export interface TokenizerBuilder {
    build(callback: (err: Error | null, tokenizer: Tokenizer) => void): void;
  }

  export interface Token {
    surface_form: string;
    reading?: string;
    pronunciation?: string;
    basic_form: string;
    position: number;
    pos: string;
    pos_detail_1: string;
    pos_detail_2: string;
    pos_detail_3: string;
    conjugated_type: string;
    conjugated_form: string;
    literal?: string;
    word_type: string;
  }

  export interface Tokenizer {
    tokenize(text: string): Token[];
  }

  export function builder(options: { dicPath: string }): TokenizerBuilder;
}

export {};