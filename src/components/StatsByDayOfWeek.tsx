import { useMemo, useState } from 'react';
import { GameRecord } from '../types';

interface Props {
  records: GameRecord[];
}

const DAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'] as const;
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]; // 月〜日の順

type RuleKey = 'east' | 'south' | 'both';

interface DayStats {
  count: number;
  eastCount: number;
  southCount: number;
  totalRank: number;
  ranks: [number, number, number, number];
  totalPt: number;
  totalRDelta: number;
}

function emptyStats(): DayStats {
  return { count: 0, eastCount: 0, southCount: 0, totalRank: 0, ranks: [0, 0, 0, 0], totalPt: 0, totalRDelta: 0 };
}

function StatsRow({
  label,
  d,
  highlight,
}: {
  label: string;
  d: DayStats;
  highlight: boolean;
}) {
  if (d.count === 0) {
    return (
      <tr className={`${highlight ? 'bg-slate-900/20' : 'bg-transparent'}`}>
        <td className="px-4 py-3 font-bold text-slate-300 text-left tracking-wider">{label}</td>
        <td colSpan={12} className="px-4 py-3 text-slate-600 text-center text-xs">データなし</td>
      </tr>
    );
  }

  const avgRank = d.totalRank / d.count;
  const avgPt = d.totalPt / d.count;
  const stability =
    d.ranks[3] > 0
      ? (5 * d.ranks[0] + 2 * d.ranks[1] - 2 * d.ranks[3]) / d.ranks[3]
      : null;

  return (
    <tr className={`hover:bg-slate-800/30 transition-colors ${highlight ? 'bg-slate-900/20' : 'bg-transparent'}`}>
      <td className="px-4 py-3 font-bold text-slate-300 text-left tracking-wider">{label}</td>
      <td className="px-4 py-3 text-slate-200">{d.count}</td>
      <td className="px-4 py-3 text-slate-400 text-xs">{d.eastCount}</td>
      <td className="px-4 py-3 text-slate-400 text-xs">{d.southCount}</td>
      <td className="px-4 py-3 text-slate-200 font-mono">{avgRank.toFixed(2)}</td>
      <td className="px-3 py-3 font-mono text-xs font-bold tracking-tight">
        <span className="text-slate-200">{d.ranks[0]}</span>
        <span className="text-slate-500">-</span>
        <span className="text-slate-200">{d.ranks[1]}</span>
        <span className="text-slate-500">-</span>
        <span className="text-slate-200">{d.ranks[2]}</span>
        <span className="text-slate-500">-</span>
        <span className="text-slate-200">{d.ranks[3]}</span>
      </td>
      <td className="px-2 py-3 text-[#81c784] font-mono text-xs">
        {(d.ranks[0] / d.count * 100).toFixed(1)}%
      </td>
      <td className="px-2 py-3 text-emerald-400 font-mono text-xs">
        {((d.ranks[0] + d.ranks[1]) / d.count * 100).toFixed(1)}%
      </td>
      <td className="px-2 py-3 text-[#ff8a80] font-mono text-xs">
        {(d.ranks[3] / d.count * 100).toFixed(1)}%
      </td>
      <td className="px-4 py-3 text-indigo-300 font-bold bg-indigo-500/5">
        {stability !== null ? stability.toFixed(2) : '-'}
      </td>
      <td className={`px-4 py-3 text-right font-bold ${d.totalPt >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
        {d.totalPt > 0 ? `+${d.totalPt}` : d.totalPt}
      </td>
      <td className={`px-4 py-3 text-right font-bold ${d.totalRDelta >= 0 ? 'text-fuchsia-400' : 'text-rose-400'}`}>
        {d.totalRDelta > 0 ? `+${d.totalRDelta.toFixed(1)}` : d.totalRDelta.toFixed(1)}
      </td>
      <td className={`px-4 py-3 text-right font-bold ${avgPt >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
        {avgPt > 0 ? `+${avgPt.toFixed(1)}` : avgPt.toFixed(1)}
      </td>
    </tr>
  );
}

export default function StatsByDayOfWeek({ records }: Props) {
  const [selectedRule, setSelectedRule] = useState<RuleKey>('both');

  if (records.length === 0) {
    return <div className="text-center text-slate-500 py-10">データがありません</div>;
  }

  // 曜日×ルール別の集計データ
  const dayData = useMemo(() => {
    // dayIndex (0=日〜6=土) × rule
    const east: DayStats[] = Array.from({ length: 7 }, emptyStats);
    const south: DayStats[] = Array.from({ length: 7 }, emptyStats);
    const both: DayStats[] = Array.from({ length: 7 }, emptyStats);

    records.forEach(r => {
      const dow = new Date(r.date).getDay(); // 0=日, 1=月, ...
      const isEast = r.rule === '東風';
      const target = isEast ? east[dow] : south[dow];
      const btarget = both[dow];

      for (const d of [target, btarget]) {
        d.count += 1;
        d.totalRank += r.rank;
        if (r.rank >= 1 && r.rank <= 4) d.ranks[r.rank - 1] += 1;
        d.totalPt += (r.delta || 0);
        d.totalRDelta += (r.ratingDelta || 0);
      }
      if (isEast) {
        target.eastCount += 1;
        btarget.eastCount += 1;
      } else {
        target.southCount += 1;
        btarget.southCount += 1;
      }
    });

    return { east, south, both };
  }, [records]);

  const data = dayData[selectedRule];

  return (
    <div className="space-y-4">
      {/* 操作パネル */}
      <div className="flex items-center gap-6 bg-slate-800/30 p-4 rounded-xl border border-slate-700/50 flex-wrap">
        <div className="flex items-center gap-3">
          <label className="text-sm font-semibold text-slate-400">対象ルール:</label>
          <select
            value={selectedRule}
            onChange={(e) => setSelectedRule(e.target.value as RuleKey)}
            className="glass-input text-sm py-1.5 w-36 font-medium"
          >
            <option value="both">両方 (すべて)</option>
            <option value="east">東風のみ</option>
            <option value="south">東南のみ</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-700/50">
        <table className="w-full text-sm text-center whitespace-nowrap">
          <thead className="text-xs uppercase bg-slate-800/80 text-slate-400 border-b border-slate-700/50">
            <tr>
              <th className="px-4 py-3 font-semibold text-left">曜日</th>
              <th className="px-4 py-3 font-semibold">対局数</th>
              <th className="px-4 py-3 font-semibold text-slate-500">東風</th>
              <th className="px-4 py-3 font-semibold text-slate-500">東南</th>
              <th className="px-4 py-3 font-semibold">平均順位</th>
              <th className="px-4 py-3 font-semibold">順位内訳</th>
              <th className="px-4 py-3 font-semibold text-[#81c784]">トップ率</th>
              <th className="px-4 py-3 font-semibold text-emerald-500">連対率</th>
              <th className="px-4 py-3 font-semibold text-[#ff8a80]">ラス率</th>
              <th className="px-4 py-3 font-semibold text-indigo-400">安定段位</th>
              <th className="px-4 py-3 font-semibold text-right">獲得Pt</th>
              <th className="px-4 py-3 font-semibold text-right text-fuchsia-400">R変動</th>
              <th className="px-4 py-3 font-semibold text-right">平均Pt</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {DAY_ORDER.map((dow, i) => (
              <StatsRow
                key={dow}
                label={`${DAY_LABELS[dow]}曜日`}
                d={data[dow]}
                highlight={i % 2 !== 0}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
