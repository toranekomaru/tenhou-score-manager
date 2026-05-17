import { GameRecord } from '../types';
import { danConfig } from '../utils/calculator';
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
  ReferenceLine
} from 'recharts';

interface Props {
  records: GameRecord[];
}

export default function RatingGraph({ records }: Props) {
  if (records.length === 0) {
    return <div className="text-center text-slate-500 py-10 h-64 flex items-center justify-center">データがありません</div>;
  }

  const data = records.map((r) => ({
    name: `Game ${r.gameIndex}`,
    index: r.gameIndex,
    point: r.pointAfter,
    rating: r.ratingAfter,
    dan: r.danAfter
  }));

  const currentDan = records[records.length - 1].danAfter || '4段';
  const maxPoint = danConfig[currentDan]?.promotion || 1600;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const gameData = data.find(d => d.index === label);
      return (
        <div className="glass-panel p-4 outline-none border border-slate-600/50 shadow-2xl backdrop-blur-xl">
          <p className="text-slate-300 text-xs font-bold tracking-wider mb-3 pb-2 border-b border-slate-700">Game {label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4 mb-2 last:mb-0">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: entry.color, boxShadow: `0 0 8px ${entry.color}` }}></span>
                <span className="text-sm font-medium text-slate-400 uppercase tracking-widest text-[10px]">{entry.name === 'point' ? 'Pt' : 'R'}</span>
              </div>
              <div className="text-sm font-bold text-slate-100 font-mono text-right flex flex-col items-end">
                <span>{entry.value}</span>
                {entry.name === 'point' && gameData?.dan && (
                  <span className="text-[10px] text-indigo-400 mt-0.5">{gameData.dan}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-[450px] w-full mt-6">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 20, right: 20, left: 10, bottom: 20 }}>
          <defs>
            <linearGradient id="colorPoint" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.5}/>
              <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.0}/>
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
            domain={[-50, maxPoint + 50]}
          />
          
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#475569', strokeWidth: 1, strokeDasharray: '4 4' }} />
          
          <Legend 
            verticalAlign="top" 
            height={36}
            iconType="circle" 
            formatter={(value) => <span className="text-slate-300 font-semibold text-sm mx-2">{value === 'point' ? 'Point (Pt)' : 'Rating (R)'}</span>}
          />

          {/* 降段ライン (0pt) */}
          <ReferenceLine y={0} yAxisId="left" stroke="#ef4444" strokeDasharray="4 4" strokeOpacity={0.5} />
          {/* 昇段ライン (maxPoint) */}
          <ReferenceLine y={maxPoint} yAxisId="left" stroke="#22c55e" strokeDasharray="4 4" strokeOpacity={0.5} />

          {/* ポイントは塗りつぶし付きのAreaにして存在感を出す */}
          <Area 
            yAxisId="left" 
            type="monotone" 
            dataKey="point" 
            name="point"
            stroke="#22d3ee" 
            fillOpacity={1} 
            fill="url(#colorPoint)" 
            strokeWidth={3}
            activeDot={{ r: 6, strokeWidth: 0, fill: '#a5f3fc', className: "animate-ping" }}
            isAnimationActive={true}
            animationDuration={1500}
            animationEasing="ease-out"
          />

          {/* レーティングはLineのまま */}
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
            animationDuration={1500}
            animationEasing="ease-out"
          />
          
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
