import { useState, useMemo } from 'react';
import { GameRecord } from '../types';
import { 
  Trophy, TrendingUp, TrendingDown, Award, Sparkles, Frown, Gamepad2, Calendar,
  Flame, ShieldCheck, Skull, Hourglass, Star, ChevronUp, ChevronDown, Zap
} from 'lucide-react';

interface Props {
  records: GameRecord[];
}

interface PeriodData {
  key: string;
  label: string;
  totalPt: number;
  count: number;
  avgRank: number;
  ranks: [number, number, number, number];
}

interface ConsecutiveTracker {
  maxCount: number;
  currentCount: number;
  maxStart: string;
  maxEnd: string;
  currentStart: string;
}

const createTracker = (): ConsecutiveTracker => ({
  maxCount: 0,
  currentCount: 0,
  maxStart: '',
  maxEnd: '',
  currentStart: ''
});

const updateTracker = (tracker: ConsecutiveTracker, condition: boolean, date: string) => {
  if (condition) {
    if (tracker.currentCount === 0) {
      tracker.currentStart = date;
    }
    tracker.currentCount += 1;
    if (tracker.currentCount > tracker.maxCount) {
      tracker.maxCount = tracker.currentCount;
      tracker.maxStart = tracker.currentStart;
      tracker.maxEnd = date;
    }
  } else {
    tracker.currentCount = 0;
    tracker.currentStart = '';
  }
};

const formatRange = (startStr: string, endStr: string) => {
  if (!startStr || !endStr) return '';
  
  const normalize = (str: string) => str.includes(' ') ? str.replace(' ', 'T') : str;
  const start = new Date(normalize(startStr));
  const end = new Date(normalize(endStr));
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return '';

  const startFmt = `${start.getMonth() + 1}/${start.getDate()}`;
  const endFmt = `${end.getMonth() + 1}/${end.getDate()}`;

  if (startFmt === endFmt && start.getFullYear() === end.getFullYear()) {
    return `${start.getFullYear()}/${startFmt}`;
  }
  
  if (start.getFullYear() === end.getFullYear()) {
    return `${start.getFullYear()}/${startFmt} 〜 ${endFmt}`;
  }

  return `${start.getFullYear()}/${startFmt} 〜 ${end.getFullYear()}/${endFmt}`;
};

// 段位の順序
const danOrder = ['4段','5段','6段','7段','8段','9段','10段'];

// 段位+ポイントを通算スコアに変換（4段1500pt < 5段100pt の比較に使用）
const danToScore = (dan: string, point: number): number => {
  const idx = danOrder.indexOf(dan);
  if (idx < 0) return 0;
  return idx * 10000 + point;
};

