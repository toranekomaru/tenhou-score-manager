import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Settings, BarChart3, List, User, Sun, Moon, CalendarDays, Hash } from 'lucide-react';
import { db, initializeSettings } from './db/db';
import { calculateHistory } from './utils/calculator';
import GameFormCompact from './components/GameFormCompact';
import GameList from './components/GameList';
import PerformanceComment from './components/PerformanceComment';

import RatingGraph from './components/RatingGraph';
import StatsByCondition from './components/StatsByCondition';
import StatsByMonth from './components/StatsByMonth';
import StatsByCount from './components/StatsByCount';
import SettingsPanel from './components/Settings';

type Tab = 'list' | 'stats' | 'monthly' | 'count' | 'settings';

const NAV_ITEMS: { id: Tab; icon: React.ReactNode; label: string }[] = [
  { id: 'list',     icon: <List size={16} />,          label: '対局履歴' },
  { id: 'stats',    icon: <BarChart3 size={16} />,     label: '基本集計' },
  { id: 'monthly',  icon: <CalendarDays size={16} />,  label: '期間別集計' },
  { id: 'count',    icon: <Hash size={16} />,          label: '対戦数集計' },
  { id: 'settings', icon: <Settings size={16} />,      label: '初期設定' },
];

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('list');
  const [dbReady, setDbReady] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : false;
  });

  useEffect(() => {
    const root = document.documentElement;
    isDark ? root.classList.add('dark') : root.classList.remove('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  useEffect(() => {
    initializeSettings().then(() => setDbReady(true));
  }, []);

  const rawRecords = useLiveQuery(() => db.gameRecords.orderBy('date').toArray(), [], []);
  const settings   = useLiveQuery(() => db.settings.get(1), [], null);

  if (!dbReady || !settings) {
    return <div className="min-h-screen flex items-center justify-center text-indigo-400 animate-pulse">Loading Database...</div>;
  }

  const records    = calculateHistory(rawRecords, settings.currentDan, settings.currentPoint, settings.currentRating);
  const lastRecord = records.length > 0 ? records[records.length - 1] : null;

  return (
    <div className="min-h-screen">

      {/* ===== ① タイトル + ステータス行 ===== */}
      <div className="sticky top-0 z-30 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-2 md:h-16 flex flex-wrap md:flex-nowrap items-center justify-between gap-y-2 gap-x-4">
          {/* タイトル */}
          <div className="flex items-baseline gap-2 shrink-0">
            <h1 className="text-lg md:text-xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-cyan-500 dark:from-indigo-400 dark:to-cyan-400 tracking-tight">
              Tenhou Manager
            </h1>
            <span className="hidden sm:block text-xs text-slate-400 font-medium">天鳳成績管理</span>
          </div>

          {/* テーマ切り替えボタン (スマホでは1行目の右端) */}
          <button
            onClick={() => setIsDark(!isDark)}
            className="md:hidden shrink-0 flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
            aria-label="テーマ切り替え"
          >
            {isDark ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          {/* ステータスバー (スマホでは2行目にフルサイズで表示) */}
          <div className="flex items-center justify-around md:justify-end gap-2 md:gap-6 w-full md:w-auto pt-1 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800/50">
            <div className="text-center w-1/3 md:w-auto">
              <div className="text-[10px] text-indigo-500 dark:text-indigo-400 font-bold uppercase tracking-widest mb-0.5">Dan</div>
              <div className="font-extrabold text-indigo-700 dark:text-indigo-200 text-lg md:text-xl leading-none">
                {lastRecord ? lastRecord.danAfter : settings.currentDan}
              </div>
            </div>
            <div className="w-px h-6 md:h-8 bg-slate-300 dark:bg-slate-700" />
            <div className="text-center w-1/3 md:w-auto">
              <div className="text-[10px] text-cyan-500 dark:text-cyan-400 font-bold uppercase tracking-widest mb-0.5">Points</div>
              <div className="font-extrabold text-cyan-700 dark:text-cyan-200 text-lg md:text-xl leading-none">
                {lastRecord ? lastRecord.pointAfter : settings.currentPoint}
                <span className="text-[10px] md:text-xs font-normal text-cyan-500 ml-0.5 md:ml-1">pt</span>
              </div>
            </div>
            <div className="w-px h-6 md:h-8 bg-slate-300 dark:bg-slate-700" />
            <div className="text-center w-1/3 md:w-auto">
              <div className="text-[10px] text-purple-500 dark:text-purple-400 font-bold uppercase tracking-widest mb-0.5">Rating</div>
              <div className="font-extrabold text-purple-700 dark:text-purple-200 text-lg md:text-xl leading-none">
                <span className="text-[10px] md:text-xs font-normal text-purple-500 mr-0.5">R</span>
                {lastRecord ? lastRecord.ratingAfter : settings.currentRating}
              </div>
            </div>
          </div>

          {/* テーマ切り替えボタン (PCではステータスバーの右側) */}
          <button
            onClick={() => setIsDark(!isDark)}
            className="hidden md:flex shrink-0 items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all text-sm font-semibold"
            aria-label="テーマ切り替え"
          >
            {isDark ? <Sun size={15} /> : <Moon size={15} />}
            <span>{isDark ? 'ライト' : 'ダーク'}</span>
          </button>
        </div>
      </div>

      {/* ===== ② 入力フォームバー（常時固定） ===== */}
      <div className="sticky top-[96px] md:top-16 z-20 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-6 pt-3 pb-2 space-y-2">
          <GameFormCompact />
          {records.length >= 3 && (
            <PerformanceComment records={records} />
          )}
        </div>
      </div>

      {/* ===== ③ ナビゲーション (PC用) ===== */}
      <div className="hidden md:block sticky top-[128px] z-10 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <nav className="flex overflow-x-auto scrollbar-hide">
            {NAV_ITEMS.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-all duration-200 ${
                  activeTab === item.id
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* ===== ④ メインコンテンツ ===== */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 pt-6 pb-24 md:pb-6">
        {activeTab === 'list' && (
          <div className="glass-panel p-6">
            <h2 className="text-base font-bold mb-5 flex items-center gap-2 text-indigo-600 dark:text-indigo-300 border-b border-indigo-200 dark:border-indigo-500/20 pb-3">
              <List size={18} /> 成績一覧
            </h2>
            <GameList records={records} />
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="space-y-6">
            <div className="glass-panel p-6">
              <h2 className="text-base font-bold mb-5 flex items-center gap-2 text-indigo-600 dark:text-indigo-300 border-b border-indigo-200 dark:border-indigo-500/20 pb-3">
                <BarChart3 size={18} /> 基本集計
              </h2>
              <StatsByCondition records={records} />
            </div>
            <div className="glass-panel p-6">
              <h2 className="text-base font-bold mb-5 flex items-center gap-2 text-indigo-600 dark:text-indigo-300 border-b border-indigo-200 dark:border-indigo-500/20 pb-3">
                <BarChart3 size={18} /> レーティング・ポイント推移
              </h2>
              <RatingGraph records={records} />
            </div>
          </div>
        )}

        {activeTab === 'monthly' && (
          <div className="glass-panel p-6">
            <h2 className="text-base font-bold mb-5 flex items-center gap-2 text-indigo-600 dark:text-indigo-300 border-b border-indigo-200 dark:border-indigo-500/20 pb-3">
              <CalendarDays size={18} /> 期間別集計
            </h2>
            <StatsByMonth records={records} />
          </div>
        )}

        {activeTab === 'count' && (
          <div className="glass-panel p-6">
            <h2 className="text-base font-bold mb-5 flex items-center gap-2 text-indigo-600 dark:text-indigo-300 border-b border-indigo-200 dark:border-indigo-500/20 pb-3">
              <Hash size={18} /> 対戦数別集計
            </h2>
            <StatsByCount records={records} />
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-lg mx-auto">
            <div className="glass-panel p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
              <h2 className="text-base font-bold mb-5 flex items-center gap-2 text-purple-600 dark:text-purple-300 border-b border-purple-200 dark:border-purple-500/20 pb-3">
                <User size={18} /> アカウント初期状態設定
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
                ここで設定した値が、すべての履歴計算の起点となります。段位グラフの起点を変更したい場合などに再設定してください。
              </p>
              <SettingsPanel settings={settings} />
            </div>
          </div>
        )}
      </main>

      {/* ===== ⑤ モバイル用ボトムナビゲーション ===== */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 pb-safe">
        <nav className="flex items-center justify-around px-2 pb-2 pt-2">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center w-full py-1 rounded-xl transition-all ${
                activeTab === item.id
                  ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              <div className={`${activeTab === item.id ? 'scale-110 mb-1' : 'mb-1'} transition-transform duration-200`}>
                {item.icon}
              </div>
              <span className="text-[10px] font-bold">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}

export default App;
