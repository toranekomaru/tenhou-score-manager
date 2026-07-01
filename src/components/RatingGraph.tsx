import { useState } from 'react';
import { GameRecord } from '../types';
import { danConfig, danOrder } from '../utils/calculator';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';

// ───── 段位カラーパレット ─────────────────────────────────────────────────────
// danOrder の順番に対応した色 (4段〜10段)
const DAN_COLORS: Record<string, string> = {
  '4段':  '#34d399',  // emerald green
  '5段':  '#22d3ee',  // cyan
  '6段':  '#60a5fa',  // blue
  '7段':  '#c084fc',  // purple
  '8段':  '#f472b6',  // pink / magenta
  '9段':  '#fb923c',  // orange
  '10段': '#facc15',  // yellow
};

// ───── ヘルパー型 ────────────────────────────────────────────────────────────
type DanChangeType = 'promotion' | 'demotion' | null;

interface ChartDataItem {
  name: string;
  index: number | undefined;
  point: number | undefined;
  rating: number | undefined;
  dan: string | undefined;
  danChangeType: DanChangeType;
  maxPoint: number | undefined;
  date: string;
  // 段位別ポイントフィールド (段位ごとに色を変えるための分割系列)
  [key: string]: number | string | undefined | null;
}

// ───── 日付フォーマットヘルパー ──────────────────────────────────────────────
const formatDate = (dateStr: string) => {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const h = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${m}/${day} ${h}:${min}`;
  } catch (e) {
    return dateStr;
  }
};

// ───── カスタム マーカー（高値・安値） ────────────────────────────────────
const CustomMarkerLabel = (props: any) => {
  const { cx, cy, x, y, value, date, type, metric } = props;
  const posX = cx ?? x;
  const posY = cy ?? y;

  if (posX == null || posY == null) return null;

  const isMax = type === 'max';
  const isPoint = metric === 'point';

  // デザイン設定（色・強調）
  let bgColor = 'rgba(15, 23, 42, 0.95)';
  let borderColor = '#22d3ee';
  let labelText = '';

  if (isMax) {
    bgColor = 'rgba(239, 68, 68, 0.95)'; // Red 500
    borderColor = '#fca5a5'; // Red 300
    labelText = isPoint ? `最高Pt: ${value}` : `最高R: ${value}`;
  } else {
    bgColor = 'rgba(37, 99, 235, 0.95)'; // Blue 600
    borderColor = '#93c5fd'; // Blue 300
    labelText = isPoint ? `最低Pt: ${value}` : `最低R: ${value}`;
  }

  const offsetY = isMax ? -42 : 14;
  const arrowHeight = 6;
  
  // 矢印のポリゴン座標
  const arrowPoints = isMax
    ? `${posX},${posY - 4} ${posX - 6},${posY - 4 - arrowHeight} ${posX + 6},${posY - 4 - arrowHeight}`
    : `${posX},${posY + 4} ${posX - 6},${posY + 4 + arrowHeight} ${posX + 6},${posY + 4 + arrowHeight}`;

  const rectY = isMax ? posY + offsetY - 12 : posY + offsetY + arrowHeight;
  const formattedDate = formatDate(date);

  return (
    <g style={{ pointerEvents: 'none' }}>
      {/* 吹き出しの背景 */}
      <rect
        x={posX - 70}
        y={rectY}
        width={140}
        height={38}
        rx={8}
        fill={bgColor}
        stroke={borderColor}
        strokeWidth={2}
        style={{ filter: 'drop-shadow(0px 3px 6px rgba(0,0,0,0.4))' }}
      />
      {/* 吹き出しの矢印 */}
      <polygon
        points={arrowPoints}
        fill={bgColor}
        stroke={borderColor}
        strokeWidth={2}
      />
      {/* 矢印と背景の境界線を消すための重ね塗り */}
      <polygon
        points={arrowPoints}
        fill={bgColor}
      />
      {/* テキスト */}
      <text
        x={posX}
        y={rectY + 13}
        fill="#ffffff"
        fontSize={11}
        fontWeight="bold"
        textAnchor="middle"
        dominantBaseline="middle"
      >
        {labelText}
      </text>
      <text
        x={posX}
        y={rectY + 27}
        fill="#e2e8f0"
        fontSize={9}
        fontWeight="medium"
        textAnchor="middle"
        dominantBaseline="middle"
      >
        {formattedDate}
      </text>
    </g>
  );
};

// ───── カスタム Dot（ポイント推移用：昇段・降段） ────────────────────────────────────
const CustomAreaDot = (props: any) => {
  const { cx, cy, payload } = props;
  if (cx == null || cy == null || !payload) return null;

  // 昇段・降段マーカー
  if (payload.danChangeType) {
    const isPromotion = payload.danChangeType === 'promotion';
    const color = isPromotion ? '#10b981' : '#f43f5e';
    return (
      <g key={`dan-${payload.index}`}>
        <circle cx={cx} cy={cy} r={8} fill={color} stroke="#fff" strokeWidth={2} />
        <text
          x={cx}
          y={cy - 16}
          fill={color}
          fontSize={10}
          fontWeight="bold"
          textAnchor="middle"
          dominantBaseline="auto"
        >
          {payload.dan} {isPromotion ? '昇段' : '降段'}
        </text>
      </g>
    );
  }

  return null;
};

// ───── カスタム Dot（レーティング推移用：高値・安値） ─────────────────────
const CustomRatingDot = (props: any) => {
  const { cx, cy, payload, showMarkers, maxRatingVal, minRatingVal } = props;
  if (cx == null || cy == null || !payload) return null;

  if (showMarkers) {
    const isMax = payload.rating === maxRatingVal;
    const isMin = payload.rating === minRatingVal;

    if (isMax || isMin) {
      const type = isMax ? 'max' : 'min';
      const dotColor = isMax ? '#ef4444' : '#3b82f6';
      return (
        <g key={`marker-rating-${type}-${payload.index}`}>
          <circle cx={cx} cy={cy} r={6} fill={dotColor} stroke="#fff" strokeWidth={2} />
          <CustomMarkerLabel
            cx={cx}
            cy={cy}
            value={payload.rating}
            date={payload.date}
            type={type}
            metric="rating"
          />
        </g>
      );
    }
  }

  return null;
};

// ───── 縦線ラベル（昇段・降段） ───────────────────────────────────────────────
const CustomLineLabel = (props: any) => {
  const { x, viewBox, value, danChangeType } = props;
  if (x == null || !viewBox) return null;
  const isPromotion = danChangeType === 'promotion';
  const color = isPromotion ? '#10b981' : '#f43f5e';
  const labelY = (viewBox.y ?? 0) + 12;
  return (
    <g>
      <rect
        x={x - 36}
        y={labelY}
        width={72}
        height={20}
        rx={4}
        fill="rgba(15,23,42,0.92)"
        stroke={color}
        strokeWidth={1.5}
      />
      <text
        x={x}
        y={labelY + 13}
        fill={color}
        fontSize={10}
        fontWeight="bold"
        textAnchor="middle"
      >
        {value}
      </text>
    </g>
  );
};

// ───── カスタム Tooltip ───────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;
  const gameData: ChartDataItem | undefined = payload[0]?.payload;
  return (
    <div
      style={{
        background: 'rgba(15,23,42,0.95)',
        border: '1px solid rgba(71,85,105,0.5)',
        borderRadius: '10px',
        padding: '12px 16px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <p style={{ color: '#cbd5e1', fontSize: 11, fontWeight: 700, marginBottom: 8, paddingBottom: 6, borderBottom: '1px solid #1e293b' }}>
        Game {label}
      </p>
      {payload
        .filter((entry: any) => entry.name !== 'maxPoint')
        .map((entry: any, i: number) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: entry.color, display: 'inline-block' }} />
              <span style={{ color: '#94a3b8', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                {entry.name === 'point' ? 'Pt' : 'R'}
              </span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ color: '#f1f5f9', fontSize: 13, fontWeight: 700, fontFamily: 'monospace' }}>{entry.value}</span>
              {entry.name === 'point' && gameData?.dan && (
                <div style={{ color: '#818cf8', fontSize: 10, marginTop: 2 }}>
                  {gameData.dan} {gameData.maxPoint != null && `(Max: ${gameData.maxPoint}pt)`}
                  {gameData.danChangeType === 'promotion' && ' ✦ 昇段'}
                  {gameData.danChangeType === 'demotion' && ' ▼ 降段'}
                </div>
              )}
            </div>
          </div>
        ))}
    </div>
  );
};

// ───── メインコンポーネント ───────────────────────────────────────────────────
interface Props {
  records: GameRecord[];
}

export default function RatingGraph({ records }: Props) {
  const [showPoint, setShowPoint] = useState(true);
  const [showRating, setShowRating] = useState(true);
  const [showMarkers, setShowMarkers] = useState(true);

  if (records.length === 0) {
    return (
      <div className="text-center text-slate-500 py-10 h-64 flex items-center justify-center">
        データがありません
      </div>
    );
  }

  const rawData: (ChartDataItem & { prevDan?: string })[] = records.map((r) => {
    let danChangeType: DanChangeType = null;
    if (r.startDan && r.danAfter && r.startDan !== r.danAfter) {
      const prevIdx = danOrder.indexOf(r.startDan);
      const nextIdx = danOrder.indexOf(r.danAfter);
      if (prevIdx >= 0 && nextIdx >= 0) {
        danChangeType = nextIdx > prevIdx ? 'promotion' : 'demotion';
      }
    }
    const dan = r.danAfter ?? '4段';
    const prevDan = r.startDan ?? dan;
    const maxPt = danConfig[dan]?.promotion ?? 1600;

    return {
      name: `Game ${r.gameIndex}`,
      index: r.gameIndex,
      point: r.pointAfter,
      rating: r.ratingAfter,
      dan,
      prevDan,
      danChangeType,
      maxPoint: maxPt,
      date: r.date,
    };
  });

  // 段位別ポイントフィールドを付与
  // 各データポイントは自分の段位のフィールドに値を入れる。
  // 段位切替ポイント（danChangeType あり）では前の段位フィールドにも同じ値を入れて線を繋ぐ。
  const data: ChartDataItem[] = rawData.map((d) => {
    const danFields: Record<string, number | undefined> = {};
    danOrder.forEach(dan => {
      danFields[`point_${dan}`] = undefined;
    });

    // 自分の段位に値をセット
    if (d.dan) {
      danFields[`point_${d.dan}`] = d.point;
    }

    // 段位が変わった対局：前の段位フィールドにも同じ値を入れて前セグメントの線を終端まで引く
    if (d.danChangeType && d.prevDan && d.prevDan !== d.dan) {
      danFields[`point_${d.prevDan}`] = d.point;
    }

    // 次の対局が別段位の場合、自分の段位フィールドに値を引き継いで次セグメントの開始点とする
    // → 逆に言うと、次のデータの前段位フィールドに値を入れる処理で対応済みなので不要

    return { ...d, ...danFields };
  });

  // グラフに表示する段位（データに実際に登場する段位のみ）
  const activeDans = danOrder.filter(dan =>
    data.some(d => d[`point_${dan}`] !== undefined)
  );

  // rating の最高値・最安値を計算
  let maxRatingVal: number | undefined;
  let minRatingVal: number | undefined;

  if (data.length > 1) {
    const ratings = data.map(d => d.rating).filter((r): r is number => r !== undefined);

    if (ratings.length > 0) {
      const maxR = Math.max(...ratings);
      const minR = Math.min(...ratings);
      if (maxR !== minR) {
        maxRatingVal = maxR;
        minRatingVal = minR;
      }
    }
  }

  // 登場するすべての段位の初期ポイントと最大ポイントを抽出してY軸の目盛りを動的生成
  const uniqueDans = Array.from(new Set(data.map((d) => d.dan).filter(Boolean))) as string[];
  const yTicks = Array.from(
    new Set([
      0,
      ...uniqueDans.flatMap((dan) => {
        const config = danConfig[dan];
        return config ? [config.initial, config.promotion] : [];
      }),
    ])
  ).sort((a, b) => a - b);

  const maxY = yTicks.length > 0 ? Math.max(...yTicks) : 1600;

  return (
    <div className="w-full mt-4 space-y-4">
      {/* トグルコントロール */}
      <div className="flex items-center justify-end gap-5 flex-wrap">
        <label className={`inline-flex items-center gap-2 cursor-pointer text-xs font-semibold transition-colors ${showPoint ? 'text-cyan-400 hover:text-cyan-300' : 'text-slate-500 hover:text-slate-400'}`}>
          <input
            type="checkbox"
            checked={showPoint}
            disabled={showPoint && !showRating}
            onChange={(e) => setShowPoint(e.target.checked)}
            className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <span>Pointを表示</span>
        </label>

        <label className={`inline-flex items-center gap-2 cursor-pointer text-xs font-semibold transition-colors ${showRating ? 'text-purple-400 hover:text-purple-300' : 'text-slate-500 hover:text-slate-400'}`}>
          <input
            type="checkbox"
            checked={showRating}
            disabled={showRating && !showPoint}
            onChange={(e) => setShowRating(e.target.checked)}
            className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-purple-500 focus:ring-purple-500 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <span>Ratingを表示</span>
        </label>

        {showRating && (
          <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-400 hover:text-slate-300 transition-colors">
            <input
              type="checkbox"
              checked={showMarkers}
              onChange={(e) => setShowMarkers(e.target.checked)}
              className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-slate-900"
            />
            <span>R高値・安値マーカーを表示</span>
          </label>
        )}
      </div>

      <div className="h-[480px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 40, right: 20, left: 10, bottom: 20 }}>
            <defs>
              {activeDans.map(dan => {
                const color = DAN_COLORS[dan] ?? '#22d3ee';
                return (
                  <linearGradient key={`grad-${dan}`} id={`colorPoint_${dan}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={color} stopOpacity={0.0} />
                  </linearGradient>
                );
              })}
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />

            <XAxis
              dataKey="index"
              stroke="#475569"
              tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
              tickLine={false}
              axisLine={false}
              tickMargin={12}
              minTickGap={20}
            />

            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#a855f7"
              tick={{ fill: '#c084fc', fontSize: 11, fontWeight: 600 }}
              domain={['dataMin - 30', 'dataMax + 30']}
              tickLine={false}
              axisLine={false}
              width={50}
              tickMargin={8}
              hide={!showRating}
            />

            <YAxis
              yAxisId="left"
              stroke="#22d3ee"
              tick={{ fill: '#67e8f9', fontSize: 11, fontWeight: 600 }}
              tickLine={false}
              axisLine={false}
              width={55}
              tickMargin={8}
              domain={[-50, maxY + 50]}
              ticks={yTicks}
              hide={!showPoint}
            />

            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#475569', strokeWidth: 1, strokeDasharray: '4 4' }} />

            <Legend
              verticalAlign="top"
              height={36}
              content={(props: any) => {
                const entries = (props.payload ?? []).filter(
                  (entry: any) => entry.dataKey !== 'maxPoint'
                );
                return (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 4, paddingBottom: 8, flexWrap: 'wrap' }}>
                    {entries.map((entry: any, i: number) => {
                      const value: string = entry.dataKey ?? entry.value ?? '';
                      const danMatch = value.match(/^point_(.+)$/);
                      const label = value === 'rating'
                        ? 'Rating (R)'
                        : danMatch ? danMatch[1] : value;
                      const color = entry.color ?? '#cbd5e1';
                      return (
                        <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, margin: '0 6px' }}>
                          <svg width={10} height={10} viewBox="0 0 10 10">
                            <circle cx={5} cy={5} r={5} fill={color} />
                          </svg>
                          <span style={{ color, fontWeight: 600, fontSize: 12 }}>{label}</span>
                        </span>
                      );
                    })}
                  </div>
                );
              }}
            />

            {/* 降段ライン (0pt) */}
            {showPoint && (
              <ReferenceLine y={0} yAxisId="left" stroke="#ef4444" strokeDasharray="4 4" strokeOpacity={0.5} />
            )}
            {/* その時の段位の最大ポイント（昇段ライン） */}
            {showPoint && (
              <Line
                yAxisId="left"
                type="stepAfter"
                dataKey="maxPoint"
                name="maxPoint"
                stroke="#10b981"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                strokeOpacity={0.7}
                dot={false}
                activeDot={false}
                legendType="none"
              />
            )}

            {/* 昇段・降段時の縦線 */}
            {showPoint && data.filter(d => d.danChangeType && d.index != null).map((d) => (
              <ReferenceLine
                key={`vline-${d.index}`}
                x={d.index}
                yAxisId="left"
                stroke={d.danChangeType === 'promotion' ? '#10b981' : '#f43f5e'}
                strokeDasharray="5 4"
                strokeWidth={1.5}
                strokeOpacity={0.8}
                label={
                  <CustomLineLabel
                    value={`${d.dan} ${d.danChangeType === 'promotion' ? '昇段' : '降段'}`}
                    danChangeType={d.danChangeType}
                  />
                }
              />
            ))}

            {/* ポイント推移：段位ごとに色分けして描画 */}
            {showPoint && activeDans.map((dan, i) => {
              const color = DAN_COLORS[dan] ?? '#22d3ee';
              const isFirst = i === 0;
              return (
                <Area
                  key={`area-${dan}`}
                  yAxisId="left"
                  type="linear"
                  dataKey={`point_${dan}`}
                  name={`point_${dan}`}
                  stroke={color}
                  fillOpacity={1}
                  fill={`url(#colorPoint_${dan})`}
                  strokeWidth={3}
                  connectNulls={false}
                  dot={<CustomAreaDot />}
                  activeDot={{ r: 6, strokeWidth: 0, fill: color }}
                  isAnimationActive={true}
                  animationDuration={1200}
                  animationEasing="ease-out"
                  legendType={isFirst ? 'circle' : 'circle'}
                />
              );
            })}

            {/* レーティング推移 */}
            {showRating && (
              <Line
                yAxisId="right"
                type="linear"
                dataKey="rating"
                name="rating"
                stroke="#a855f7"
                strokeWidth={3}
                dot={
                  <CustomRatingDot
                    showMarkers={showMarkers}
                    maxRatingVal={maxRatingVal}
                    minRatingVal={minRatingVal}
                  />
                }
                activeDot={{ r: 6, strokeWidth: 0, fill: '#d8b4fe' }}
                isAnimationActive={true}
                animationDuration={1200}
                animationEasing="ease-out"
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
