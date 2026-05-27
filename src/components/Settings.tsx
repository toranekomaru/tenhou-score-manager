import { useState } from 'react';
import { db } from '../db/db';
import { Settings as SettingsType, Dan } from '../types';
import { Save } from 'lucide-react';
import { danOrder } from '../utils/calculator';

interface Props {
  settings: SettingsType;
}

export default function SettingsPanel({ settings }: Props) {
  const [dan, setDan] = useState<Dan>(settings.currentDan);
  const [point, setPoint] = useState<number>(settings.currentPoint);
  const [rating, setRating] = useState<number>(settings.currentRating);
  const [delta1, setDelta1] = useState<number>(settings.ratingDeltas?.[1] ?? 6);
  const [delta2, setDelta2] = useState<number>(settings.ratingDeltas?.[2] ?? 2);
  const [delta3, setDelta3] = useState<number>(settings.ratingDeltas?.[3] ?? -2);
  const [delta4, setDelta4] = useState<number>(settings.ratingDeltas?.[4] ?? -6);
  const [msg, setMsg] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await db.settings.update(1, {
      currentDan: dan,
      currentPoint: point,
      currentRating: rating,
      ratingDeltas: {
        1: delta1,
        2: delta2,
        3: delta3,
        4: delta4
      }
    });
    setMsg('設定を保存しました');
    setTimeout(() => setMsg(''), 3000);
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="space-y-2">
        <label className="block text-xs font-semibold tracking-wider text-slate-400 uppercase">Start Dan / 初期段位</label>
        <select value={dan} onChange={e => setDan(e.target.value as Dan)} className="glass-input w-full font-medium">
          {danOrder.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>
      <div className="space-y-2">
        <label className="block text-xs font-semibold tracking-wider text-slate-400 uppercase">Start Point / 初期ポイント</label>
        <input type="number" value={point} onChange={e => setPoint(Number(e.target.value))} className="glass-input w-full font-medium focus:ring-purple-500/50" />
      </div>
      <div className="space-y-2">
        <label className="block text-xs font-semibold tracking-wider text-slate-400 uppercase">Start Rating / 初期R</label>
        <input type="number" step="0.1" value={rating} onChange={e => setRating(Number(e.target.value))} className="glass-input w-full font-medium focus:ring-purple-500/50" />
      </div>

      <div className="border-t border-slate-200 dark:border-slate-800/80 pt-5 space-y-3">
        <h3 className="text-xs font-bold text-purple-600 dark:text-purple-300 tracking-wider uppercase">インポート用 仮レート増減設定</h3>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
          天鳳ログのインポート時、対局前Rに加算する仮のレーティング増減値を設定します。（1位＋6, 2位＋2, 3位-2, 4位-6 など）
        </p>
        <div className="grid grid-cols-4 gap-2.5">
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 text-center">1位</label>
            <input
              type="number"
              value={delta1}
              onChange={e => setDelta1(Number(e.target.value))}
              className="glass-input w-full font-bold text-center text-emerald-500 dark:text-emerald-400 focus:ring-emerald-500/30 py-1.5"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 text-center">2位</label>
            <input
              type="number"
              value={delta2}
              onChange={e => setDelta2(Number(e.target.value))}
              className="glass-input w-full font-bold text-center text-yellow-500 dark:text-yellow-400 focus:ring-yellow-500/30 py-1.5"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 text-center">3位</label>
            <input
              type="number"
              value={delta3}
              onChange={e => setDelta3(Number(e.target.value))}
              className="glass-input w-full font-bold text-center text-purple-500 dark:text-purple-400 focus:ring-purple-500/30 py-1.5"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 text-center">4位</label>
            <input
              type="number"
              value={delta4}
              onChange={e => setDelta4(Number(e.target.value))}
              className="glass-input w-full font-bold text-center text-rose-500 dark:text-rose-400 focus:ring-rose-500/30 py-1.5"
            />
          </div>
        </div>
      </div>
      
      <button type="submit" className="glass-button w-full bg-purple-600/80 hover:bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.2)] hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] mt-4 py-3 text-sm font-semibold tracking-wide">
        <Save size={18} /> 設定を更新し、全履歴を再計算する
      </button>

      {msg && <p className="text-emerald-400 text-center text-sm font-bold animate-pulse">{msg}</p>}
    </form>
  )
}
