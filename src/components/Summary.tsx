import { GameRecord } from '../types';
import { Target, TrendingUp, Award, Activity } from 'lucide-react';

interface Props {
  records: GameRecord[];
  full?: boolean;
}

export default function Summary({ records, full = false }: Props) {
  const total = records.length;
  if (total === 0) {
    return (
      <div className="glass-panel p-6 text-center text-slate-400 h-full flex items-center justify-center border-dashed border-2">
        データがありません。対局を記録してください。
      </div>
    );
  }

  const ranks = [0, 0, 0, 0];
  records.forEach(r => {
    if (r.rank >= 1 && r.rank <= 4) ranks[r.rank - 1]++;
  });

  const avgRank = records.reduce((acc, r) => acc + r.rank, 0) / total;
  const topRate = (ranks[0] / total) * 100;
  const lastRate = (ranks[3] / total) * 100;

  return (
    <div className={`grid grid-cols-2 ${full ? 'md:grid-cols-2' : 'md:grid-cols-4'} gap-4`}>
      <div className="glass-panel p-5 relative overflow-hidden group hover:border-blue-500/30 transition-all duration-300">
        <div className="absolute -right-4 -top-4 w-16 h-16 bg-blue-500/10 rounded-full blur-xl group-hover:bg-blue-500/20 transition-all"></div>
        <div className="flex items-center gap-2 text-slate-400 mb-2">
          <Target size={16} className="text-blue-400" />
          <span className="text-xs font-semibold tracking-wider uppercase">Games</span>
        </div>
        <div className="text-2xl font-bold text-slate-100">{total}</div>
      </div>

      <div className="glass-panel p-5 relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-300">
        <div className="absolute -right-4 -top-4 w-16 h-16 bg-emerald-500/10 rounded-full blur-xl group-hover:bg-emerald-500/20 transition-all"></div>
        <div className="flex items-center gap-2 text-slate-400 mb-2">
          <Activity size={16} className="text-emerald-400" />
          <span className="text-xs font-semibold tracking-wider uppercase">Avg Rank</span>
        </div>
        <div className="text-2xl font-bold text-slate-100">{avgRank.toFixed(2)}</div>
      </div>

      <div className="glass-panel p-5 relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-300">
        <div className="absolute -right-4 -top-4 w-16 h-16 bg-emerald-500/10 rounded-full blur-xl group-hover:bg-emerald-500/20 transition-all"></div>
        <div className="flex items-center gap-2 text-slate-400 mb-2">
          <Award size={16} className="text-emerald-400" />
          <span className="text-xs font-semibold tracking-wider uppercase">Top Rate</span>
        </div>
        <div className="text-2xl font-bold text-slate-100">{topRate.toFixed(1)} <span className="text-sm font-normal text-slate-500">%</span></div>
        <div className="mt-3 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-400 h-1.5 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" style={{ width: `${topRate}%` }}></div>
        </div>
      </div>

      <div className="glass-panel p-5 relative overflow-hidden group hover:border-rose-500/30 transition-all duration-300">
        <div className="absolute -right-4 -top-4 w-16 h-16 bg-rose-500/10 rounded-full blur-xl group-hover:bg-rose-500/20 transition-all"></div>
        <div className="flex items-center gap-2 text-slate-400 mb-2">
          <TrendingUp size={16} className="text-rose-400" />
          <span className="text-xs font-semibold tracking-wider uppercase">4th Rate</span>
        </div>
        <div className="text-2xl font-bold text-slate-100">{lastRate.toFixed(1)} <span className="text-sm font-normal text-slate-500">%</span></div>
        <div className="mt-3 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
          <div className="bg-gradient-to-r from-rose-500 to-rose-300 h-1.5 rounded-full shadow-[0_0_10px_rgba(244,63,94,0.5)]" style={{ width: `${lastRate}%` }}></div>
        </div>
      </div>
    </div>
  )
}
