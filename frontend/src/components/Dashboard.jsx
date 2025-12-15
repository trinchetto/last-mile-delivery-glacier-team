import React from 'react';
import { AlertTriangle, Info, AlertCircle, TrendingUp, Zap, Package, ArrowRight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import RiskGauge from './RiskGauge';
import DeliveryWindow from './DeliveryWindow';
import CarrierComparison from './CarrierComparison';
import ProbabilityChart from './ProbabilityChart';
import SLAComparison from './SLAComparison';
import SimilarShipments from './SimilarShipments';

const Dashboard = ({
    analysisResult,
    hasAnalyzed,
    carrierComparison,
    transitProbability,
    similarShipments,
    historicalPerformance,
    onCarrierSelect,
    selectedCarrier
}) => {
    const getIcon = (type) => {
        switch (type) {
            case 'warning': return <AlertTriangle className="text-red-500" size={20} />;
            case 'alert': return <AlertCircle className="text-orange-500" size={20} />;
            default: return <Info className="text-blue-500" size={20} />;
        }
    };

    const getBorderColor = (type) => {
        switch (type) {
            case 'warning': return 'border-red-500/30 bg-red-500/5';
            case 'alert': return 'border-orange-500/30 bg-orange-500/5';
            default: return 'border-blue-500/30 bg-blue-500/5';
        }
    };

    // If no analysis has been done yet, show welcome screen
    if (!hasAnalyzed || !analysisResult) {

        return (
            <div className="flex-1 p-8 overflow-y-auto flex items-center justify-center relative">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-purple/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
                </div>

                <div className="text-center max-w-lg z-10">
                    <div className="w-24 h-24 mx-auto mb-8 rounded-3xl bg-gradient-to-br from-primary-500/20 to-accent-purple/20 border border-white/10 flex items-center justify-center shadow-2xl relative group">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 to-accent-purple/10 rounded-3xl blur-xl group-hover:blur-2xl transition-all"></div>
                        <Package size={48} className="text-primary-400 relative z-10 drop-shadow-[0_0_15px_rgba(56,189,248,0.5)]" />
                    </div>
                    <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400 mb-4 tracking-tight">
                        Welcome to DeliveryIQ
                    </h1>
                    <p className="text-slate-400 mb-10 text-lg leading-relaxed">
                        AI-Powered Delivery Risk Advisor. Select a lane and carrier to unlock <span className="text-primary-400 font-medium text-glow">predictive insights</span>.
                    </p>
                    <div className="grid grid-cols-3 gap-4 mb-10">
                        <div className="p-4 rounded-2xl bg-midnight-800/50 border border-white/5 backdrop-blur-sm transition-transform hover:-translate-y-1">
                            <div className="text-2xl font-bold text-green-400 mb-1 drop-shadow-lg">Low</div>
                            <div className="text-xs text-slate-500">&lt;30% probability</div>
                        </div>
                        <div className="p-4 rounded-2xl bg-midnight-800/50 border border-white/5 backdrop-blur-sm transition-transform hover:-translate-y-1">
                            <div className="text-2xl font-bold text-yellow-400 mb-1 drop-shadow-lg">Med</div>
                            <div className="text-xs text-slate-500">30-70% probability</div>
                        </div>
                        <div className="p-4 rounded-2xl bg-midnight-800/50 border border-white/5 backdrop-blur-sm transition-transform hover:-translate-y-1">
                            <div className="text-2xl font-bold text-red-400 mb-1 drop-shadow-lg">High</div>
                            <div className="text-xs text-slate-500">&gt;70% probability</div>
                        </div>
                    </div>
                </div>
            </div>
        );

    }

    // Main dashboard with analysis results
    return (
        <div className="flex-1 p-8 overflow-y-auto">
            {/* Header */}
            <header className="mb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
                            <Zap className="text-primary-400 fill-primary-400/20" size={24} />
                            Shipment Risk Analysis
                        </h1>
                        <div className="flex items-center gap-4 text-slate-400 text-sm">
                            <span>
                                Lane: <span className="text-slate-200">{analysisResult.lane_info.origin} → {analysisResult.lane_info.destination}</span>
                            </span>
                            <span>•</span>
                            <span>
                                Carrier: <span className="text-slate-200">{analysisResult.carrier_info.name}</span>
                            </span>
                            <span>•</span>
                            <span>
                                Ship Date: <span className="text-slate-200">{analysisResult.delivery_dates.ship_date}</span>
                            </span>
                        </div>
                    </div>
                    <div className={`px-4 py-2 rounded-full border ${analysisResult.risk_level === 'LOW' ? 'bg-green-500/20 border-green-500/30 text-green-400' :
                        analysisResult.risk_level === 'MEDIUM' ? 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400' :
                            'bg-red-500/20 border-red-500/30 text-red-400'
                        }`}>
                        <span className="text-sm font-medium">
                            {analysisResult.risk_level === 'LOW' ? '🟢' :
                                analysisResult.risk_level === 'MEDIUM' ? '🟡' : '🔴'} {analysisResult.risk_level} RISK
                        </span>
                    </div>
                </div>
            </header>

            {/* Row 1: Risk Gauge + Delivery Window + SLA Comparison */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <RiskGauge score={analysisResult.risk_score} />
                <DeliveryWindow
                    window={{
                        start: analysisResult.delivery_dates.earliest,
                        end: analysisResult.delivery_dates.latest,
                        min_days: analysisResult.recommended_window.min_days,
                        max_days: analysisResult.recommended_window.max_days,
                        expected_days: analysisResult.recommended_window.expected_days,
                    }}
                    riskLevel={analysisResult.risk_level}
                />
                <SLAComparison slaData={analysisResult.sla_comparison} />
            </div>

            {/* Row 2: Probability Chart + Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <ProbabilityChart
                    data={transitProbability}
                    slaGoal={analysisResult.sla_comparison.current_sla}
                    percentiles={analysisResult.percentiles}
                />

                {/* Insights Panel */}
                <div className="glass-card rounded-2xl p-6">
                    <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
                        <AlertTriangle size={18} className="text-yellow-400 drop-shadow-md" />
                        Key Insights & Recommendations
                    </h3>
                    <div className="space-y-3">
                        {analysisResult.insights.map((insight, idx) => (
                            <div key={idx} className={`p-4 rounded-lg border flex gap-3 items-start ${getBorderColor(insight.type)}`}>
                                <div className="mt-0.5">{getIcon(insight.type)}</div>
                                <p className="text-sm text-slate-300 leading-snug">{insight.message}</p>
                            </div>
                        ))}
                    </div>

                    {/* Confidence indicator */}
                    <div className="mt-4 pt-4 border-t border-slate-700">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-400">Model Confidence</span>
                            <span className={`font-medium ${analysisResult.confidence.level === 'HIGH' ? 'text-green-400' :
                                analysisResult.confidence.level === 'MEDIUM' ? 'text-yellow-400' : 'text-orange-400'
                                }`}>
                                {analysisResult.confidence.level} ({(analysisResult.confidence.score * 100).toFixed(0)}%)
                            </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                            Based on {analysisResult.confidence.shipment_count} historical shipments
                        </div>
                    </div>
                </div>
            </div>

            {/* Row 3: Carrier Comparison + Similar Shipments */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <CarrierComparison
                    carriers={carrierComparison}
                    selectedCarrier={selectedCarrier}
                    onCarrierSelect={onCarrierSelect}
                />
                <SimilarShipments shipments={similarShipments} />
            </div>

            {/* Row 4: Historical Performance Chart */}
            <div className="glass-card rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
                    <TrendingUp size={18} className="text-green-400 drop-shadow-md" />
                    Historical Lane Performance (Last 6 Months)
                </h3>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={historicalPerformance}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="month" stroke="#94a3b8" />
                            <YAxis stroke="#94a3b8" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                                formatter={(value, name) => {
                                    if (name === 'on_time') return [`${value}%`, 'On-Time Rate'];
                                    return [value, name];
                                }}
                            />
                            <Line
                                type="monotone"
                                dataKey="on_time"
                                stroke="#22c55e"
                                strokeWidth={3}
                                dot={{ r: 5, fill: '#1e293b', strokeWidth: 2, stroke: '#22c55e' }}
                                activeDot={{ r: 7, fill: '#22c55e' }}
                                name="on_time"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
