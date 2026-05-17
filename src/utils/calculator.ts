import { Dan, Rank, Room, Rule, GameRecord } from '../types';

export const rankPointTable: Record<Room, Record<Rule, Record<string, number[]>>> = {
  特上卓: {
    東風: {
      "4段": [50, 20, 0, -60],
      "5段": [50, 20, 0, -70],
      "6段": [50, 20, 0, -80],
      "7段": [50, 20, 0, -90],
      "8段": [50, 20, 0, -100],
      "9段": [50, 20, 0, -110],
      "10段": [50, 20, 0, -120],
    },
    東南: {
      "4段": [75, 30, 0, -90],
      "5段": [75, 30, 0, -105],
      "6段": [75, 30, 0, -120],
      "7段": [75, 30, 0, -135],
      "8段": [75, 30, 0, -150],
      "9段": [75, 30, 0, -165],
      "10段": [75, 30, 0, -180],
    },
  },
  鳳凰卓: {
    東風: {
      "7段": [60, 30, 0, -90],
      "8段": [60, 30, 0, -100],
      "9段": [60, 30, 0, -110],
      "10段": [60, 30, 0, -120],
    },
    東南: {
      "7段": [90, 45, 0, -135],
      "8段": [90, 45, 0, -150],
      "9段": [90, 45, 0, -165],
      "10段": [90, 45, 0, -180],
    },
  },
};

export const danConfig: Record<string, { initial: number; promotion: number }> = {
  "4段": { initial: 800, promotion: 1600 },
  "5段": { initial: 1000, promotion: 2000 },
  "6段": { initial: 1200, promotion: 2400 },
  "7段": { initial: 1400, promotion: 2800 },
  "8段": { initial: 1600, promotion: 3200 },
  "9段": { initial: 1800, promotion: 3600 },
  "10段": { initial: 2000, promotion: 4000 },
};

export const danOrder: Dan[] = ["4段","5段","6段","7段","8段","9段","10段"];

export function calculateDanPoint(room: Room, rule: Rule, dan: Dan, rank: Rank): number {
  const table = rankPointTable[room]?.[rule]?.[dan];
  if (!table) return 0;
  return table[rank - 1] ?? 0;
}

export function getNextDan(dan: Dan): Dan | null {
  const idx = danOrder.indexOf(dan);
  if (idx >= 0 && idx < danOrder.length - 1) {
    return danOrder[idx + 1];
  }
  return null;
}

export function getPrevDan(dan: Dan): Dan | null {
  const idx = danOrder.indexOf(dan);
  if (idx > 0) {
    return danOrder[idx - 1];
  }
  return null;
}

export function applyDanProgress(currentDan: Dan, currentPoint: number, delta: number): { dan: Dan; point: number } {
  const nextPoint = currentPoint + delta;
  const config = danConfig[currentDan];

  // 昇段
  if (nextPoint >= config.promotion) {
    const nextDan = getNextDan(currentDan);
    if (nextDan) {
      return { dan: nextDan, point: danConfig[nextDan].initial };
    }
    // 10段カンスト
    return { dan: currentDan, point: config.promotion };
  }

  // 降段
  if (nextPoint < 0) {
    const prevDan = getPrevDan(currentDan);
    if (prevDan) {
      return { dan: prevDan, point: danConfig[prevDan].initial };
    }
    // 4段0ptストップ
    return { dan: currentDan, point: 0 };
  }

  return { dan: currentDan, point: nextPoint };
}

export function calculateHistory(records: GameRecord[], initialDan: Dan, initialPoint: number, initialRating: number = 1500): GameRecord[] {
  let currentDan = initialDan;
  let currentPoint = initialPoint;

  return records.map((record, index) => {
    const delta = calculateDanPoint(record.room, record.rule, currentDan, record.rank);
    const result = applyDanProgress(currentDan, currentPoint, delta);

    const prevRating = index > 0 ? records[index - 1].rating : initialRating;
    const ratingDelta = record.rating - prevRating;

    const mappedRecord = {
      ...record,
      gameIndex: index + 1,
      startDan: currentDan, // 再計算された開始時の段位
      delta,
      danAfter: result.dan,
      pointAfter: result.point,
      ratingAfter: record.rating,
      ratingDelta,
    };

    currentDan = result.dan;
    currentPoint = result.point;

    return mappedRecord;
  });
}
