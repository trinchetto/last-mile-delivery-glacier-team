import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const RiskGauge = ({ score }) => {
    const data = [
        { name: 'Risk', value: score * 100 },
        { name: 'Remaining', value: 100 - (score * 100) },
    ];

    const getColor = (s) => {
        if (s < 0.3) return ['#22c55e', '#0f172a']; // Green, Dark Slate
        if (s < 0.7) return ['#eab308', '#0f172a']; // Yellow, Dark Slate
        return ['#ef4444', '#0f172a'];             // Red, Dark Slate
    };

    const colors = getColor(score);
    const riskLabel = score < 0.3 ? 'Low Risk' : score < 0.7 ? 'Medium Risk' : 'High Risk';
    const riskColor = score < 0.3 ? 'text-green-500' : score < 0.7 ? 'text-yellow-500' : 'text-red-500';

    return (
        <div className="glass-card rounded-2xl p-6 relative overflow-hidden group">
            {/* Background glow effect */}
            <div className={`absolute top-0 right-0 w-32 h-32 bg-${score < 0.3 ? 'green' : score < 0.7 ? 'yellow' : 'red'}-500/10 rounded-full blur-3xl -mr-10 -mt-10`}></div>

            <h3 className="text-lg font-semibold text-slate-100 mb-4">Delivery Risk Assessment</h3>

            <div className="flex items-center justify-center relative h-48">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            startAngle={180}
                            endAngle={0}
                            dataKey="value"
                            stroke="none"
                        >
                            <Cell key="cell-0" fill={colors[0]} />
                            <Cell key="cell-1" fill={colors[1]} />
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>

                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center mt-4">
                    <div className="text-4xl font-bold text-white">{(score * 100).toFixed(0)}%</div>
                    <div className={`text-sm font-medium ${riskColor} uppercase tracking-wider mt-1`}>{riskLabel}</div>
                </div>
            </div>

            <div className="text-center text-xs text-slate-400 mt-[-20px]">
                Factors: Route Congestion, Weather Alerts, Carrier Capacity
            </div>
        </div>
    );
};

export default RiskGauge;
