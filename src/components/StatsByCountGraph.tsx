import { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from 'recharts';
import { Eye, EyeOff, BarChart3, TrendingUp, Percent, Award, Landmark } from 'lucide-react';

interface ChunkData {
  startIndex: number;
  endIndex: number;
  count: number;
  eastCount: number;
  southCount: number;
  totalRank: number;
  ranks: [number, number, number, number];
  totalPt: number;
  totalRDelta: number;
}

interface Props {
  chunks: ChunkData[];
  direction: 'fromOldest' | 'fromNewest';
}

export default function StatsByCountGraph({ chunks, direction }: Props) {
  const [visibleCharts, setVisibleCharts] = useState({
    rankDan: true,
    rates: true,
    ptRate: true,
    avgPt: true,
  });

  // グラフ用データ（最新対局が常に右側に来るようにソート）
  const chartData = useMemo(() => {
    return [...chunks]
      .sort((a, b) => {
        if (direction === 'fromOldest') {
          // 古い対局から区切る場合：startIndexの昇順（例: 1〜50戦が左、最新が右）
          return a.startIndex - b.startIndex;
        } else {
          // 最新対局から区切る場合：startIndexの降順（例: 直近101〜145戦が左、直近1〜50戦（最新）が右）
          return b.startIndex - a.startIndex;
        }
      })
      .map(d => {
        const avgRank = d.totalRank / d.count;
        const avgPt = d.totalPt / d.count;
        const stableDan = d.ranks[3] > 0
          ? ((5 * d.ranks[0] + 2 * d.ranks[1] - 2 * d.ranks[3]) / d.ranks[3])
          : null;
        const topRate = (d.ranks[0] / d.count) * 100;
        const rentaiRate = ((d.ranks[0] + d.ranks[1]) / d.count) * 100;
        const lastRate = (d.ranks[3] / d.count) * 100;

        const label = d.startIndex === d.endIndex
          ? `${d.startIndex}戦目`
          : `${d.startIndex}〜${d.endIndex}戦`;

        return {
          label,
          avgRank: Number(avgRank.toFixed(2)),
          stableDan: stableDan !== null ? Number(stableDan.toFixed(2)) : null,
          topRate: Number(topRate.toFixed(1)),
          rentaiRate: Number(rentaiRate.toFixed(1)),
          lastRate: Number(lastRate.toFixed(1)),
          totalPt: d.totalPt,
          totalRDelta: Number(d.totalRDelta.toFixed(1)),
          avgPt: Number(avgPt.toFixed(1)),
        };
      });
  }, [chunks, direction]);

  const toggleChart = (key: keyof typeof visibleCharts) => {
    setVisibleCharts(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const hasVisibleChart = Object.values(visibleCharts).some(Boolean);

  if (chunks.length === 0) return null;

  return (
    <div className="space-y-6">
      {/* グラフ表示切り替えコントロールパネル */}
      <div className="bg-slate-800/20 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800/80">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <span className="text-sm font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
            <BarChart3 size={16} /> グラフ表示切替
          </span>
          <span className="text-[10px] bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 px-2 py-0.5 rounded font-medium">
            グラフをクリックして非表示/表示
          </span>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => toggleChart('rankDan')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
              visibleCharts.rankDan
                ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-600 dark:text-indigo-300'
                : 'bg-transparent border-slate-200 dark:border-slate-800 text-slate-400'
            }`}
          >
            {visibleCharts.rankDan ? <Eye size={14} /> : <EyeOff size={14} />}
            <TrendingUp size={13} className="text-indigo-500" />
            平均順位 & 安定段位
          </button>

          <button
            onClick={() => toggleChart('rates')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
              visibleCharts.rates
                ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-600 dark:text-indigo-300'
                : 'bg-transparent border-slate-200 dark:border-slate-800 text-slate-400'
            }`}
          >
            {visibleCharts.rates ? <Eye size={14} /> : <EyeOff size={14} />}
            <Percent size={13} className="text-emerald-500" />
            各種率 (トップ・連対・ラス)
          </button>

          <button
            onClick={() => toggleChart('ptRate')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
              visibleCharts.ptRate
                ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-600 dark:text-indigo-300'
                : 'bg-transparent border-slate-200 dark:border-slate-800 text-slate-400'
            }`}
          >
            {visibleCharts.ptRate ? <Eye size={14} /> : <EyeOff size={14} />}
            <Award size={13} className="text-cyan-500" />
            獲得Pt & 変動Rate
          </button>

          <button
            onClick={() => toggleChart('avgPt')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
              visibleCharts.avgPt
                ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-600 dark:text-indigo-300'
                : 'bg-transparent border-slate-200 dark:border-slate-800 text-slate-400'
            }`}
          >
            {visibleCharts.avgPt ? <Eye size={14} /> : <EyeOff size={14} />}
            <Landmark size={13} className="text-fuchsia-500" />
            平均Pt
          </button>
        </div>
      </div>

      {hasVisibleChart && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 1. 平均順位 & 安定段位 グラフ */}
          {visibleCharts.rankDan && (
            <div className="glass-panel p-5 relative overflow-hidden">
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                <TrendingUp size={16} className="text-indigo-500" /> 平均順位 & 安定段位
              </h3>
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 10, right: 15, left: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-800/80" vertical={false} />
                    <XAxis
                      dataKey="label"
                      stroke="#94a3b8"
                      tick={{ fill: '#64748b', fontSize: 10, fontWeight: 500 }}
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                    />
                    {/* 左Y軸：平均順位（1.00が最上部、反転） */}
                    <YAxis
                      yAxisId="left"
                      domain={[1.0, 4.0]}
                      reversed
                      ticks={[1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0]}
                      stroke="#6366f1"
                      tick={{ fill: '#818cf8', fontSize: 10, fontWeight: 600 }}
                      tickLine={false}
                      axisLine={false}
                      width={40}
                    />
                    {/* 右Y軸：安定段位 */}
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      domain={[0, 'auto']}
                      stroke="#14b8a6"
                      tick={{ fill: '#2dd4bf', fontSize: 10, fontWeight: 600 }}
                      tickLine={false}
                      axisLine={false}
                      width={35}
                    />
                    <Tooltip
                      contentStyle={{
                        background: 'rgba(15,23,42,0.95)',
                        border: '1px solid rgba(71,85,105,0.5)',
                        borderRadius: '8px',
                        padding: '10px',
                      }}
                      labelStyle={{ color: '#cbd5e1', fontSize: 11, fontWeight: 700, marginBottom: 4 }}
                      itemStyle={{ fontSize: 11, padding: '2px 0' }}
                    />
                    <Legend
                      verticalAlign="top"
                      height={30}
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{ fontSize: 11, fontWeight: 600 }}
                    />
                    <Line
                      yAxisId="left"
                      type="linear"
                      dataKey="avgRank"
                      name="平均順位"
                      stroke="#6366f1"
                      strokeWidth={3}
                      dot={{ r: 3, strokeWidth: 1 }}
                      activeDot={{ r: 5 }}
                    />
                    <Line
                      yAxisId="right"
                      type="linear"
                      dataKey="stableDan"
                      name="安定段位"
                      stroke="#14b8a6"
                      strokeWidth={3}
                      dot={{ r: 3, strokeWidth: 1 }}
                      activeDot={{ r: 5 }}
                      connectNulls
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* 2. 各種率 グラフ */}
          {visibleCharts.rates && (
            <div className="glass-panel p-5 relative overflow-hidden">
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                <Percent size={16} className="text-emerald-500" /> 各種率 (トップ・連対・ラス)
              </h3>
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 10, right: 15, left: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-800/80" vertical={false} />
                    <XAxis
                      dataKey="label"
                      stroke="#94a3b8"
                      tick={{ fill: '#64748b', fontSize: 10, fontWeight: 500 }}
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                    />
                    <YAxis
                      domain={[0, 100]}
                      ticks={[0, 25, 50, 75, 100]}
                      stroke="#475569"
                      tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${value}%`}
                      width={45}
                    />
                    <Tooltip
                      formatter={(value) => `${Number(value).toFixed(1)}%`}
                      contentStyle={{
                        background: 'rgba(15,23,42,0.95)',
                        border: '1px solid rgba(71,85,105,0.5)',
                        borderRadius: '8px',
                        padding: '10px',
                      }}
                      labelStyle={{ color: '#cbd5e1', fontSize: 11, fontWeight: 700, marginBottom: 4 }}
                      itemStyle={{ fontSize: 11, padding: '2px 0' }}
                    />
                    <Legend
                      verticalAlign="top"
                      height={30}
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{ fontSize: 11, fontWeight: 600 }}
                    />
                    <Line
                      type="linear"
                      dataKey="topRate"
                      name="トップ率"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      dot={{ r: 3, strokeWidth: 1 }}
                      activeDot={{ r: 5 }}
                    />
                    <Line
                      type="linear"
                      dataKey="rentaiRate"
                      name="連対率"
                      stroke="#06b6d4"
                      strokeWidth={2.5}
                      dot={{ r: 3, strokeWidth: 1 }}
                      activeDot={{ r: 5 }}
                    />
                    <Line
                      type="linear"
                      dataKey="lastRate"
                      name="ラス率"
                      stroke="#f43f5e"
                      strokeWidth={2.5}
                      dot={{ r: 3, strokeWidth: 1 }}
                      activeDot={{ r: 5 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* 3. 獲得ポイント & 変動レート グラフ */}
          {visibleCharts.ptRate && (
            <div className="glass-panel p-5 relative overflow-hidden">
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                <Award size={16} className="text-cyan-500" /> 獲得ポイント & 変動レート
              </h3>
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 10, right: 15, left: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-800/80" vertical={false} />
                    <XAxis
                      dataKey="label"
                      stroke="#94a3b8"
                      tick={{ fill: '#64748b', fontSize: 10, fontWeight: 500 }}
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                    />
                    {/* 左Y軸：獲得ポイント */}
                    <YAxis
                      yAxisId="left"
                      domain={['auto', 'auto']}
                      stroke="#38bdf8"
                      tick={{ fill: '#0ea5e9', fontSize: 10, fontWeight: 600 }}
                      tickLine={false}
                      axisLine={false}
                      width={50}
                    />
                    {/* 右Y軸：レート変動 */}
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      domain={['auto', 'auto']}
                      stroke="#c084fc"
                      tick={{ fill: '#a855f7', fontSize: 10, fontWeight: 600 }}
                      tickLine={false}
                      axisLine={false}
                      width={35}
                    />
                    <Tooltip
                      contentStyle={{
                        background: 'rgba(15,23,42,0.95)',
                        border: '1px solid rgba(71,85,105,0.5)',
                        borderRadius: '8px',
                        padding: '10px',
                      }}
                      labelStyle={{ color: '#cbd5e1', fontSize: 11, fontWeight: 700, marginBottom: 4 }}
                      itemStyle={{ fontSize: 11, padding: '2px 0' }}
                    />
                    <Legend
                      verticalAlign="top"
                      height={30}
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{ fontSize: 11, fontWeight: 600 }}
                    />
                    {/* 獲得Ptは視認性向上のためBarChartで表示 */}
                    <Bar
                      yAxisId="left"
                      dataKey="totalPt"
                      name="獲得Pt"
                      fill="#38bdf8"
                      fillOpacity={0.4}
                      stroke="#0ea5e9"
                      strokeWidth={1.5}
                      radius={[4, 4, 0, 0]}
                    />
                    <Line
                      yAxisId="right"
                      type="linear"
                      dataKey="totalRDelta"
                      name="R変動"
                      stroke="#c084fc"
                      strokeWidth={3}
                      dot={{ r: 3, strokeWidth: 1 }}
                      activeDot={{ r: 5 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* 4. 平均ポイント グラフ */}
          {visibleCharts.avgPt && (
            <div className="glass-panel p-5 relative overflow-hidden">
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                <Landmark size={16} className="text-fuchsia-500" /> 平均ポイント
              </h3>
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 10, right: 15, left: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-800/80" vertical={false} />
                    <XAxis
                      dataKey="label"
                      stroke="#94a3b8"
                      tick={{ fill: '#64748b', fontSize: 10, fontWeight: 500 }}
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                    />
                    <YAxis
                      domain={['auto', 'auto']}
                      stroke="#f43f5e"
                      tick={{ fill: '#e11d48', fontSize: 10, fontWeight: 600 }}
                      tickLine={false}
                      axisLine={false}
                      width={45}
                    />
                    <Tooltip
                      contentStyle={{
                        background: 'rgba(15,23,42,0.95)',
                        border: '1px solid rgba(71,85,105,0.5)',
                        borderRadius: '8px',
                        padding: '10px',
                      }}
                      labelStyle={{ color: '#cbd5e1', fontSize: 11, fontWeight: 700, marginBottom: 4 }}
                      itemStyle={{ fontSize: 11, padding: '2px 0' }}
                    />
                    <Legend
                      verticalAlign="top"
                      height={30}
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{ fontSize: 11, fontWeight: 600 }}
                    />
                    {/* プラス/マイナスで色を変えるためのBar描画処理 */}
                    <Bar
                      dataKey="avgPt"
                      name="平均Pt"
                      fill="#f43f5e"
                      radius={[4, 4, 0, 0]}
                    >
                      {chartData.map((entry, index) => {
                        const color = entry.avgPt >= 0 ? '#10b981' : '#f43f5e';
                        return <Cell key={`cell-${index}`} fill={color} fillOpacity={0.65} stroke={color} strokeWidth={1} />;
                      })}
                    </Bar>
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
