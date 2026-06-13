import React, { useState } from 'react';
import { db } from '../db/db';
import { Rank, Rule, Room } from '../types';
import { Send, CheckCircle2 } from 'lucide-react';

export default function GameForm() {
  // YYYY-MM-DDTHH:mm の形式でローカル時刻を取得
  const getLocalISOString = () => {
    const tzoffset = (new Date()).getTimezoneOffset() * 60000;
    return (new Date(Date.now() - tzoffset)).toISOString().slice(0, 16);
  };

  const [date, setDate] = useState(getLocalISOString());
  const [rank, setRank] = useState<Rank | null>(null);        // 未選択
  const [rule, setRule] = useState<Rule | ''>('');             // 未選択
  const [room, setRoom] = useState<Room | ''>('');             // 未選択
  const [rating, setRating] = useState<number | ''>('');      // 未入力
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const isFormValid = rank !== null && rule !== '' && room !== '' && rating !== '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isFormValid) {
      setError('すべての項目を入力してください');
      return;
    }

    await db.gameRecords.add({
      date,
      rank: rank!,
      rule: rule as Rule,
      room: room as Room,
      startDan: '4段', // ダミー値（calculateHistoryによって上書きされるため）
      rating: rating as number,
      finalScore: 0,
    });

    setSuccess(true);
    setTimeout(() => setSuccess(false), 2000);

    // 登録後は日時以外をリセット（次の入力ミスを防ぐ）
    setDate(getLocalISOString());
    setRank(null);
    setRule('');
    setRoom('');
    setRating('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 日時 */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold tracking-wider text-slate-400 uppercase">
          DateTime / 日時
        </label>
        <input
          type="datetime-local"
          value={date}
          onChange={e => setDate(e.target.value)}
          required
          className="glass-input w-full text-sm font-medium"
        />
      </div>

      {/* 順位 */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold tracking-wider text-slate-400 uppercase">
          Rank / 順位 <span className="text-red-400 ml-1">*</span>
        </label>
        <div className="grid grid-cols-4 gap-3">
          {([1, 2, 3, 4] as Rank[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRank(r)}
              className={`py-2 rounded-xl text-lg font-bold transition-all duration-200 border ${
                rank === r
                  ? r === 1 ? 'bg-[#4caf50]/20 border-[#4caf50] text-[#4caf50] shadow-[0_0_15px_rgba(76,175,80,0.3)]'
                  : r === 2 ? 'bg-[#fbc02d]/20 border-[#fbc02d] text-[#fbc02d] shadow-[0_0_15px_rgba(251,192,45,0.3)]'
                  : r === 3 ? 'bg-[#ab47bc]/20 border-[#ab47bc] text-[#ab47bc] shadow-[0_0_15px_rgba(171,71,188,0.3)]'
                  : 'bg-[#ef5350]/20 border-[#ef5350] text-[#ef5350] shadow-[0_0_15px_rgba(239,83,80,0.3)]'
                  : 'bg-slate-800/50 border-slate-700 text-slate-500 hover:bg-slate-700 hover:text-slate-300'
              }`}
            >
              {r}着
            </button>
          ))}
        </div>
        {rank === null && (
          <p className="text-xs text-slate-500">順位を選択してください</p>
        )}
      </div>

      {/* ルール・卓 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-xs font-semibold tracking-wider text-slate-400 uppercase">
            Rule / ルール <span className="text-red-400 ml-1">*</span>
          </label>
          <select
            value={rule}
            onChange={e => setRule(e.target.value as Rule | '')}
            className="glass-input w-full text-sm font-medium"
          >
            <option value="" disabled className="text-slate-500">― 選択 ―</option>
            <option value="東風">東風</option>
            <option value="東南">東南</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="block text-xs font-semibold tracking-wider text-slate-400 uppercase">
            Room / 卓 <span className="text-red-400 ml-1">*</span>
          </label>
          <select
            value={room}
            onChange={e => setRoom(e.target.value as Room | '')}
            className="glass-input w-full text-sm font-medium"
          >
            <option value="" disabled className="text-slate-500">― 選択 ―</option>
            <option value="特上卓">特上卓</option>
            <option value="鳳凰卓">鳳凰卓</option>
          </select>
        </div>
      </div>

      {/* 対局後R */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold tracking-wider text-slate-400 uppercase">
          Rating / 対局後R <span className="text-red-400 ml-1">*</span>
        </label>
        <input
          type="number"
          step="0.1"
          min={0}
          max={3000}
          value={rating}
          placeholder="例: 1823.5"
          onChange={e => setRating(e.target.value === '' ? '' : Number(e.target.value))}
          className="glass-input w-full font-medium"
        />
      </div>

      {/* エラーメッセージ */}
      {error && (
        <p className="text-sm text-red-400 font-medium">{error}</p>
      )}

      {/* 送信ボタン */}
      <button
        type="submit"
        disabled={!isFormValid}
        className={`glass-button w-full pt-4 pb-4 mt-8 transition-all duration-300 text-sm font-bold tracking-wider ${
          success
            ? 'bg-emerald-600/80 hover:bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.4)]'
            : isFormValid
              ? 'bg-indigo-600/80 hover:bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.2)] hover:shadow-[0_0_20px_rgba(99,102,241,0.4)]'
              : 'bg-slate-700/60 text-slate-500 cursor-not-allowed opacity-60'
        }`}
      >
        {success ? (
          <><CheckCircle2 size={18} /> 登録完了</>
        ) : (
          <><Send size={18} /> データベースに登録</>
        )}
      </button>
    </form>
  );
}
