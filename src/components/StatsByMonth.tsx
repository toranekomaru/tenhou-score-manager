import { useState, useMemo } from 'react';
import { GameRecord } from '../types';

interface Props {
  records: GameRecord[];
}

export default function StatsByMonth({ records }: Props) {
  if (records.length === 0) {
    return <div className="text-center text-slate-500 py-10">データがありません</div>;
  }

  const [ruleFilter, setRuleFilter] = useState<'すべて' | '東風' | '東南'>('すべて');
  const [timeUnit, setTimeUnit] = useState<'month' | 'week' | 'day'>('month');

  // 週の月曜日を起点とした文字列（例: 2026-04-06週）を生成する関数
  const getWeekKey = (dateString: string) => {
    const d = new Date(dateString);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // 月曜起算
    const monday = new Date(d.setDate(diff));
    return `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}週`;
  };

  // 期間別集計データ
  const monthlyData = useMemo(() => {
    const data: Record<string, {
      count: number;
      eastCount: number;
      southCount: number;
      totalRank: number;
      ranks: [number, number, number, number];
      totalPt: number;
      totalRDelta: number;
    }> = {};

    const filteredRecords = records.filter(
      r => ruleFilter === 'すべて' || r.rule === ruleFilter
    );

    filteredRecords.forEach(r => {
      // timeUnit に応じてキーを切り替え
      let dateKey = r.date.substring(0, 7); // デフォルト (月別)
      if (timeUnit === 'day') {
        dateKey = r.date.substring(0, 10);
      } else if (timeUnit === 'week') {
        dateKey = getWeekKey(r.date);
      }
      
      if (!data[dateKey]) {
        data[dateKey] = { count: 0, eastCount: 0, southCount: 0, totalRank: 0, ranks: [0, 0, 0, 0], totalPt: 0, totalRDelta: 0 };
      }
      const d = data[dateKey];
      d.count += 1;
      d.totalRank += r.rank;
      if (r.rank >= 1 && r.rank <= 4) {
        d.ranks[r.rank - 1] += 1;
      }
      if (r.rule === '東風') d.eastCount += 1;
      if (r.rule === '東南') d.southCount += 1;
      d.totalPt += (r.delta || 0);
      d.totalRDelta += (r.ratingDelta || 0);
    });

    return data;
  }, [records, ruleFilter, timeUnit]);

  // 日付を降順（新しい順）でソート
  const sortedDateKeys = Object.keys(monthlyData).sort((a, b) => b.localeCompare(a));

  return (
    <div className="space-y-4">
      {/* 操作パネル */}
      <div className="flex items-center gap-6 bg-slate-800/30 p-4 rounded-xl border border-slate-700/50 flex-wrap">
        <div className="flex items-center gap-3">
          <label className="text-sm font-semibold text-slate-400">集計単位:</label>
          <select 
            value={timeUnit} 
            onChange={(e) => setTimeUnit(e.target.value as 'month' | 'week' | 'day')}
            className="glass-input text-sm py-1.5 w-36 font-medium"
          >
            <option value="month">月別集計</option>
            <option value="week">週別集計</option>
            <option value="day">日別集計</option>
          </select>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm font-semibold text-slate-400">対象ルール:</label>
          <select 
            value={ruleFilter} 
            onChange={(e) => setRuleFilter(e.target.value as 'すべて' | '東風' | '東南')}
            className="glass-input text-sm py-1.5 w-36 font-medium"
          >
            <option value="すべて">両方 (すべて)</option>
            <option value="東風">東風のみ</option>
            <option value="東南">東南のみ</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-700/50">
        <table className="w-full text-sm text-center whitespace-nowrap">
        <thead className="text-xs uppercase bg-slate-800/80 text-slate-400 border-b border-slate-700/50">
          <tr>
            <th className="px-4 py-3 font-semibold text-left">{timeUnit === 'month' ? '月' : timeUnit === 'week' ? '週' : '日付'}</th>
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
          {sortedDateKeys.map((dateKey, i) => {
            const d = monthlyData[dateKey];
            const avgRank = d.totalRank / d.count;
            const avgPt = d.totalPt / d.count;
            
            return (
              <tr key={dateKey} className={`hover:bg-slate-800/30 transition-colors ${i % 2 === 0 ? 'bg-transparent' : 'bg-slate-900/20'}`}>
                <td className="px-4 py-3 font-bold text-slate-300 text-left tracking-wider">
                  {dateKey.replace(/-/g, '/')}
                </td>
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
                <td className="px-2 py-3 text-[#81c784] font-mono text-xs">{(d.ranks[0]/d.count*100).toFixed(1)}%</td>
                <td className="px-2 py-3 text-emerald-400 font-mono text-xs">{((d.ranks[0]+d.ranks[1])/d.count*100).toFixed(1)}%</td>
                <td className="px-2 py-3 text-[#ff8a80] font-mono text-xs">{(d.ranks[3]/d.count*100).toFixed(1)}%</td>
                <td className="px-4 py-3 text-indigo-300 font-bold bg-indigo-500/5">
                  {d.ranks[3] > 0 
                    ? (((5 * d.ranks[0]) + (2 * d.ranks[1]) - (2 * d.ranks[3])) / d.ranks[3]).toFixed(2)
                    : '-'}
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
          })}
        </tbody>
      </table>
      </div>
    </div>
  );
}
