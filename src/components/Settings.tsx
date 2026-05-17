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
  const [msg, setMsg] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await db.settings.update(1, {
      currentDan: dan,
      currentPoint: point,
      currentRating: rating
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
      
      <button type="submit" className="glass-button w-full bg-purple-600/80 hover:bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.2)] hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] mt-4 py-3 text-sm font-semibold tracking-wide">
        <Save size={18} /> 設定を更新し、全履歴を再計算する
      </button>

      {msg && <p className="text-emerald-400 text-center text-sm font-bold animate-pulse">{msg}</p>}
    </form>
  )
}
