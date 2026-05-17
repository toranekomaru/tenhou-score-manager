import { Room, Rule, RankTier, Rank } from './types';
import { rankPointTable, rankConfig, rankOrder } from './constants';

export function getRankPoint(
  room: Room,
  rule: Rule,
  rankTier: RankTier,
  rank: Rank
): number {
  const table = rankPointTable[room][rule][rankTier];

  if (!table) {
    // 王座の間に雀豪が参加した場合など、未定義の組み合わせ時は
    // エラーにせず、玉の間のポイント計算をフォールバックとして採用するか例外を投げる設計になりますが、
    // ここでは仕様通り厳格に判定します。
    throw new Error(`順位点テーブル未定義: ${room} ${rule} ${rankTier}`);
  }

  return table[rank];
}

export function calcDanPoint(
  room: Room,
  rule: Rule,
  rankTier: RankTier,
  rank: Rank,
  finalScore: number
): number {
  const rankPoint = getRankPoint(room, rule, rankTier, rank);
  const scoreDiff = Math.ceil((finalScore - 25000) / 1000);
  return rankPoint + scoreDiff;
}

export type CalculatedState = {
  rankTier: RankTier;
  pt: number;
};

export function updateRankState(currentState: CalculatedState, ptDelta: number): CalculatedState {
  let { rankTier, pt } = currentState;
  const config = rankConfig[rankTier];
  
  const newPt = pt + ptDelta;
  
  // 昇段判定
  if (newPt >= config.promotion) {
    const currentIndex = rankOrder.indexOf(rankTier);
    if (currentIndex < rankOrder.length - 1) { // 雀聖3は昇段なし
      const nextRank = rankOrder[currentIndex + 1];
      return {
        rankTier: nextRank,
        pt: rankConfig[nextRank].initial
      };
    } else {
      // 雀聖3のカンスト時等はそのまま
      return { rankTier, pt: newPt };
    }
  }
  
  // 降段判定
  if (newPt < 0) {
    const currentIndex = rankOrder.indexOf(rankTier);
    if (currentIndex > 0) { // 雀豪1は降段なし
      const prevRank = rankOrder[currentIndex - 1];
      return {
        rankTier: prevRank,
        pt: rankConfig[prevRank].initial
      };
    } else {
      // 雀豪1はポイント0でストップ
      return { rankTier, pt: 0 };
    }
  }
  
  return { rankTier, pt: newPt };
}
