export type Rank = 1 | 2 | 3 | 4;
export type Rule = "東風" | "東南";
export type Room = "特上卓" | "鳳凰卓";
export type Dan = 
  | "4段" | "5段" | "6段" | "7段"
  | "8段" | "9段" | "10段";

export type GameRecord = {
  id?: number; 
  date: string; 
  rank: Rank;
  finalScore: number; // 使用する方針に変更可能だが現状はUI入力のみ
  rule: Rule;
  room: Room;
  startDan: Dan; // その対局のゲーム開始時の段位と認識するが処理で上書きされる
  rating: number; 

  // 計算によって追加されるフィールド
  gameIndex?: number;
  delta?: number;
  danAfter?: Dan;
  pointAfter?: number;
  ratingAfter?: number;
  ratingDelta?: number;
};

export type Settings = {
  id?: number; 
  currentDan: Dan;
  currentPoint: number;
  currentRating: number;
  ratingDeltas?: {
    1: number;
    2: number;
    3: number;
    4: number;
  };
};
