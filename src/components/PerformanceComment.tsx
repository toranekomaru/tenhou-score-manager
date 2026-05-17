import { useMemo } from 'react';
import { GameRecord } from '../types';

interface Props {
  records: GameRecord[];
}

type CommentType = 'good' | 'bad' | 'caution' | 'neutral';

interface InsightCard {
  type: CommentType;
  icon: string;
  tag: string;    // ラベル: "好調" "危険" など
  value: string;  // 主役の数値: "40%" "2.80" "5連続"
  desc: string;   // 補足説明
}

function generateInsights(records: GameRecord[]): InsightCard[] {
  if (records.length === 0) return [];

  const cards: InsightCard[] = [];
  const latest = [...records].reverse(); // 最新が先頭

  // ── ① ストリーク ───────────────────────────────
  let streakTop = 0;
  for (const r of latest) { if (r.rank === 1) streakTop++; else break; }

  let streakRentai = 0;
  for (const r of latest) { if (r.rank <= 2) streakRentai++; else break; }

  let streakLast = 0;
  for (const r of latest) { if (r.rank === 4) streakLast++; else break; }

  let streakGyaku = 0;
  for (const r of latest) { if (r.rank >= 3) streakGyaku++; else break; }

  let streakNoLast = 0;
  for (const r of latest) { if (r.rank !== 4) streakNoLast++; else break; }

  let streakNoTop = 0;
  for (const r of latest) { if (r.rank !== 1) streakNoTop++; else break; }

  // 好調ストリーク（どちらか1つ）
  if (streakTop >= 3) {
    cards.push({ type: 'good', icon: '🔥', tag: '絶好調', value: `${streakTop}連続`, desc: 'トップを継続中' });
  } else if (streakRentai >= 5) {
    cards.push({ type: 'good', icon: '📈', tag: '安定', value: `${streakRentai}連続`, desc: '連対を継続中' });
  }

  // 不調ストリーク（どちらか1つ）
  if (streakLast >= 3) {
    cards.push({ type: 'bad', icon: '⚡', tag: '危険', value: `${streakLast}連続`, desc: 'ラスが続いています' });
  } else if (streakGyaku >= 5) {
    cards.push({ type: 'bad', icon: '📉', tag: '不調', value: `${streakGyaku}連続`, desc: '3位以下が続いています' });
  }

  // 長期ストリーク（別軸）
  if (streakNoLast >= 10) {
    cards.push({ type: 'good', icon: '🛡', tag: '堅実', value: `${streakNoLast}連続`, desc: 'ラスなしを継続中' });
  }
  if (streakNoTop >= 10) {
    cards.push({ type: 'caution', icon: '⏳', tag: '低迷', value: `${streakNoTop}連続`, desc: 'トップなしが続いています' });
  }

  // ── ② 直近N戦の傾向 ─────────────────────────────
  // 各期間の設定: [対象戦数, 最低必要数, 好調avg, 不調avg, トップ率閾値, ラス率閾値]
  const periods: [number, number, number, number, number, number][] = [
    [10,  5,  2.30, 2.80, 40.0, 40.0],
    [50,  25, 2.41, 2.59, 31.7, 31.7],
    [100, 50, 2.44, 2.56, 29.7, 29.7],
  ];

  for (const [maxN, minN, goodAvg, badAvg, topThresh, lastThresh] of periods) {
    const n = Math.min(maxN, latest.length);
    if (n < minN) continue;

    const recent   = latest.slice(0, n);
    const tops     = recent.filter(r => r.rank === 1).length;
    const lasts    = recent.filter(r => r.rank === 4).length;
    const avg      = recent.reduce((s, r) => s + r.rank, 0) / n;
    const topRate  = tops  / n * 100;
    const lastRate = lasts / n * 100;

    if (topRate >= topThresh) {
      cards.push({ type: 'good', icon: '🏆', tag: '好調', value: `${topRate.toFixed(0)}%`, desc: `直近${n}戦 トップ率` });
    }
    if (lastRate >= lastThresh) {
      cards.push({ type: 'bad', icon: '⚠', tag: '守備低下', value: `${lastRate.toFixed(0)}%`, desc: `直近${n}戦 ラス率` });
    }
    if (avg <= goodAvg) {
      cards.push({ type: 'good', icon: '📊', tag: '絶好調', value: avg.toFixed(2), desc: `直近${n}戦 平均順位` });
    }
    if (avg >= badAvg) {
      cards.push({ type: 'bad', icon: '📉', tag: '不調傾向', value: avg.toFixed(2), desc: `直近${n}戦 平均順位` });
    }
  }

  // ── ③ 常時表示（直近50戦・100戦の基本成績） ──
  const fixedPeriods = [50, 100];
  const shownPeriods = new Set<number>();

  for (const p of fixedPeriods) {
    const n = Math.min(p, latest.length);
    if (n > 0 && !shownPeriods.has(n)) {
      shownPeriods.add(n);
      const recent = latest.slice(0, n);
      const lasts = recent.filter(r => r.rank === 4).length;
      const avg = recent.reduce((s, r) => s + r.rank, 0) / n;
      const lastRate = (lasts / n) * 100;

      cards.push({ type: 'neutral', icon: '📋', tag: '基本成績', value: avg.toFixed(2), desc: `直近${n}戦 平均順位` });
      cards.push({ type: 'neutral', icon: '📋', tag: '基本成績', value: `${lastRate.toFixed(1)}%`, desc: `直近${n}戦 ラス率` });
    }
  }

  return cards; // 上限なし
}

