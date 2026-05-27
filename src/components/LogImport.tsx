import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { Rank, Rule, Room, Dan } from '../types';
import { Clipboard, ArrowDownToLine, AlertCircle, CheckCircle, Info } from 'lucide-react';

interface ParsedGame {
  key: string; // 一時的な一意識別子
  date: string;
  rank: Rank;
  rule: Rule;
  room: Room;
  startDan: Dan;
  ratingBefore: number;
  ratingAfter: number;
  isDuplicate: boolean;
}

const KANJI_DAN_MAP: Record<string, Dan> = {
  '四段': '4段',
  '五段': '5段',
  '六段': '6段',
  '七段': '7段',
  '八段': '8段',
  '九段': '9段',
  '十段': '10段',
  '4段': '4段',
  '5段': '5段',
  '6段': '6段',
  '7段': '7段',
  '8段': '8段',
  '9段': '9段',
  '10段': '10段',
};

// ログのパース用正規表現
// 例: "4位 13分 2026-05-27 18:13 四特東喰赤速 五段510pt-70pt R1908 OneHand(+48.7)..."
const LOG_REGEX = /^(\d)位\s+(?:\d+分\s+)?(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2})\s+([三四]?)([般上特鳳])([東南])[^\s]*\s+([一二三四五六七八九十\d]+段)(\d+)pt([+-]?\d+)pt\s+R(\d+)/;

