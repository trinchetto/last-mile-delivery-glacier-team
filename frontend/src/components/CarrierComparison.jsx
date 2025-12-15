import React from 'react';
import { Truck, Star, Check, X, TrendingUp, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const CarrierComparison = ({ carriers, selectedCarrier, onCarrierSelect }) => {
    const chartData = carriers.map(c => ({
        name: c.carrier_name.split(' ')[0],
        late_rate: (c.late_rate * 100).toFixed(0),
        avg_transit: c.avg_transit,
        recommended: c.recommended,
    }));

    const getBarColor = (entry) => {
        if (entry.recommended) return '#22c55e';
        if (entry.late_rate > 60) return '#ef4444';
        if (entry.late_rate > 40) return '#f59e0b';
        return '#3b82f6';
    };

    return (
        <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                    <Truck size={18} className="text-blue-500" />
                    Carrier Comparison
                </h3>
                <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full border border-blue-500/20">
                    For selected lane
                </span>
            </div>

            {/* Chart */}
            <div className="h-40 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                        <XAxis type="number" stroke="#94a3b8" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                        <YAxis type="category" dataKey="name" stroke="#94a3b8" width={80} />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                            formatter={(value) => [`${value}%`, 'Late Rate']}
                        />
                        <Bar dataKey="late_rate" radius={[0, 4, 4, 0]}>
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={getBarColor(entry)} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Carrier Cards */}
            <div className="space-y-2">
                {carriers.map((carrier) => (
                    <div
                        key={carrier.carrier_id}
                        className={`p-3 rounded-lg border transition-all cursor-pointer ${carrier.recommended
                                ? 'bg-green-500/10 border-green-500/30 hover:bg-green-500/20'
                                : selectedCarrier === carrier.carrier_id
                                    ? 'bg-blue-500/10 border-blue-500/30'
                                    : 'bg-slate-700/30 border-slate-600/50 hover:bg-slate-700/50'
                            }`}
                        onClick={() => onCarrierSelect && onCarrierSelect(carrier.carrier_id)}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${carrier.recommended ? 'bg-green-500/20' : 'bg-slate-600'
                                    }`}>
                                    {carrier.recommended ? (
                                        <Star size={16} className="text-green-400 fill-green-400" />
                                    ) : (
                                        <span className="text-xs text-slate-400">#{carrier.reliability_rank}</span>
                                    )}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-slate-200">{carrier.carrier_name}</span>
                                        {carrier.recommended && (
                                            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
                                                Recommended
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-xs text-slate-400">{carrier.shipments} shipments on this lane</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-center">
                                    <div className={`text-sm font-semibold ${carrier.late_rate < 0.3 ? 'text-green-400' :
                                            carrier.late_rate < 0.5 ? 'text-yellow-400' : 'text-red-400'
                                        }`}>
                                        {(carrier.late_rate * 100).toFixed(0)}%
                                    </div>
                                    <div className="text-xs text-slate-500">Late</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-sm font-semibold text-slate-200">
                                        {carrier.avg_transit.toFixed(1)}d
                                    </div>
                                    <div className="text-xs text-slate-500">Avg</div>
                                </div>
                                <div className="w-6 flex justify-center">
                                    {carrier.recommended ? (
                                        <Check size={18} className="text-green-400" />
                                    ) : carrier.late_rate > 0.6 ? (
                                        <X size={18} className="text-red-400" />
                                    ) : null}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Recommendation */}
            <div className="mt-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <div className="flex items-start gap-2">
                    <TrendingUp size={16} className="text-green-400 mt-0.5" />
                    <div>
                        <p className="text-sm text-green-300 font-medium">Recommendation</p>
                        <p className="text-xs text-slate-400 mt-1">
                            <span className="text-green-400 font-medium">{carriers.find(c => c.recommended)?.carrier_name}</span> has the lowest late rate on this lane.
                            Switching from worst to best carrier could reduce late deliveries by up to <span className="text-green-400 font-medium">
                                {((carriers[carriers.length - 1]?.late_rate - carriers[0]?.late_rate) * 100).toFixed(0)}%
                            </span>.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CarrierComparison;
