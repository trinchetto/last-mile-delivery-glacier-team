import React from 'react';
import { BarChart3, Target, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine, Line, ComposedChart, Area } from 'recharts';

const ProbabilityChart = ({ data, slaGoal, percentiles }) => {
    // Add cumulative probability to data
    const chartData = data.map(d => ({
        ...d,
        probabilityPct: (d.probability * 100).toFixed(0),
        cumulativePct: (d.cumulative * 100).toFixed(0),
    }));

    const getBarColor = (days, slaGoal) => {
        if (days <= slaGoal) return '#22c55e'; // Green - meets SLA
        if (days <= slaGoal + 1) return '#eab308'; // Yellow - slightly late
        return '#ef4444'; // Red - late
    };

    // Find probability of meeting SLA
    const slaProbability = chartData.find(d => d.days === slaGoal)?.cumulative || 0;

    return (
        <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                    <BarChart3 size={18} className="text-purple-500" />
                    Transit Time Probability
                </h3>
                <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded-full border border-purple-500/20">
                    Based on {chartData.reduce((sum, d) => sum + Math.round(d.probability * 1000), 0)} shipments
                </span>
            </div>

            {/* Main Chart */}
            <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis
                            dataKey="days"
                            stroke="#94a3b8"
                            tickFormatter={(v) => `${v}d`}
                        />
                        <YAxis
                            yAxisId="left"
                            stroke="#94a3b8"
                            tickFormatter={(v) => `${v}%`}
                            domain={[0, 40]}
                        />
                        <YAxis
                            yAxisId="right"
                            orientation="right"
                            stroke="#94a3b8"
                            tickFormatter={(v) => `${v}%`}
                            domain={[0, 100]}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                            formatter={(value, name) => {
                                if (name === 'probabilityPct') return [`${value}%`, 'Probability'];
                                if (name === 'cumulativePct') return [`${value}%`, 'Cumulative'];
                                return [value, name];
                            }}
                            labelFormatter={(label) => `${label} days transit`}
                        />
                        {/* SLA Reference Line */}
                        <ReferenceLine
                            x={slaGoal}
                            yAxisId="left"
                            stroke="#f59e0b"
                            strokeDasharray="5 5"
                            strokeWidth={2}
                            label={{
                                value: `SLA: ${slaGoal}d`,
                                fill: '#f59e0b',
                                fontSize: 12,
                                position: 'top'
                            }}
                        />
                        {/* Probability Bars */}
                        <Bar yAxisId="left" dataKey="probabilityPct" radius={[4, 4, 0, 0]}>
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={getBarColor(entry.days, slaGoal)} />
                            ))}
                        </Bar>
                        {/* Cumulative Line */}
                        <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="cumulativePct"
                            stroke="#a855f7"
                            strokeWidth={2}
                            dot={{ r: 4, fill: '#1e293b', strokeWidth: 2, stroke: '#a855f7' }}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>

            {/* Probability Summary Cards */}
            <div className="grid grid-cols-4 gap-3 mt-4">
                {chartData.slice(0, 4).map((d) => (
                    <div
                        key={d.days}
                        className={`p-3 rounded-lg border text-center ${d.days <= slaGoal
                                ? 'bg-green-500/10 border-green-500/30'
                                : 'bg-slate-700/30 border-slate-600/50'
                            }`}
                    >
                        <div className="text-2xl font-bold text-white">{d.days}d</div>
                        <div className={`text-lg font-semibold ${d.days <= slaGoal ? 'text-green-400' : 'text-slate-300'}`}>
                            {(d.cumulative * 100).toFixed(0)}%
                        </div>
                        <div className="text-xs text-slate-400">chance</div>
                    </div>
                ))}
            </div>

            {/* Percentile Summary */}
            {percentiles && (
                <div className="mt-4 p-3 rounded-lg bg-slate-700/30 border border-slate-600/50">
                    <div className="flex items-center gap-2 mb-2">
                        <Clock size={14} className="text-blue-400" />
                        <span className="text-sm font-medium text-slate-200">Transit Time Percentiles</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-1">
                            <span className="text-slate-400">P25:</span>
                            <span className="text-green-400 font-medium">{percentiles.p25}d</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="text-slate-400">P50:</span>
                            <span className="text-blue-400 font-medium">{percentiles.p50}d</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="text-slate-400">P75:</span>
                            <span className="text-yellow-400 font-medium">{percentiles.p75}d</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="text-slate-400">P90:</span>
                            <span className="text-red-400 font-medium">{percentiles.p90}d</span>
                        </div>
                    </div>
                </div>
            )}

            {/* SLA Achievement Message */}
            <div className={`mt-4 p-3 rounded-lg border ${slaProbability >= 0.7
                    ? 'bg-green-500/10 border-green-500/30'
                    : slaProbability >= 0.5
                        ? 'bg-yellow-500/10 border-yellow-500/30'
                        : 'bg-red-500/10 border-red-500/30'
                }`}>
                <div className="flex items-center gap-2">
                    <Target size={16} className={
                        slaProbability >= 0.7 ? 'text-green-400' :
                            slaProbability >= 0.5 ? 'text-yellow-400' : 'text-red-400'
                    } />
                    <span className="text-sm">
                        <span className={
                            slaProbability >= 0.7 ? 'text-green-400' :
                                slaProbability >= 0.5 ? 'text-yellow-400' : 'text-red-400'
                        }>
                            {(slaProbability * 100).toFixed(0)}% probability
                        </span>
                        <span className="text-slate-300"> of meeting {slaGoal}-day SLA</span>
                    </span>
                </div>
            </div>
        </div>
    );
};

export default ProbabilityChart;