export default function PerformanceComment({ records }: Props) {
  const insights = useMemo(() => generateInsights(records), [records]);

  if (insights.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {insights.map((card, i) => (
        <InsightCard key={i} card={card} />
      ))}
    </div>
  );
}

function InsightCard({ card }: { card: InsightCard }) {
  const styles: Record<CommentType, { border: string; bg: string; tagColor: string; valueColor: string }> = {
    good: {
      border:     'border-l-2 border-l-green-500 border-slate-200 dark:border-slate-700',
      bg:         'bg-green-50/80 dark:bg-green-900/10',
      tagColor:   'text-green-700 dark:text-green-400',
      valueColor: 'text-green-800 dark:text-green-300',
    },
    bad: {
      border:     'border-l-2 border-l-red-500 border-slate-200 dark:border-slate-700',
      bg:         'bg-red-50/80 dark:bg-red-900/10',
      tagColor:   'text-red-600 dark:text-red-400',
      valueColor: 'text-red-800 dark:text-red-300',
    },
    caution: {
      border:     'border-l-2 border-l-amber-400 border-slate-200 dark:border-slate-700',
      bg:         'bg-amber-50/80 dark:bg-amber-900/10',
      tagColor:   'text-amber-700 dark:text-amber-400',
      valueColor: 'text-amber-800 dark:text-amber-300',
    },
    neutral: {
      border:     'border-l-2 border-l-slate-400 border-slate-200 dark:border-slate-700',
      bg:         'bg-slate-50/80 dark:bg-slate-800/50',
      tagColor:   'text-slate-600 dark:text-slate-400',
      valueColor: 'text-slate-800 dark:text-slate-300',
    },
  };

  const s = styles[card.type];

  return (
    <div className={`flex items-center gap-3 pl-3 pr-4 py-2 rounded-xl border ${s.border} ${s.bg} shadow-sm`}>
      <span className="text-base leading-none">{card.icon}</span>
      <div className="flex flex-col leading-tight">
        <div className={`text-[10px] font-bold uppercase tracking-widest ${s.tagColor}`}>{card.tag}</div>
        <div className={`text-lg font-black font-mono leading-tight ${s.valueColor}`}>{card.value}</div>
        <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{card.desc}</div>
      </div>
    </div>
  );
}
