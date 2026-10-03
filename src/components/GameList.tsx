import { useState, useRef, useEffect } from 'react';
import { GameRecord, AiEvaluation, AI_EVALUATION_OPTIONS } from '../types';
import { db } from '../db/db';
import { Trash2, Pencil, Check, X } from 'lucide-react';

interface Props {
  records: GameRecord[];
}

export default function GameList({ records }: Props) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingRating, setEditingRating] = useState<string>('');
  const [editingAiId, setEditingAiId] = useState<number | null>(null);
  const [editingAiScoreId, setEditingAiScoreId] = useState<number | null>(null);
  const [editingAiScore, setEditingAiScore] = useState<string>('');
  const [editingMemoId, setEditingMemoId] = useState<number | null>(null);
  const [editingMemoText, setEditingMemoText] = useState<string>('');
  const memoTextareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editingMemoId !== null && memoTextareaRef.current) {
      memoTextareaRef.current.focus();
      const len = memoTextareaRef.current.value.length;
      memoTextareaRef.current.setSelectionRange(len, len);
    }
  }, [editingMemoId]);

  const handleDelete = async (id?: number) => {
    if (!id) return;
    if (window.confirm('この対局履歴を削除してよろしいですか？\n※以降の段位履歴は自動的に再計算されます。')) {
      await db.gameRecords.delete(id);
    }
  };

  const handleSaveRating = async (id: number, valueStr: string) => {
    const value = parseInt(valueStr, 10);
    if (isNaN(value)) { setEditingId(null); return; }
    const record = records.find(r => r.id === id);
    if (record && record.rating !== value) {
      await db.gameRecords.update(id, { rating: value });
    }
    setEditingId(null);
  };

  const handleSaveAiEvaluation = async (id: number, value: AiEvaluation | '') => {
    await db.gameRecords.update(id, { aiEvaluation: value || undefined });
    setEditingAiId(null);
  };

  const handleSaveAiScore = async (id: number, valueStr: string) => {
    const value = parseFloat(valueStr);
    if (isNaN(value)) {
      await db.gameRecords.update(id, { aiScore: undefined });
    } else {
      await db.gameRecords.update(id, { aiScore: value });
    }
    setEditingAiScoreId(null);
  };

  const handleStartEditMemo = (r: GameRecord) => {
    if (!r.id) return;
    setEditingMemoId(r.id);
    setEditingMemoText(r.memo ?? '');
  };

  const handleSaveMemo = async (id: number) => {
    const trimmed = editingMemoText.trim();
    await db.gameRecords.update(id, { memo: trimmed || undefined });
    setEditingMemoId(null);
  };

  const handleDeleteMemo = async (id: number) => {
    await db.gameRecords.update(id, { memo: undefined });
    setEditingMemoId(null);
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
            <th className="px-2 py-3 font-semibold w-10 text-center">No.</th>
            <th className="px-2 py-3 font-semibold text-left">日時</th>
            <th className="px-2 py-3 font-semibold text-left">卓</th>
            <th className="px-2 py-3 font-semibold text-center">順位</th>
            <th className="px-2 py-3 font-semibold text-right">±Pt</th>
            <th className="px-2 py-3 font-semibold text-center">段位PT</th>
            <th className="px-2 py-3 font-semibold text-center w-24">
              <div className="flex items-center justify-center gap-1">
                <span>R</span>
                <div className="w-[11px] opacity-0 pointer-events-none"></div>
              </div>
            </th>
            <th className="px-2 py-3 font-semibold text-center min-w-[120px]">
              <div className="flex items-center justify-center gap-1">
                <span>AI</span>
                <div className="w-[11px] opacity-0 pointer-events-none"></div>
              </div>
            </th>
            <th className="px-2 py-3 font-semibold text-center min-w-[80px]">
              <div className="flex items-center justify-center gap-1">
                <span>ｽｺｱ</span>
                <div className="w-[11px] opacity-0 pointer-events-none"></div>
              </div>
            </th>
            <th className="px-2 py-3 font-semibold text-left min-w-[120px]">メモ</th>
            <th className="px-2 py-3 font-semibold text-center w-16">操作</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/50">
          {reversedRecords.map((r, i) => (
            <tr key={r.id} className={`hover:bg-slate-800/30 transition-colors ${i % 2 === 0 ? 'bg-transparent' : 'bg-slate-900/20'}`}>
              {/* No. */}
              <td className="px-2 py-2.5 text-center text-slate-500 font-mono text-xs">{r.gameIndex}</td>

              {/* 日時 */}
              <td className="px-2 py-2.5 text-slate-300 text-xs">
                {new Date(r.date).toLocaleString([], { year: '2-digit', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
              </td>

              {/* 卓 */}
              <td className="px-2 py-2.5 text-xs font-bold tracking-wider">
                <span className={
                  r.room === '特上卓' && r.rule === '東風' ? 'text-orange-400' :
                  r.room === '特上卓' && r.rule === '東南' ? 'text-teal-400' :
                  r.room === '鳳凰卓' && r.rule === '東風' ? 'text-rose-400' :
                  'text-purple-400'
                }>
                  {r.room === '鳳凰卓' ? '鳳' : '特'}{r.rule === '東風' ? '東' : '南'}
                </span>
              </td>

              {/* 順位 */}
              <td className="px-2 py-2.5 text-center">
                <span className={`inline-flex items-center justify-center w-5 h-5 rounded font-bold text-xs
                  ${r.rank === 1 ? 'bg-[#4caf50]/20 text-[#4caf50]' :
                    r.rank === 2 ? 'bg-[#fbc02d]/20 text-[#fbc02d]' :
                    r.rank === 3 ? 'bg-[#ab47bc]/20 text-[#ab47bc]' :
                    'bg-[#ef5350]/20 text-[#ef5350]'}`}>
                  {r.rank}
                </span>
              </td>

              {/* 増減Pt */}
              <td className={`px-2 py-2.5 text-right font-medium text-xs ${r.delta !== undefined && r.delta > 0 ? 'text-emerald-400' : r.delta !== undefined && r.delta < 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                {r.delta! > 0 ? '+' : ''}{r.delta}
              </td>

              {/* 段位後/Pt */}
              <td className="px-2 py-2.5 text-center font-mono text-xs">
                <span className="text-indigo-300 mr-1">{r.danAfter}</span>
                <span className="text-slate-300">{r.pointAfter}pt</span>
              </td>

              {/* 対局後R */}
              <td className="px-2 py-2.5 text-center font-mono text-purple-300 text-xs w-24">
                {r.id !== undefined && editingId === r.id ? (
                  <div className="flex items-center justify-center gap-1" onClick={e => e.stopPropagation()}>
                    <input
                      type="number"
                      value={editingRating}
                      onChange={e => setEditingRating(e.target.value)}
                      className="w-16 px-1 py-0.5 text-right bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 font-mono text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      autoFocus
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleSaveRating(r.id!, editingRating);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                    />
                    <button onClick={() => handleSaveRating(r.id!, editingRating)} className="text-emerald-400 hover:text-emerald-300 p-0.5 rounded hover:bg-emerald-500/10 cursor-pointer" title="保存"><Check size={12} /></button>
                    <button onClick={() => setEditingId(null)} className="text-slate-400 hover:text-slate-300 p-0.5 rounded hover:bg-slate-500/10 cursor-pointer" title="キャンセル"><X size={12} /></button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-1 group/rate">
                    <span>{r.ratingAfter?.toFixed(0) || '-'}</span>
                    <button
                      onClick={() => { if (r.id !== undefined) { setEditingId(r.id); setEditingRating(r.rating?.toString() || ''); } }}
                      className="text-slate-500 md:opacity-0 md:group-hover/rate:opacity-100 focus:opacity-100 hover:text-purple-300 transition-opacity p-0.5 rounded hover:bg-purple-500/10 cursor-pointer"
                      title="レートを編集"
                    ><Pencil size={11} /></button>
                  </div>
                )}
              </td>

              {/* AI評価 */}
              <td className="px-2 py-2.5 text-center min-w-[120px]">
                {editingAiId === r.id ? (
                  <div className="flex items-center justify-center gap-0.5 flex-wrap" onClick={e => e.stopPropagation()}>
                    {AI_EVALUATION_OPTIONS.map(grade => (
                      <button
                        key={grade}
                        onClick={() => handleSaveAiEvaluation(r.id!, grade)}
                        className={`px-1 py-0.5 rounded text-xs font-bold border transition-all ${
                          r.aiEvaluation === grade
                            ? grade === 'S+' ? 'bg-amber-400/30 border-amber-400 text-amber-300'
                            : grade === 'S'  ? 'bg-yellow-400/30 border-yellow-400 text-yellow-300'
                            : grade === 'S-' ? 'bg-lime-400/30 border-lime-400 text-lime-300'
                            : grade === 'A'  ? 'bg-emerald-400/30 border-emerald-400 text-emerald-300'
                            : grade === 'B'  ? 'bg-sky-400/30 border-sky-400 text-sky-300'
                            : grade === 'C'  ? 'bg-violet-400/30 border-violet-400 text-violet-300'
                            :                  'bg-rose-400/30 border-rose-400 text-rose-300'
                            : 'border-slate-600 text-slate-400 hover:border-slate-400 hover:text-slate-200'
                        }`}
                      >{grade}</button>
                    ))}
                    <button onClick={() => handleSaveAiEvaluation(r.id!, '')} className="text-slate-500 hover:text-rose-300 p-0.5 rounded hover:bg-rose-500/10" title="評価を削除"><X size={11} /></button>
                    <button onClick={() => setEditingAiId(null)} className="text-slate-500 hover:text-slate-300 p-0.5 rounded hover:bg-slate-500/10" title="閉じる"><Check size={11} /></button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-1 group/ai">
                    {r.aiEvaluation ? (
                      <span className={`px-1.5 py-0.5 rounded text-xs font-bold border ${
                        r.aiEvaluation === 'S+' ? 'bg-amber-400/20 border-amber-400/50 text-amber-300'
                        : r.aiEvaluation === 'S'  ? 'bg-yellow-400/20 border-yellow-400/50 text-yellow-300'
                        : r.aiEvaluation === 'S-' ? 'bg-lime-400/20 border-lime-400/50 text-lime-300'
                        : r.aiEvaluation === 'A'  ? 'bg-emerald-400/20 border-emerald-400/50 text-emerald-300'
                        : r.aiEvaluation === 'B'  ? 'bg-sky-400/20 border-sky-400/50 text-sky-300'
                        : r.aiEvaluation === 'C'  ? 'bg-violet-400/20 border-violet-400/50 text-violet-300'
                        :                           'bg-rose-400/20 border-rose-400/50 text-rose-300'
                      }`}>{r.aiEvaluation}</span>
                    ) : (
                      <span className="text-slate-600 text-xs">-</span>
                    )}
                    <button
                      onClick={() => r.id !== undefined && setEditingAiId(r.id)}
                      className="text-slate-500 md:opacity-0 md:group-hover/ai:opacity-100 focus:opacity-100 hover:text-indigo-300 transition-opacity p-0.5 rounded hover:bg-indigo-500/10 cursor-pointer"
                      title="AI評価を編集"
                    ><Pencil size={11} /></button>
                  </div>
                )}
              </td>

              {/* AIスコア */}
              <td className="px-2 py-2.5 text-center font-mono text-xs w-20">
                {r.id !== undefined && editingAiScoreId === r.id ? (
                  <div className="flex items-center justify-center gap-1" onClick={e => e.stopPropagation()}>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={editingAiScore}
                      onChange={e => setEditingAiScore(e.target.value)}
                      className="w-14 px-1 py-0.5 text-right bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 font-mono text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      autoFocus
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleSaveAiScore(r.id!, editingAiScore);
                        if (e.key === 'Escape') setEditingAiScoreId(null);
                      }}
                    />
                    <button onClick={() => handleSaveAiScore(r.id!, editingAiScore)} className="text-emerald-400 hover:text-emerald-300 p-0.5 rounded hover:bg-emerald-500/10 cursor-pointer" title="保存"><Check size={12} /></button>
                    <button onClick={() => setEditingAiScoreId(null)} className="text-slate-400 hover:text-slate-300 p-0.5 rounded hover:bg-slate-500/10 cursor-pointer" title="キャンセル"><X size={12} /></button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-1 group/score">
                    <span className={r.aiScore !== undefined && r.aiScore >= 90 ? 'text-amber-300 font-bold' : r.aiScore !== undefined && r.aiScore >= 80 ? 'text-emerald-300 font-bold' : 'text-slate-300'}>
                      {r.aiScore !== undefined ? r.aiScore : '-'}
                    </span>
                    <button
                      onClick={() => { if (r.id !== undefined) { setEditingAiScoreId(r.id); setEditingAiScore(r.aiScore?.toString() || ''); } }}
                      className="text-slate-500 md:opacity-0 md:group-hover/score:opacity-100 focus:opacity-100 hover:text-indigo-300 transition-opacity p-0.5 rounded hover:bg-indigo-500/10 cursor-pointer"
                      title="AIスコアを編集"
                    ><Pencil size={11} /></button>
                  </div>
                )}
              </td>

              {/* メモ */}
              <td className="px-2 py-2.5 max-w-[180px]">
                {editingMemoId === r.id ? (
                  <div className="flex flex-col gap-1" onClick={e => e.stopPropagation()}>
                    <textarea
                      ref={memoTextareaRef}
                      value={editingMemoText}
                      onChange={e => setEditingMemoText(e.target.value)}
                      placeholder="メモを入力…"
                      rows={2}
                      className="w-40 resize-none rounded bg-amber-50/50 dark:bg-slate-800/80 border border-amber-500/40 focus:border-amber-500/70 focus:outline-none text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 text-xs px-2 py-1 transition-colors whitespace-normal"
                      onKeyDown={e => {
                        if (e.key === 'Escape') setEditingMemoId(null);
                        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSaveMemo(r.id!);
                      }}
                    />
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleSaveMemo(r.id!)} className="flex items-center gap-0.5 px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 text-xs font-semibold cursor-pointer transition-colors"><Check size={10} />保存</button>
                      {r.memo && (
                        <button onClick={() => handleDeleteMemo(r.id!)} className="flex items-center gap-0.5 px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 text-xs font-semibold cursor-pointer transition-colors"><X size={10} />削除</button>
                      )}
                      <button onClick={() => setEditingMemoId(null)} className="text-slate-500 hover:text-slate-300 p-0.5 rounded text-xs cursor-pointer">✕</button>
                    </div>
                  </div>
                ) : (
                  <div
                    className="group/memo flex items-start gap-1 cursor-pointer"
                    onClick={() => handleStartEditMemo(r)}
                    title="クリックして編集"
                  >
                    {r.memo ? (
                      <span className="text-slate-400 text-xs leading-relaxed whitespace-normal line-clamp-2 hover:text-slate-200 transition-colors">
                        {r.memo}
                      </span>
                    ) : (
                      <span className="text-slate-700 text-xs italic opacity-0 group-hover/memo:opacity-100 transition-opacity">メモを追加…</span>
                    )}
                    <Pencil size={10} className="text-slate-600 group-hover/memo:text-amber-400 transition-colors shrink-0 mt-0.5" />
                  </div>
                )}
              </td>

              {/* 操作 */}
              <td className="px-2 py-2.5 text-center">
                <button onClick={() => handleDelete(r.id)} className="text-slate-500 hover:text-rose-400 transition-colors p-1 rounded hover:bg-rose-500/10" title="削除">
                  <Trash2 size={14} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
