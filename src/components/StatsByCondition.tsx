import { useState } from 'react';
import { GameRecord } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface Props {
  records: GameRecord[];
}

type TabKey = '全体' | '東風' | '東南';
type Accent = 'good' | 'bad' | 'indigo' | 'neutral';

const PIE_COLORS = ['#22c55e', '#6366f1', '#a855f7', '#ef4444'];

function computeStats(filtered: GameRecord[]) {
  const count = filtered.length;
  const avgRank = filtered.reduce((s, r) => s + r.rank, 0) / count;
  const ranks = [1, 2, 3, 4].map(rank => filtered.filter(r => r.rank === rank).length) as [number, number, number, number];
  const topRate = (ranks[0] / count) * 100;
  const renTaiRate = ((ranks[0] + ranks[1]) / count) * 100;
  const lastRate = (ranks[3] / count) * 100;
  const totalPt = filtered.reduce((s, r) => s + (r.delta || 0), 0);
  const avgPt = totalPt / count;
  const stableDan = ranks[3] > 0
    ? (((5 * ranks[0]) + (2 * ranks[1]) - (2 * ranks[3])) / ranks[3]).toFixed(2)
    : '-';
  const totalRDelta = filtered.reduce((s, r) => s + (r.ratingDelta || 0), 0);
  return { count, avgRank, ranks, topRate, renTaiRate, lastRate, totalPt, avgPt, stableDan, totalRDelta };
}

