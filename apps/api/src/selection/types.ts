export interface SourceFile {
  path: string;
  content: string;
}

export interface SourceCandidate {
  path: string;
  line: number;
  score: number;
}