// 日付文字列を「M月D日 HH:mm」形式にフォーマット
const formatDateTime = (dateStr: string): string => {
  if (!dateStr) return '-';
  const normalized = dateStr.includes(' ') ? dateStr.replace(' ', 'T') : dateStr;
  const d = new Date(normalized);
  if (isNaN(d.getTime())) return '-';
  const M = d.getMonth() + 1;
  const D = d.getDate();
  const HH = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${M}月${D}日 ${HH}:${mm}`;
};

export default function RecordsRoom({ records }: Props) {
  const [timeUnit, setTimeUnit] = useState<'day' | 'week' | 'month'>('day');

  // 1. 各種連続記録の算出
  const consecutiveStats = useMemo(() => {
    const wins = createTracker();
    const rentai = createTracker();
    const avoidLast = createTracker();
    const consecutiveLasts = createTracker();
    const gyakuRentai = createTracker();
    const noTop = createTracker();

    // recordsは古い順（時系列昇順）
    records.forEach(r => {
      const rank = r.rank;
      const date = r.date;

      // ① 最大連勝
      updateTracker(wins, rank === 1, date);

      // ② 最大連対
      updateTracker(rentai, rank === 1 || rank === 2, date);

      // ③ 避ラス（ラス抜き）
      updateTracker(avoidLast, rank !== 4, date);

      // ④ 最大ラス連
      updateTracker(consecutiveLasts, rank === 4, date);

      // ⑤ 連続逆連対
      updateTracker(gyakuRentai, rank === 3 || rank === 4, date);

      // ⑥ 連続トップなし（トップ抜き）
      updateTracker(noTop, rank !== 1, date);
    });

    return {
      wins,
      rentai,
      avoidLast,
      consecutiveLasts,
      gyakuRentai,
      noTop
    };
  }, [records]);

  // 2. マイルストーン記録の算出（最高/最低レーティング、最大/最小段位PT）
  const milestoneStats = useMemo(() => {
    let maxRating: number | null = null;
    let maxRatingDate = '';
    let minRating: number | null = null;
    let minRatingDate = '';
    let maxDanScore: number | null = null;
    let maxDanLabel = '';
    let maxDanDate = '';
    let minDanScore: number | null = null;
    let minDanLabel = '';
    let minDanDate = '';

    records.forEach(r => {
      // レーティング（ratingAfter を使用）
      const rating = r.ratingAfter ?? r.rating;
      if (rating !== undefined) {
        if (maxRating === null || rating > maxRating) {
          maxRating = rating;
          maxRatingDate = r.date;
        }
        if (minRating === null || rating < minRating) {
          minRating = rating;
          minRatingDate = r.date;
        }
      }

      // 段位PT（danAfter + pointAfter で比較）
      if (r.danAfter && r.pointAfter !== undefined) {
        const score = danToScore(r.danAfter, r.pointAfter);
        const label = `${r.danAfter} ${r.pointAfter}pt`;
        if (maxDanScore === null || score > maxDanScore) {
          maxDanScore = score;
          maxDanLabel = label;
          maxDanDate = r.date;
        }
        if (minDanScore === null || score < minDanScore) {
          minDanScore = score;
          minDanLabel = label;
          minDanDate = r.date;
        }
      }
    });

    return {
      maxRating, maxRatingDate,
      minRating, minRatingDate,
      maxDanLabel, maxDanDate,
      minDanLabel, minDanDate,
    };
  }, [records]);

  if (records.length === 0) {
    return (
      <div className="text-center text-slate-500 py-16 glass-panel flex flex-col items-center justify-center gap-3">
        <Trophy size={48} className="text-slate-600 dark:text-slate-400 opacity-40 animate-pulse" />
        <p className="text-base font-semibold">対局データがありません。</p>
        <p className="text-xs text-slate-400">対局履歴を登録すると、ここに記録室（ランキングと連続記録）が表示されます。</p>
      </div>
    );
  }

  // 週の月曜日〜日曜日の期間を取得
  const getWeekKey = (dateString: string) => {
    const normalized = dateString.includes(' ') ? dateString.replace(' ', 'T') : dateString;
    const d = new Date(normalized);
    if (isNaN(d.getTime())) {
      return { key: 'invalid', label: '無効な日付' };
    }
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // 月曜起算
    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const format = (date: Date) => 
      `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
    const formatShort = (date: Date) => 
      `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;

    return {
      key: format(monday),
      label: `${format(monday)} 〜 ${formatShort(sunday)}`
    };
  };

  // 日付の取得
  const getDayKey = (dateString: string) => {
    const normalized = dateString.includes(' ') ? dateString.replace(' ', 'T') : dateString;
    const d = new Date(normalized);
    if (isNaN(d.getTime())) {
      return { key: 'invalid', label: '無効な日付' };
    }
    const format = (date: Date) => 
      `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
    return {
      key: format(d),
      label: `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
    };
  };

  // 月の取得
  const getMonthKey = (dateString: string) => {
    const normalized = dateString.includes(' ') ? dateString.replace(' ', 'T') : dateString;
    const d = new Date(normalized);
    if (isNaN(d.getTime())) {
      return { key: 'invalid', label: '無効な日付' };
    }
    return {
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: `${d.getFullYear()}年${d.getMonth() + 1}月`
    };
  };

  // 集計・ランキング算出
  const { best, worst } = useMemo(() => {
    const map: Record<string, PeriodData> = {};

    records.forEach(r => {
      let keyInfo;
      if (timeUnit === 'day') {
        keyInfo = getDayKey(r.date);
      } else if (timeUnit === 'week') {
        keyInfo = getWeekKey(r.date);
      } else {
        keyInfo = getMonthKey(r.date);
      }

      if (keyInfo.key === 'invalid') return;

      if (!map[keyInfo.key]) {
        map[keyInfo.key] = {
          key: keyInfo.key,
          label: keyInfo.label,
          totalPt: 0,
          count: 0,
          avgRank: 0,
          ranks: [0, 0, 0, 0]
        };
      }

      const item = map[keyInfo.key];
      item.totalPt += (r.delta || 0);
      item.count += 1;
      if (r.rank >= 1 && r.rank <= 4) {
        item.ranks[r.rank - 1] += 1;
      }
    });

    // 平均順位の計算
    Object.values(map).forEach(item => {
      const totalRanks = item.ranks[0] * 1 + item.ranks[1] * 2 + item.ranks[2] * 3 + item.ranks[3] * 4;
      item.avgRank = totalRanks / item.count;
    });

    const items = Object.values(map);

    // 最高獲得ポイント: totalPt > 0 のものを降順ソート
    const bestRankings = items
      .filter(item => item.totalPt > 0)
      .sort((a, b) => b.totalPt - a.totalPt)
      .slice(0, 3);

    // 最大喪失ポイント: totalPt < 0 のものを昇順ソート（マイナスが大きい順）
    const worstRankings = items
      .filter(item => item.totalPt < 0)
      .sort((a, b) => a.totalPt - b.totalPt)
      .slice(0, 3);

    return { best: bestRankings, worst: worstRankings };
  }, [records, timeUnit]);

  const getRankBadgeStyle = (index: number) => {
    switch (index) {
      case 0:
        return 'bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600 text-amber-950 shadow-lg shadow-yellow-500/20 ring-2 ring-yellow-400/40';
      case 1:
        return 'bg-gradient-to-br from-slate-200 via-slate-300 to-slate-500 text-slate-900 shadow-lg shadow-slate-400/20 ring-2 ring-slate-300/40';
      case 2:
        return 'bg-gradient-to-br from-amber-600 via-amber-700 to-amber-900 text-amber-50 shadow-lg shadow-amber-800/20 ring-2 ring-amber-700/40';
      default:
        return 'bg-slate-700 text-slate-200';
    }
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy size={16} className="animate-bounce" />;
    return <Award size={16} />;
  };

  const unitLabel = timeUnit === 'day' ? '日' : timeUnit === 'week' ? '週' : '月';

  return (
    <div className="space-y-8">
      {/* ==================== ① 通算連続記録ボード ==================== */}
      <div>
        <h3 className="text-sm font-bold text-slate-400 mb-4 flex items-center gap-1.5 uppercase tracking-wider">
          <Trophy size={16} className="text-indigo-400" /> 通算連続記録
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          
          {/* 1. 最大連勝 */}
          <div className="glass-panel p-4 flex flex-col justify-between border-orange-500/10 hover:border-orange-500/30 transition-all duration-300 bg-gradient-to-b from-white/90 to-orange-50/[0.01] dark:from-slate-900/50 dark:to-orange-950/[0.005]">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] text-slate-400 font-semibold tracking-wider mb-1">最大連勝</p>
                <p className="text-xl md:text-2xl font-black text-orange-500 tracking-tight truncate">
                  {consecutiveStats.wins.maxCount}<span className="text-xs font-bold ml-0.5">連勝</span>
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-500 shrink-0">
                <Flame size={18} className="animate-pulse" />
              </div>
            </div>
            {consecutiveStats.wins.maxCount > 0 && (
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 font-medium border-t border-slate-200 dark:border-slate-800/40 pt-1.5 leading-tight">
                {formatRange(consecutiveStats.wins.maxStart, consecutiveStats.wins.maxEnd)}
              </p>
            )}
          </div>

          {/* 2. 最大連対 */}
          <div className="glass-panel p-4 flex flex-col justify-between border-emerald-500/10 hover:border-emerald-500/30 transition-all duration-300 bg-gradient-to-b from-white/90 to-emerald-50/[0.01] dark:from-slate-900/50 dark:to-emerald-950/[0.005]">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] text-slate-400 font-semibold tracking-wider mb-1">最大連対</p>
                <p className="text-xl md:text-2xl font-black text-emerald-500 tracking-tight truncate">
                  {consecutiveStats.rentai.maxCount}<span className="text-xs font-bold ml-0.5">連続</span>
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 shrink-0">
                <Sparkles size={18} />
              </div>
            </div>
            {consecutiveStats.rentai.maxCount > 0 && (
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 font-medium border-t border-slate-200 dark:border-slate-800/40 pt-1.5 leading-tight">
                {formatRange(consecutiveStats.rentai.maxStart, consecutiveStats.rentai.maxEnd)}
              </p>
            )}
          </div>

          {/* 3. 避ラス連続数（ラス抜き） */}
          <div className="glass-panel p-4 flex flex-col justify-between border-cyan-500/10 hover:border-cyan-500/30 transition-all duration-300 bg-gradient-to-b from-white/90 to-cyan-50/[0.01] dark:from-slate-900/50 dark:to-cyan-950/[0.005]">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] text-slate-400 font-semibold tracking-wider mb-1">避ラス（ラス抜き）</p>
                <p className="text-xl md:text-2xl font-black text-cyan-500 tracking-tight truncate">
                  {consecutiveStats.avoidLast.maxCount}<span className="text-xs font-bold ml-0.5">戦</span>
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-500 shrink-0">
                <ShieldCheck size={18} />
              </div>
            </div>
            {consecutiveStats.avoidLast.maxCount > 0 && (
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 font-medium border-t border-slate-200 dark:border-slate-800/40 pt-1.5 leading-tight">
                {formatRange(consecutiveStats.avoidLast.maxStart, consecutiveStats.avoidLast.maxEnd)}
              </p>
            )}
          </div>

          {/* 4. 最大ラス連 */}
          <div className="glass-panel p-4 flex flex-col justify-between border-rose-500/10 hover:border-rose-500/30 transition-all duration-300 bg-gradient-to-b from-white/90 to-rose-50/[0.01] dark:from-slate-900/50 dark:to-rose-950/[0.005]">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] text-slate-400 font-semibold tracking-wider mb-1">最大ラス連</p>
                <p className="text-xl md:text-2xl font-black text-rose-500 tracking-tight truncate">
                  {consecutiveStats.consecutiveLasts.maxCount}<span className="text-xs font-bold ml-0.5">連ラス</span>
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-500 shrink-0">
                <Skull size={18} />
              </div>
            </div>
            {consecutiveStats.consecutiveLasts.maxCount > 0 && (
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 font-medium border-t border-slate-200 dark:border-slate-800/40 pt-1.5 leading-tight">
                {formatRange(consecutiveStats.consecutiveLasts.maxStart, consecutiveStats.consecutiveLasts.maxEnd)}
              </p>
            )}
          </div>

          {/* 5. 連続逆連対 */}
          <div className="glass-panel p-4 flex flex-col justify-between border-violet-500/10 hover:border-violet-500/30 transition-all duration-300 bg-gradient-to-b from-white/90 to-violet-50/[0.01] dark:from-slate-900/50 dark:to-violet-950/[0.005]">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] text-slate-400 font-semibold tracking-wider mb-1">連続逆連対</p>
                <p className="text-xl md:text-2xl font-black text-violet-500 tracking-tight truncate">
                  {consecutiveStats.gyakuRentai.maxCount}<span className="text-xs font-bold ml-0.5">連続</span>
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-500 shrink-0">
                <TrendingDown size={18} />
              </div>
            </div>
            {consecutiveStats.gyakuRentai.maxCount > 0 && (
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 font-medium border-t border-slate-200 dark:border-slate-800/40 pt-1.5 leading-tight">
                {formatRange(consecutiveStats.gyakuRentai.maxStart, consecutiveStats.gyakuRentai.maxEnd)}
              </p>
            )}
          </div>

          {/* 6. 連続トップなし（トップ抜き） */}
          <div className="glass-panel p-4 flex flex-col justify-between border-amber-500/10 hover:border-amber-500/30 transition-all duration-300 bg-gradient-to-b from-white/90 to-amber-50/[0.01] dark:from-slate-900/50 dark:to-amber-950/[0.005]">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] text-slate-400 font-semibold tracking-wider mb-1">避トップ（トップ抜き）</p>
                <p className="text-xl md:text-2xl font-black text-amber-500 tracking-tight truncate">
                  {consecutiveStats.noTop.maxCount}<span className="text-xs font-bold ml-0.5">戦</span>
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 shrink-0">
                <Hourglass size={18} />
              </div>
            </div>
            {consecutiveStats.noTop.maxCount > 0 && (
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 font-medium border-t border-slate-200 dark:border-slate-800/40 pt-1.5 leading-tight">
                {formatRange(consecutiveStats.noTop.maxStart, consecutiveStats.noTop.maxEnd)}
              </p>
            )}
          </div>

        </div>
      </div>

      {/* ==================== ② マイルストーン記録 ==================== */}
      <div>
        <h3 className="text-sm font-bold text-slate-400 mb-4 flex items-center gap-1.5 uppercase tracking-wider">
          <Zap size={16} className="text-yellow-400" /> マイルストーン記録
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

          {/* 最高レーティング */}
          <div className="glass-panel p-4 flex flex-col gap-2 border-yellow-500/10 hover:border-yellow-500/30 transition-all duration-300">
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-slate-400 font-semibold tracking-wider">最高レーティング</p>
              <div className="p-1.5 rounded-lg bg-yellow-500/10 text-yellow-500">
                <Star size={14} />
              </div>
            </div>
            <p className="text-2xl font-black text-yellow-500 tracking-tight">
              {milestoneStats.maxRating !== null ? `R${milestoneStats.maxRating}` : '-'}
            </p>
            {milestoneStats.maxRatingDate && (
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium border-t border-slate-200 dark:border-slate-800/40 pt-1.5">
                {formatDateTime(milestoneStats.maxRatingDate)}
              </p>
            )}
          </div>

          {/* 最低レーティング */}
          <div className="glass-panel p-4 flex flex-col gap-2 border-slate-500/10 hover:border-slate-500/30 transition-all duration-300">
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-slate-400 font-semibold tracking-wider">最低レーティング</p>
              <div className="p-1.5 rounded-lg bg-slate-500/10 text-slate-400">
                <ChevronDown size={14} />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-400 tracking-tight">
              {milestoneStats.minRating !== null ? `R${milestoneStats.minRating}` : '-'}
            </p>
            {milestoneStats.minRatingDate && (
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium border-t border-slate-200 dark:border-slate-800/40 pt-1.5">
                {formatDateTime(milestoneStats.minRatingDate)}
              </p>
            )}
          </div>

          {/* 最大段位PT */}
          <div className="glass-panel p-4 flex flex-col gap-2 border-indigo-500/10 hover:border-indigo-500/30 transition-all duration-300">
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-slate-400 font-semibold tracking-wider">最大段位PT</p>
              <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                <ChevronUp size={14} />
              </div>
            </div>
            <p className="text-xl font-black text-indigo-400 tracking-tight leading-tight">
              {milestoneStats.maxDanLabel || '-'}
            </p>
            {milestoneStats.maxDanDate && (
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium border-t border-slate-200 dark:border-slate-800/40 pt-1.5">
                {formatDateTime(milestoneStats.maxDanDate)}
              </p>
            )}
          </div>

          {/* 最小段位PT */}
          <div className="glass-panel p-4 flex flex-col gap-2 border-fuchsia-500/10 hover:border-fuchsia-500/30 transition-all duration-300">
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-slate-400 font-semibold tracking-wider">最小段位PT</p>
              <div className="p-1.5 rounded-lg bg-fuchsia-500/10 text-fuchsia-400">
                <TrendingDown size={14} />
              </div>
            </div>
            <p className="text-xl font-black text-fuchsia-400 tracking-tight leading-tight">
              {milestoneStats.minDanLabel || '-'}
            </p>
            {milestoneStats.minDanDate && (
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium border-t border-slate-200 dark:border-slate-800/40 pt-1.5">
                {formatDateTime(milestoneStats.minDanDate)}
              </p>
            )}
          </div>

        </div>
      </div>

      {/* ==================== ③ 期間別ポイントランキング ==================== */}
      <div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <h3 className="text-sm font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-wider">
            <Calendar size={16} className="text-indigo-400" /> 期間別ポイントランキング
          </h3>
          
          {/* 期間選択セグメントコントロール */}
          <div className="inline-flex p-0.5 rounded-xl bg-slate-200 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-800/60 shadow-inner">
            {(['day', 'week', 'month'] as const).map((unit) => (
              <button
                key={unit}
                onClick={() => setTimeUnit(unit)}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all duration-200 ${
                  timeUnit === unit
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {unit === 'day' ? '日別' : unit === 'week' ? '週別' : '月別'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* === 左カラム: 栄光の記録 (最高獲得ポイント) === */}
          <div className="glass-panel p-6 border-emerald-500/10 bg-gradient-to-b from-white/90 to-emerald-50/[0.02] dark:from-slate-900/50 dark:to-emerald-950/[0.01]">
            <div className="flex items-center gap-2.5 border-b border-emerald-500/20 pb-4 mb-6">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                <TrendingUp size={20} />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  栄光の記録 <Sparkles size={14} className="text-yellow-500" />
                </h4>
                <p className="text-[10px] text-slate-400 font-medium">1{unitLabel}あたりの最高獲得ポイントのトップ3</p>
              </div>
            </div>

            <div className="space-y-4">
              {best.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  プラスポイントの記録がまだありません。
                </div>
              ) : (
                best.map((item, index) => (
                  <div
                    key={item.key}
                    className="relative group p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-950/20 hover:border-emerald-500/30 hover:shadow-[0_0_15px_rgba(16,185,129,0.1)] transition-all duration-300"
                  >
                    <div className="flex items-center justify-between gap-4">
                      {/* 左側: 順位バッジ + 日付 */}
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${getRankBadgeStyle(index)}`}>
                          {getRankIcon(index)}
                        </div>
                        <div>
                          <div className="text-sm font-extrabold text-slate-200 flex items-center gap-1.5">
                            <Calendar size={13} className="text-slate-400 shrink-0" />
                            <span>{item.label}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-1.5 py-0.5 rounded">
                              <Gamepad2 size={10} />
                              {item.count}対局
                            </span>
                            <span className="text-[10px] font-semibold text-slate-400">
                              平均順位: <span className="font-bold text-slate-300">{item.avgRank.toFixed(2)}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 右側: 獲得ポイント & 内訳 */}
                      <div className="text-right shrink-0">
                        <div className="text-lg md:text-xl font-black text-emerald-500 tracking-tight">
                          +{item.totalPt}
                          <span className="text-xs font-bold ml-0.5">pt</span>
                        </div>
                        <div className="text-[10px] font-mono font-bold text-slate-500 mt-0.5 tracking-wider">
                          [{item.ranks.join('-')}]
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* === 右カラム: 試練の記録 (最大喪失ポイント) === */}
          <div className="glass-panel p-6 border-rose-500/10 bg-gradient-to-b from-white/90 to-rose-50/[0.02] dark:from-slate-900/50 dark:to-rose-950/[0.01]">
            <div className="flex items-center gap-2.5 border-b border-rose-500/20 pb-4 mb-6">
              <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500">
                <TrendingDown size={20} />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                  試練の記録 <Frown size={14} className="text-rose-400" />
                </h4>
                <p className="text-[10px] text-slate-400 font-medium">1{unitLabel}あたりの最大喪失ポイントのトップ3</p>
              </div>
            </div>

            <div className="space-y-4">
              {worst.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  マイナスポイントの記録がありません（素晴らしい成績です！）。
                </div>
              ) : (
                worst.map((item, index) => (
                  <div
                    key={item.key}
                    className="relative group p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-950/20 hover:border-rose-500/30 hover:shadow-[0_0_15px_rgba(244,63,94,0.1)] transition-all duration-300"
                  >
                    <div className="flex items-center justify-between gap-4">
                      {/* 左側: 順位バッジ + 日付 */}
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs bg-slate-800 text-rose-400 shadow-md ring-2 ring-rose-500/20`}>
                          <span className="font-black font-mono">#{index + 1}</span>
                        </div>
                        <div>
                          <div className="text-sm font-extrabold text-slate-200 flex items-center gap-1.5">
                            <Calendar size={13} className="text-slate-400 shrink-0" />
                            <span>{item.label}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-1.5 py-0.5 rounded">
                              <Gamepad2 size={10} />
                              {item.count}対局
                            </span>
                            <span className="text-[10px] font-semibold text-slate-400">
                              平均順位: <span className="font-bold text-slate-300">{item.avgRank.toFixed(2)}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 右側: 喪失ポイント & 内訳 */}
                      <div className="text-right shrink-0">
                        <div className="text-lg md:text-xl font-black text-rose-500 tracking-tight">
                          {item.totalPt}
                          <span className="text-xs font-bold ml-0.5">pt</span>
                        </div>
                        <div className="text-[10px] font-mono font-bold text-slate-500 mt-0.5 tracking-wider">
                          [{item.ranks.join('-')}]
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