export default function LogImport() {
  const [logText, setLogText] = useState('');
  const [parsedGames, setParsedGames] = useState<ParsedGame[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [importing, setImporting] = useState(false);

  // 設定と既存レコードの取得
  const settings = useLiveQuery(() => db.settings.get(1));
  const existingRecords = useLiveQuery(() => db.gameRecords.toArray()) || [];

  const handleParse = () => {
    setErrorMsg('');
    setSuccessMsg('');
    
    if (!logText.trim()) {
      setErrorMsg('ログテキストを入力してください。');
      setParsedGames([]);
      return;
    }

    const deltas = settings?.ratingDeltas || { 1: 6, 2: 2, 3: -2, 4: -6 };
    const existingDates = new Set(
      existingRecords.map(r => {
        // DB内の日付を "yyyy-MM-dd HH:mm" の標準形式に変換して比較用とする
        const dateObj = new Date(r.date);
        const y = dateObj.getFullYear();
        const m = String(dateObj.getMonth() + 1).padStart(2, '0');
        const d = String(dateObj.getDate()).padStart(2, '0');
        const hh = String(dateObj.getHours()).padStart(2, '0');
        const mm = String(dateObj.getMinutes()).padStart(2, '0');
        return `${y}-${m}-${d} ${hh}:${mm}`;
      })
    );

    // 1. テキスト全体のすべての改行(\r\n, \n)やタブ(\t)を、一旦半角スペースに一斉置換して一本化する
    const singleLineText = logText
      .replace(/[\r\n\t]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // 2. 一本化したテキストに対し、「数字+位」の直前にのみ改行(\n)を挿入する
    const preparedText = singleLineText.replace(/(\d+位)/g, '\n$1');
    
    // 3. 改行で分割して、各対局ごとのブロック（1行にクリーンアップされたもの）を得る
    const rawBlocks = preparedText.split('\n');
    const tempParsed: ParsedGame[] = [];
    let failCount = 0;

    rawBlocks.forEach((block, index) => {
      const trimmedBlock = block.trim();
      if (!trimmedBlock) return;

      // 先頭が「数字+位」で始まっていない場合はスキップ（ヘッダー等のゴミデータ対策）
      if (!/^\d+位/.test(trimmedBlock)) {
        return;
      }

      const match = trimmedBlock.match(LOG_REGEX);
      if (!match) {
        failCount++;
        return;
      }

      const rank = Number(match[1]) as Rank;
      const dateRaw = match[2]; // yyyy-MM-dd HH:mm
      const roomChar = match[4]; // 般/上/特/鳳
      const ruleChar = match[5]; // 東/南
      const danRaw = match[6]; // 五段
      const ratingBefore = Number(match[9]); // R1908

      // 各項目のマッピングと検証
      let room: Room | null = null;
      if (roomChar === '特') room = '特上卓';
      if (roomChar === '鳳') room = '鳳凰卓';

      const rule: Rule = ruleChar === '東' ? '東風' : '東南';
      const startDan: Dan = KANJI_DAN_MAP[danRaw] || '4段';

      // 部屋の制限チェック (このアプリは特上卓・鳳凰卓のみ対応)
      if (!room) {
        failCount++;
        return;
      }

      // 重複チェック
      const isDuplicate = existingDates.has(dateRaw);

      // 仮レート計算
      const deltaR = deltas[rank] ?? 0;
      const ratingAfter = ratingBefore + deltaR;

      // 日時を "yyyy-MM-ddTHH:mm" 形式に変換して保存用とする
      const dateFormatted = dateRaw.replace(' ', 'T');

      tempParsed.push({
        key: `${dateRaw}-${index}`,
        date: dateFormatted,
        rank,
        rule,
        room,
        startDan,
        ratingBefore,
        ratingAfter,
        isDuplicate
      });
    });

    if (tempParsed.length === 0) {
      setErrorMsg('天鳳の対局ログを正しく読み込めませんでした。入力されたテキストが天鳳のログ形式（例: "4位 13分..."）であるか確認してください。');
      setParsedGames([]);
    } else {
      setParsedGames(tempParsed);
      if (failCount > 0) {
        setErrorMsg(`${failCount} 行のログが解析不可能、または未対応の卓（一般・上級）だったためスキップされました。`);
      }
    }
  };

  const handleImport = async () => {
    const toImport = parsedGames.filter(g => !g.isDuplicate);
    if (toImport.length === 0) {
      setErrorMsg('インポート可能な新規対局履歴がありません。');
      return;
    }

    setImporting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      // データベースに追加
      const addPromises = toImport.map(game => 
        db.gameRecords.add({
          date: game.date,
          rank: game.rank,
          rule: game.rule,
          room: game.room,
          startDan: game.startDan,
          rating: game.ratingAfter, // 仮レート変動後のRを対局後Rとして保存
          finalScore: 0,
        })
      );
      
      await Promise.all(addPromises);

      setSuccessMsg(`${toImport.length} 件の対局履歴を一括登録しました！`);
      setLogText('');
      setParsedGames([]);
    } catch (err) {
      console.error(err);
      setErrorMsg('データベースへのインポート中にエラーが発生しました。');
    } finally {
      setImporting(false);
    }
  };

  const newGamesCount = parsedGames.filter(g => !g.isDuplicate).length;
  const duplicateGamesCount = parsedGames.filter(g => g.isDuplicate).length;

  return (
    <div className="space-y-5">
      <div className="relative">
        <label className="block text-xs font-semibold tracking-wider text-slate-400 dark:text-slate-500 uppercase mb-2">
          天鳳対局ログテキスト（複数行の貼り付けに対応）
        </label>
        <textarea
          value={logText}
          onChange={e => setLogText(e.target.value)}
          placeholder={`【貼り付けログの例】
4位 13分 2026-05-27 18:13 四特東喰赤速 五段510pt-70pt R1908 OneHand(+48.7)天を仰ぐ(+16.8)torachan(-26.8)とらねこ丸(-38.7)`}
          rows={5}
          className="glass-input w-full font-mono text-xs leading-relaxed focus:ring-indigo-500/50 resize-y min-h-[120px]"
        />
        <button
          type="button"
          onClick={handleParse}
          className="glass-button bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-600 hover:text-white mt-3 w-full py-2.5 text-xs font-bold tracking-wide"
        >
          <Clipboard size={14} className="inline mr-1.5" /> ログを解析してプレビューを表示
        </button>
      </div>

      {errorMsg && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs flex items-start gap-2 animate-shake">
          <AlertCircle size={15} className="shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs flex items-start gap-2 animate-pulse">
          <CheckCircle size={15} className="shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {parsedGames.length > 0 && (
        <div className="space-y-4 pt-2 border-t border-slate-200 dark:border-slate-800/80">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold">
            <span className="text-slate-400">
              解析結果: 全 <span className="text-indigo-400 font-bold">{parsedGames.length}</span> 件
              {newGamesCount > 0 && <span className="ml-2 text-emerald-400">新規 {newGamesCount} 件</span>}
              {duplicateGamesCount > 0 && <span className="ml-2 text-slate-500">重複 {duplicateGamesCount} 件（自動スキップ）</span>}
            </span>

            <button
              onClick={handleImport}
              disabled={newGamesCount === 0 || importing}
              className={`glass-button text-xs font-extrabold px-5 py-2.5 flex items-center gap-1.5 ${
                newGamesCount === 0 || importing
                  ? 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
                  : 'bg-emerald-600/80 hover:bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:shadow-[0_0_20px_rgba(16,185,129,0.4)]'
              }`}
            >
              <ArrowDownToLine size={14} />
              {importing ? '登録中...' : `${newGamesCount} 件の新規対局を登録`}
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800/80 max-h-60 overflow-y-auto scrollbar-thin">
            <table className="w-full text-xs text-left whitespace-nowrap">
              <thead className="sticky top-0 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">
                <tr>
                  <th className="px-3 py-2 text-center">状態</th>
                  <th className="px-3 py-2">日時</th>
                  <th className="px-3 py-2">卓 / ルール</th>
                  <th className="px-3 py-2 text-center">順位</th>
                  <th className="px-3 py-2 text-right">対局前R</th>
                  <th className="px-3 py-2 text-right">仮変動後R</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                {parsedGames.map(game => (
                  <tr 
                    key={game.key}
                    className={`transition-colors ${
                      game.isDuplicate 
                        ? 'opacity-40 bg-slate-950/10' 
                        : 'hover:bg-slate-100/50 dark:hover:bg-slate-800/20'
                    }`}
                  >
                    <td className="px-3 py-2 text-center">
                      <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold ${
                        game.isDuplicate
                          ? 'bg-slate-800 text-slate-500'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {game.isDuplicate ? '重複' : '新規'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-slate-300 font-mono">
                      {new Date(game.date).toLocaleString([], { year: '2-digit', month: '2-digit', day: '2-digit', hour: '2-digit', minute:'2-digit' })}
                    </td>
                    <td className="px-3 py-2 text-[10px] font-bold tracking-wider">
                      <span className={
                        game.room === '特上卓' && game.rule === '東風' ? 'text-orange-400' :
                        game.room === '特上卓' && game.rule === '東南' ? 'text-teal-400' :
                        game.room === '鳳凰卓' && game.rule === '東風' ? 'text-rose-400' :
                        'text-purple-400'
                      }>
                        {game.room === '鳳凰卓' ? '鳳' : '特'}{game.rule === '東風' ? '東' : '南'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center font-bold">
                      <span className={`inline-flex items-center justify-center w-5 h-5 rounded font-bold text-[10px]
                        ${game.rank === 1 ? 'bg-[#4caf50]/20 text-[#4caf50]' : 
                          game.rank === 2 ? 'bg-[#fbc02d]/20 text-[#fbc02d]' : 
                          game.rank === 3 ? 'bg-[#ab47bc]/20 text-[#ab47bc]' : 
                          'bg-[#ef5350]/20 text-[#ef5350]'}`}>
                        {game.rank}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-slate-400">
                      R{game.ratingBefore}
                    </td>
                    <td className="px-3 py-2 text-right font-mono font-bold text-purple-300">
                      R{game.ratingAfter}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-2.5 bg-slate-900/40 rounded-lg text-[10px] text-slate-400 flex items-center gap-1.5">
            <Info size={12} className="text-indigo-400 shrink-0" />
            <span>
              仮変動後Rは「対局前R ＋ 仮レート変動値」で算出しています。変動値は設定タブから変更できます。
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