export default function StatsByCondition({ records }: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>('全体');

  if (records.length === 0) {
    return <div className="text-center text-slate-400 py-10">データがありません</div>;
  }

  const tabs: { key: TabKey; filter: (r: GameRecord) => boolean }[] = [
    { key: '全体', filter: () => true },
    { key: '東風', filter: r => r.rule === '東風' },
    { key: '東南', filter: r => r.rule === '東南' },
  ];

  const availableTabs = tabs.filter(t => records.filter(t.filter).length > 0);
  const activeFilter = tabs.find(t => t.key === activeTab)?.filter ?? (() => true);
  const filtered = records.filter(activeFilter);

  if (filtered.length === 0) {
    return (
      <div className="text-center text-slate-400 py-8">
        このルールのデータがありません
      </div>
    );
  }

  const s = computeStats(filtered);
  const pieData = [
    { name: '1位', value: s.ranks[0] },
    { name: '2位', value: s.ranks[1] },
    { name: '3位', value: s.ranks[2] },
    { name: '4位', value: s.ranks[3] },
  ];

  return (
    <div className="space-y-4">

      {/* ─── タブ ─── */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl w-fit">
        {availableTabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-5 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === t.key
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            {t.key}
          </button>
        ))}
      </div>

      {/* ─── メイン: 指標 + 円グラフ ─── */}
      <div className="flex flex-col lg:flex-row gap-5">

        {/* 指標グリッド */}
        <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
          <StatBox label="対局数"   value={s.count}   unit="戦"  accent="neutral" />
          <StatBox label="平均順位" value={s.avgRank.toFixed(2)}  accent="neutral" />
          <StatBox label="安定段位" value={s.stableDan}           accent="indigo"  />
          <StatBox label="R変動"
            value={s.totalRDelta > 0 ? `+${s.totalRDelta.toFixed(1)}` : s.totalRDelta.toFixed(1)}
            accent={s.totalRDelta >= 0 ? 'good' : 'bad'} />
          <StatBox label="トップ率" value={`${s.topRate.toFixed(1)}%`}    accent={s.topRate >= 30 ? 'good' : 'neutral'} />
          <StatBox label="連対率"   value={`${s.renTaiRate.toFixed(1)}%`} accent={s.renTaiRate >= 50 ? 'good' : 'neutral'} />
          <StatBox label="ラス率"   value={`${s.lastRate.toFixed(1)}%`}   accent={s.lastRate >= 25 ? 'bad' : 'neutral'} />
          <StatBox label="獲得Pt"
            value={s.totalPt > 0 ? `+${s.totalPt}` : String(s.totalPt)}
            accent={s.totalPt >= 0 ? 'good' : 'bad'} />
          <StatBox label="平均Pt"
            value={s.avgPt > 0 ? `+${s.avgPt.toFixed(1)}` : s.avgPt.toFixed(1)}
            accent={s.avgPt >= 0 ? 'good' : 'bad'} />
        </div>

        {/* 小型円グラフ */}
        <div className="flex flex-row lg:flex-col items-center justify-center gap-4 lg:gap-2 shrink-0">
          <div>
            <div className="text-[10px] font-semibold tracking-widest text-slate-400 uppercase text-center mb-1">着順分布</div>
            <div className="relative h-28 w-28">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%" cy="50%"
                    innerRadius={30} outerRadius={50}
                    startAngle={90} endAngle={-270}
                    stroke="none" paddingAngle={2}
                    dataKey="value" isAnimationActive
                  >
                    {pieData.map((_, idx) => (
                      <Cell key={idx} fill={PIE_COLORS[idx]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: number) => [`${v}回 (${((v / s.count) * 100).toFixed(1)}%)`, '回数']}
                    contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px', color: '#1e293b' }}
                    itemStyle={{ fontWeight: 'bold' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-lg font-black font-mono text-slate-800 dark:text-slate-100 leading-none">{s.avgRank.toFixed(2)}</span>
                <span className="text-[8px] text-slate-400 uppercase tracking-wider mt-0.5">avg</span>
              </div>
            </div>
          </div>
          {/* Legend */}
          <div className="grid grid-cols-2 gap-x-3 gap-y-1">
            {['1位', '2位', '3位', '4位'].map((lbl, idx) => (
              <div key={lbl} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[idx] }} />
                <span className="text-[11px] text-slate-500 dark:text-slate-400">{lbl}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── 分布バー ─── */}
      <div className="flex h-4 w-full rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 shadow-inner">
        {s.ranks[0] > 0 && (
          <div style={{ width: `${(s.ranks[0] / s.count) * 100}%` }}
            className="bg-green-500 flex items-center justify-center text-[9px] font-bold text-white transition-all"
            title={`1位: ${s.ranks[0]}回`}>{s.ranks[0]}</div>
        )}
        {s.ranks[1] > 0 && (
          <div style={{ width: `${(s.ranks[1] / s.count) * 100}%` }}
            className="bg-indigo-500 flex items-center justify-center text-[9px] font-bold text-white transition-all"
            title={`2位: ${s.ranks[1]}回`}>{s.ranks[1]}</div>
        )}
        {s.ranks[2] > 0 && (
          <div style={{ width: `${(s.ranks[2] / s.count) * 100}%` }}
            className="bg-purple-400 flex items-center justify-center text-[9px] font-bold text-white transition-all"
            title={`3位: ${s.ranks[2]}回`}>{s.ranks[2]}</div>
        )}
        {s.ranks[3] > 0 && (
          <div style={{ width: `${(s.ranks[3] / s.count) * 100}%` }}
            className="bg-red-400 flex items-center justify-center text-[9px] font-bold text-white transition-all"
            title={`4位: ${s.ranks[3]}回`}>{s.ranks[3]}</div>
        )}
      </div>

    </div>
  );
}

function StatBox({ label, value, unit, accent = 'neutral' }: {
  label: string;
  value: string | number;
  unit?: string;
  accent?: Accent;
}) {
  const valueColor: Record<Accent, string> = {
    good:    'text-green-600 dark:text-green-400',
    bad:     'text-red-500  dark:text-red-400',
    indigo:  'text-indigo-600 dark:text-indigo-300',
    neutral: 'text-slate-900 dark:text-slate-50',
  };

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-3 md:p-4 shadow-sm bg-white dark:bg-slate-900/40 flex flex-col justify-center">
      <div className={`text-2xl md:text-3xl font-black font-mono leading-none ${valueColor[accent]}`}>
        {value}
        {unit && <span className="text-sm font-normal text-slate-400 ml-1">{unit}</span>}
      </div>
      <div className="text-[10px] text-slate-400 uppercase tracking-wider mt-1.5 font-semibold">
        {label}
      </div>
    </div>
  );
}
