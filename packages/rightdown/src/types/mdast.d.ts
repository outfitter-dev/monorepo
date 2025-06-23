// Type declarations for mdast nodes we use

export interface Position {
  start: {
    line: number;
    column: number;
    offset?: number;
  };
  end: {
    line: number;
    column: number;
    offset?: number;
  };
}

export interface Code {
  type: 'code';
  lang?: string | null;
  meta?: string | null;
  value: string;
  position?: Position;
}

export interface Root {
  type: 'root';
  children: Array<Code | unknown>;
}
