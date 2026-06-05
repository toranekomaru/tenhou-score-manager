import { useState, useMemo } from 'react';
import { GameRecord } from '../types';
import StatsByCountGraph from './StatsByCountGraph';

interface Props {
  records: GameRecord[];
}

export default function StatsByCount({ records }: Props) {
  const [chunkSize, setChunkSize] = useState<number>(50);
  const [ruleFilter, setRuleFilter] = useState<'すべて' | '東風' | '東南'>('すべて');
  const [direction, setDirection] = useState<'fromOldest' | 'fromNewest'>('fromOldest');

  const chunks = useMemo(() => {
    if (records.length === 0) return [];

    // ルールでフィルタリング
    let filteredRecords = records.filter(
      r => ruleFilter === 'すべて' || r.rule === ruleFilter
    );

    if (filteredRecords.length === 0) return [];

    const total = filteredRecords.length;

    // 新しい順の場合は逆順にしてから分割（最新対局が先頭グループに入る）
    if (direction === 'fromNewest') {
      filteredRecords = [...filteredRecords].reverse();
    }

    const actualChunkSize = chunkSize === 0 ? Math.max(1, total) : chunkSize;
    const result = [];

    for (let i = 0; i < filteredRecords.length; i += actualChunkSize) {
      const chunkRecords = filteredRecords.slice(i, i + actualChunkSize);

      let totalRank = 0;
      let totalPt = 0;
      let totalRDelta = 0;
      let eastCount = 0;
      let southCount = 0;
      const ranks = [0, 0, 0, 0] as [number, number, number, number];

      chunkRecords.forEach(r => {
        totalRank += r.rank;
        totalPt += (r.delta || 0);
        totalRDelta += (r.ratingDelta || 0);
        if (r.rank >= 1 && r.rank <= 4) ranks[r.rank - 1] += 1;
        if (r.rule === '東風') eastCount += 1;
        if (r.rule === '東南') southCount += 1;
      });

      // fromNewest のときは「直近何戦目か」の相対番号を使う
      const startIndex = i + 1;
      const endIndex = i + chunkRecords.length;

      result.push({
        startIndex,
        endIndex,
        count: chunkRecords.length,
        eastCount,
        southCount,
        totalRank,
        ranks,
        totalPt,
        totalRDelta,
      });
    }

    // 表示は常に「新しいグループが上」になるよう
    // fromOldest: 末尾から積んだ順なので reverse
    // fromNewest: 先頭グループが最新なのでそのまま
    return direction === 'fromOldest' ? result.reverse() : result;
  }, [records, chunkSize, ruleFilter, direction]);

  if (records.length === 0) {
    return <div className="text-center text-slate-500 py-10">データがありません</div>;
  }

  return (
    <div className="space-y-4">
      {/* 操作パネル */}
      <div className="flex items-center gap-6 bg-slate-800/30 p-4 rounded-xl border border-slate-700/50 flex-wrap">
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
        
        <div className="flex items-center gap-3">
          <label className="text-sm font-semibold text-slate-400">集計単位:</label>
          <select 
            value={chunkSize} 
            onChange={(e) => setChunkSize(Number(e.target.value))}
            className="glass-input text-sm py-1.5 w-36 font-medium"
          >
            <option value={0}>すべて表示</option>
            <option value={10}>10戦ごと</option>
            <option value={20}>20戦ごと</option>
            <option value={30}>30戦ごと</option>
            <option value={40}>40戦ごと</option>
            <option value={50}>50戦ごと</option>
            <option value={100}>100戦ごと</option>
          <option value={200}>200戦ごと</option>
          <option value={300}>300戦ごと</option>
            <option value={500}>500戦ごと</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-sm font-semibold text-slate-400">区切り起点:</label>
          <select
            value={direction}
            onChange={(e) => setDirection(e.target.value as 'fromOldest' | 'fromNewest')}
            className="glass-input text-sm py-1.5 w-44 font-medium"
          >
            <option value="fromOldest">古い対局から区切る</option>
            <option value="fromNewest">最新対局から区切る</option>
          </select>
        </div>
      </div>

      {/* グラフ表示 */}
      <StatsByCountGraph chunks={chunks} direction={direction} />

      {/* 集計テーブル */}
      <div className="overflow-x-auto rounded-xl border border-slate-700/50">
        <table className="w-full text-sm text-center whitespace-nowrap">
          <thead className="text-xs uppercase bg-slate-800/80 text-slate-400 border-b border-slate-700/50">
            <tr>
              <th className="px-4 py-3 font-semibold text-left">対象範囲</th>
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
            {chunks.map((d, i) => {
              const avgRank = d.totalRank / d.count;
              const avgPt = d.totalPt / d.count;
              
              return (
                <tr key={d.startIndex} className={`hover:bg-slate-800/30 transition-colors ${i % 2 === 0 ? 'bg-transparent' : 'bg-slate-900/20'}`}>
                  <td className="px-4 py-3 font-bold text-slate-300 text-left tracking-wider">
                    {chunkSize === 0
                      ? '全対局'
                      : direction === 'fromNewest'
                        ? `直近${d.startIndex}〜${d.endIndex}戦`
                        : `${d.startIndex}〜${d.endIndex}戦`
                    }
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
