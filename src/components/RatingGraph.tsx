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
}

// ───── カスタム Dot（昇段・降段マーカー） ────────────────────────────────────
const CustomAreaDot = (props: any) => {
  const { cx, cy, payload } = props;
  if (!payload?.danChangeType || cx == null || cy == null) return null;
  const isPromotion = payload.danChangeType === 'promotion';
  const color = isPromotion ? '#10b981' : '#f43f5e';
  return (
    <g key={`dot-${payload.index}`}>
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
  if (records.length === 0) {
    return (
      <div className="text-center text-slate-500 py-10 h-64 flex items-center justify-center">
        データがありません
      </div>
    );
  }

  const data: ChartDataItem[] = records.map((r) => {
    let danChangeType: DanChangeType = null;
    if (r.startDan && r.danAfter && r.startDan !== r.danAfter) {
      const prevIdx = danOrder.indexOf(r.startDan);
      const nextIdx = danOrder.indexOf(r.danAfter);
      if (prevIdx >= 0 && nextIdx >= 0) {
        danChangeType = nextIdx > prevIdx ? 'promotion' : 'demotion';
      }
    }
    const dan = r.danAfter ?? '4段';
    const maxPt = danConfig[dan]?.promotion ?? 1600;

    return {
      name: `Game ${r.gameIndex}`,
      index: r.gameIndex,
      point: r.pointAfter,
      rating: r.ratingAfter,
      dan,
      danChangeType,
      maxPoint: maxPt,
    };
  });

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
    <div className="h-[480px] w-full mt-6">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 40, right: 20, left: 10, bottom: 20 }}>
          <defs>
            <linearGradient id="colorPoint" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.5} />
              <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.0} />
            </linearGradient>
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
          />

          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#475569', strokeWidth: 1, strokeDasharray: '4 4' }} />

          <Legend
            verticalAlign="top"
            height={36}
            iconType="circle"
            formatter={(value) => (
              <span style={{ color: '#cbd5e1', fontWeight: 600, fontSize: 13, margin: '0 8px' }}>
                {value === 'point' ? 'Point (Pt)' : 'Rating (R)'}
              </span>
            )}
          />

          {/* 降段ライン (0pt) */}
          <ReferenceLine y={0} yAxisId="left" stroke="#ef4444" strokeDasharray="4 4" strokeOpacity={0.5} />
          {/* その時の段位の最大ポイント（昇段ライン） */}
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

          {/* 昇段・降段時の縦線 */}
          {data.filter(d => d.danChangeType && d.index != null).map((d) => (
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

          {/* ポイント推移（カスタムdotで昇段・降段を表示） */}
          <Area
            yAxisId="left"
            type="monotone"
            dataKey="point"
            name="point"
            stroke="#22d3ee"
            fillOpacity={1}
            fill="url(#colorPoint)"
            strokeWidth={3}
            dot={<CustomAreaDot />}
            activeDot={{ r: 6, strokeWidth: 0, fill: '#a5f3fc' }}
            isAnimationActive={true}
            animationDuration={1200}
            animationEasing="ease-out"
          />

          {/* レーティング推移 */}
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="rating"
            name="rating"
            stroke="#a855f7"
            strokeWidth={3}
            dot={false}
            activeDot={{ r: 6, strokeWidth: 0, fill: '#d8b4fe' }}
            isAnimationActive={true}
            animationDuration={1200}
            animationEasing="ease-out"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
