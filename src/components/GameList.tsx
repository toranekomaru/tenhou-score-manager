import { GameRecord } from '../types';
import { db } from '../db/db';
import { Trash2 } from 'lucide-react';

interface Props {
  records: GameRecord[];
}

export default function GameList({ records }: Props) {
  const handleDelete = async (id?: number) => {
    if (!id) return;
    if (window.confirm('この対局履歴を削除してよろしいですか？\n※以降の段位履歴は自動的に再計算されます。')) {
      await db.gameRecords.delete(id);
    }
  };

  const reversedRecords = [...records].reverse();

  if (records.length === 0) {
    return <div className="text-center py-10 text-slate-500">対局履歴がありません。</div>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-700/50">
      <table className="w-full text-sm text-left whitespace-nowrap">
        <thead className="text-xs uppercase bg-slate-800/80 text-slate-400 border-b border-slate-700/50">
          <tr>
            <th className="px-4 py-3 font-semibold w-16 text-center">No.</th>
            <th className="px-4 py-3 font-semibold">日時</th>
            <th className="px-4 py-3 font-semibold">卓</th>
            <th className="px-4 py-3 font-semibold text-center">順位</th>
            <th className="px-4 py-3 font-semibold text-right">増減Pt</th>
            <th className="px-4 py-3 font-semibold text-right">段位後/Pt</th>
            <th className="px-4 py-3 font-semibold text-right">対局後R</th>
            <th className="px-4 py-3 font-semibold text-center">操作</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/50">
          {reversedRecords.map((r, i) => (
            <tr key={r.id} className={`hover:bg-slate-800/30 transition-colors ${i % 2 === 0 ? 'bg-transparent' : 'bg-slate-900/20'}`}>
              <td className="px-4 py-3 text-center text-slate-500 font-mono text-xs">{r.gameIndex}</td>
              <td className="px-4 py-3 text-slate-300">{new Date(r.date).toLocaleString([], { year: '2-digit', month: '2-digit', day: '2-digit', hour: '2-digit', minute:'2-digit' })}</td>
              <td className="px-4 py-3 text-xs font-bold tracking-wider">
                <span className={
                  r.room === '特上卓' && r.rule === '東風' ? 'text-orange-400' :
                  r.room === '特上卓' && r.rule === '東南' ? 'text-teal-400' :
                  r.room === '鳳凰卓' && r.rule === '東風' ? 'text-rose-400' :
                  'text-purple-400'
                }>
                  {r.room === '鳳凰卓' ? '鳳' : '特'}{r.rule === '東風' ? '東' : '南'}
                </span>
              </td>
              <td className="px-4 py-3 text-center">
                <span className={`inline-flex items-center justify-center w-6 h-6 rounded-md font-bold text-xs
                  ${r.rank === 1 ? 'bg-[#4caf50]/20 text-[#4caf50]' : 
                    r.rank === 2 ? 'bg-[#fbc02d]/20 text-[#fbc02d]' : 
                    r.rank === 3 ? 'bg-[#ab47bc]/20 text-[#ab47bc]' : 
                    'bg-[#ef5350]/20 text-[#ef5350]'}`}>
                  {r.rank}
                </span>
              </td>
              <td className={`px-4 py-3 text-right font-medium ${r.delta !== undefined && r.delta > 0 ? 'text-emerald-400' : r.delta !== undefined && r.delta < 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                {r.delta! > 0 ? '+' : ''}{r.delta}
              </td>
              <td className="px-4 py-3 text-right font-mono">
                <span className="text-indigo-300 mr-2 text-xs">{r.danAfter}</span>
                <span className="text-slate-300">{r.pointAfter} pt</span>
              </td>
              <td className="px-4 py-3 text-right font-mono text-purple-300">
                {r.ratingAfter?.toFixed(0) || '-'}
              </td>
              <td className="px-4 py-3 text-center">
                <button onClick={() => handleDelete(r.id)} className="text-slate-500 hover:text-rose-400 transition-colors p-1 rounded hover:bg-rose-500/10" title="削除">
                  <Trash2 size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
