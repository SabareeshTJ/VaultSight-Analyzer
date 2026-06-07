export type StrengthLabel = 'Weak' | 'Moderate' | 'Strong' | 'Very Strong';

export interface CharacterCounts {
  length: number;
  upper: number;
  lower: number;
  numbers: number;
  special: number;
}

export interface ScoreReason {
  reason: string;
  positive: boolean;
}

export interface PasswordDetails {
  repeats: number;
  sequences: number;
  keyboard_patterns: number;
  dictionary_hits: number;
  leet_ratio: number;
  charset_size: number;
  contains_year: boolean;
  repeated_words: boolean;
  similar_to_common: boolean;
}

export interface PasswordAnalysis {
  score: number;
  label: StrengthLabel;
  rating: StrengthLabel;
  color: string;
  entropy_bits: number;
  time_to_crack: string;
  counts: CharacterCounts;
  details: PasswordDetails;
  feedback: string[];
  scoreReasons: ScoreReason[];
}
