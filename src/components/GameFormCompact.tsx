import React, { useState, useEffect } from 'react';
import { db } from '../db/db';
import { Rank, Rule, Room } from '../types';
import { Send, CheckCircle2 } from 'lucide-react';

export default function GameFormCompact() {
  const getLocalISOString = () => {
    const tzoffset = (new Date()).getTimezoneOffset() * 60000;
    return (new Date(Date.now() - tzoffset)).toISOString().slice(0, 16);
  };

  const [date, setDate]     = useState(getLocalISOString());
  const [isDateModified, setIsDateModified] = useState(false);
  const [rank, setRank]     = useState<Rank | null>(null);
  const [rule, setRule]     = useState<Rule | ''>('');
  const [room, setRoom]     = useState<Room | ''>('');
  const [rating, setRating] = useState<number | ''>('');
  const [success, setSuccess] = useState(false);

  // ユーザーが手動で日付を変更しない限り、日時を現在の時刻に追従させる
  useEffect(() => {
    if (!isDateModified) {
      const timer = setInterval(() => {
        setDate(getLocalISOString());
      }, 10000);
      return () => clearInterval(timer);
    }
  }, [isDateModified]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDate(e.target.value);
    setIsDateModified(true);
  };

  const isFormValid = rank !== null && rule !== '' && room !== '' && rating !== '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;
    await db.gameRecords.add({
      date,
      rank: rank!,
      rule: rule as Rule,
      room: room as Room,
      startDan: '4段',
      rating: rating as number,
      finalScore: 0,
    });
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2000);
    setDate(getLocalISOString());
    setIsDateModified(false);
    setRank(null);
    setRule('');
    setRoom('');
    setRating('');
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col md:flex-row md:items-center gap-3 md:gap-2 w-full">
      {/* 順位ボタン */}
      <div className="grid grid-cols-4 gap-1.5 md:flex md:gap-1 w-full md:w-auto">
        {([1, 2, 3, 4] as Rank[]).map(r => (
          <button
            key={r}
            type="button"
            onClick={() => setRank(r)}
            className={`h-12 md:w-11 md:h-10 rounded-lg text-lg md:text-base font-bold border transition-all duration-150 shadow-sm ${
              rank === r
                ? r === 1 ? 'bg-[#4caf50]/20 border-[#4caf50] text-[#4caf50] shadow-[#4caf50]/20'
                : r === 2 ? 'bg-[#fbc02d]/20 border-[#fbc02d] text-[#fbc02d] shadow-[#fbc02d]/20'
                : r === 3 ? 'bg-[#ab47bc]/20 border-[#ab47bc] text-[#ab47bc] shadow-[#ab47bc]/20'
                           : 'bg-[#ef5350]/20 border-[#ef5350] text-[#ef5350] shadow-[#ef5350]/20'
                : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-500 hover:border-slate-400 dark:hover:border-slate-400'
            }`}
          >{r}</button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2 w-full md:w-auto md:flex md:gap-2">
        {/* ルール */}
        <select
          value={rule}
          onChange={e => setRule(e.target.value as Rule | '')}
          className="glass-input text-sm h-11 md:h-10 px-3 py-0 w-full md:w-28 font-medium"
        >
          <option value="" disabled>ルール</option>
          <option value="東風">東風</option>
          <option value="東南">東南</option>
        </select>

        {/* 卓 */}
        <select
          value={room}
          onChange={e => setRoom(e.target.value as Room | '')}
          className="glass-input text-sm h-11 md:h-10 px-3 py-0 w-full md:w-28 font-medium"
        >
          <option value="" disabled>卓</option>
          <option value="特上卓">特上卓</option>
          <option value="鳳凰卓">鳳凰卓</option>
        </select>
      </div>

      <div className="flex gap-2 w-full md:w-auto">
        {/* 対局後R */}
        <input
          type="number"
          step="0.1"
          min={0}
          max={3000}
          value={rating}
          placeholder="対局後R"
          onChange={e => setRating(e.target.value === '' ? '' : Number(e.target.value))}
          className="glass-input text-sm h-11 md:h-10 px-3 py-0 w-1/3 md:w-28 font-bold"
        />
        {/* 日時 */}
        <input
          type="datetime-local"
          value={date}
          onChange={handleDateChange}
          className="glass-input text-sm h-11 md:h-10 px-2 md:px-3 py-0 w-2/3 md:w-44 text-slate-600 dark:text-slate-300"
        />
      </div>

      {/* 登録ボタン */}
      <button
        type="submit"
        disabled={!isFormValid}
        className={`h-12 md:h-10 px-5 w-full md:w-auto rounded-lg text-sm font-bold flex items-center justify-center gap-1.5 transition-all whitespace-nowrap mt-1 md:mt-0 ${
          success
            ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
            : isFormValid
              ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-500/20'
              : 'bg-slate-100 dark:bg-slate-700/60 text-slate-400 cursor-not-allowed border border-slate-200 dark:border-slate-700'
        }`}
      >
        {success
          ? <><CheckCircle2 size={16} /> 登録完了</>
          : <><Send size={16} /> 登録</>
        }
      </button>
    </form>
  );
}
