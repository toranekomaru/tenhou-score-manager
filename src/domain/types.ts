export type Rank = 1 | 2 | 3 | 4;
export type Rule = "東風" | "東南";
export type Room = "玉の間" | "王座の間";
export type RankTier =
  | "雀豪1" | "雀豪2" | "雀豪3"
  | "雀聖1" | "雀聖2" | "雀聖3";

export type GameRecord = {
  id: string;
  date: string; // yyyy-mm-dd
  timestamp?: number; // 追加: 入力順序用タイムスタンプ
  rank: Rank;
  finalScore: number;
  rule: Rule;
  room: Room;
  startRank: RankTier;
};

export type RankPointTable = {
  [room in Room]: {
    [rule in Rule]: {
      [rankTier in RankTier]?: {
        [rank in Rank]: number;
      };
    };
  };
};

export type AppSettings = {
  id: number;
  currentRank: RankTier;
  currentPt: number;
};
