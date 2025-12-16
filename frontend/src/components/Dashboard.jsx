import React from 'react';
import { AlertTriangle, Info, AlertCircle, Zap, Package, Clock, CheckCircle } from 'lucide-react';
import RiskGauge from './RiskGauge';

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
            case 'warning': return <AlertTriangle className="text-red-400" size={18} />;
            case 'alert': return <AlertCircle className="text-orange-400" size={18} />;
            default: return <Info className="text-blue-400" size={18} />;
        }
    };

    const getBorderColor = (type) => {
        switch (type) {
            case 'warning': return 'border-red-500/20 bg-red-500/5';
            case 'alert': return 'border-orange-500/20 bg-orange-500/5';
            default: return 'border-blue-500/20 bg-blue-500/5';
        }
    };

    // Welcome screen if no analysis
    if (!hasAnalyzed || !analysisResult) {
        return (
            <div className="flex-1 p-8 overflow-y-auto flex items-center justify-center">
                <div className="text-center max-w-md">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary-500/20 to-accent-purple/20 border border-white/10 flex items-center justify-center">
                        <Package size={40} className="text-primary-400" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-3">
                        Welcome to DeliveryIQ
                    </h1>
                    <p className="text-slate-400 mb-8">
                        AI-Powered Delivery Risk Advisor. Select a lane and carrier to unlock <span className="text-primary-400 font-medium">predictive insights</span>.
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                        <div className="p-3 rounded-xl bg-slate-800/50 border border-white/5">
                            <div className="text-xl font-bold text-green-400">Low</div>
                            <div className="text-xs text-slate-500">&lt;30% probability</div>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-800/50 border border-white/5">
                            <div className="text-xl font-bold text-yellow-400">Med</div>
                            <div className="text-xs text-slate-500">30-70% probability</div>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-800/50 border border-white/5">
                            <div className="text-xl font-bold text-red-400">High</div>
                            <div className="text-xs text-slate-500">&gt;70% probability</div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Minimalistic dashboard with analysis results
    return (
        <div className="flex-1 p-8 overflow-y-auto">
            {/* Compact Header */}
            <header className="mb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                            <Zap className="text-primary-400" size={20} />
                            Risk Analysis
                        </h1>
                        <div className="flex items-center gap-3 text-slate-400 text-sm">
                            <span>{analysisResult.lane_info.origin} → {analysisResult.lane_info.destination}</span>
                            <span className="text-slate-600">•</span>
                            <span>{analysisResult.carrier_info.name}</span>
                        </div>
                    </div>
                    <div className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                        analysisResult.risk_level === 'LOW' ? 'bg-green-500/20 text-green-400' :
                        analysisResult.risk_level === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                    }`}>
                        {analysisResult.risk_level === 'LOW' ? '🟢' :
                         analysisResult.risk_level === 'MEDIUM' ? '🟡' : '🔴'} {analysisResult.risk_level} RISK
                    </div>
                </div>
            </header>

            {/* Main Content: Risk Gauge + Delivery Info */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Risk Gauge */}
                <RiskGauge score={analysisResult.risk_score} />

                {/* Delivery Summary Card */}
                <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Clock size={18} className="text-primary-400" />
                        Delivery Window
                    </h3>
                    
                    <div className="space-y-4">
                        {/* Expected Delivery */}
                        <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                            <span className="text-slate-400 text-sm">Expected</span>
                            <span className="text-white font-semibold">
                                {analysisResult.recommended_window.expected_days} days
                            </span>
                        </div>
                        
                        {/* Date Range */}
                        <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                            <span className="text-slate-400 text-sm">Window</span>
                            <span className="text-white font-medium text-sm">
                                {analysisResult.delivery_dates.earliest} – {analysisResult.delivery_dates.latest}
                            </span>
                        </div>

                        {/* SLA Status */}
                        <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                            <span className="text-slate-400 text-sm">SLA Goal</span>
                            <div className="flex items-center gap-2">
                                <span className="text-white font-medium">{analysisResult.sla_comparison.current_sla} days</span>
                                {analysisResult.sla_comparison.will_meet_sla ? (
                                    <CheckCircle size={16} className="text-green-400" />
                                ) : (
                                    <AlertCircle size={16} className="text-red-400" />
                                )}
                            </div>
                        </div>

                        {/* Model Confidence */}
                        <div className="pt-3 border-t border-slate-700">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-500">Confidence</span>
                                <span className={`font-medium ${
                                    analysisResult.confidence.level === 'HIGH' ? 'text-green-400' :
                                    analysisResult.confidence.level === 'MEDIUM' ? 'text-yellow-400' : 'text-orange-400'
                                }`}>
                                    {analysisResult.confidence.level} ({(analysisResult.confidence.score * 100).toFixed(0)}%)
                                </span>
                            </div>
                            <div className="text-xs text-slate-600 mt-1">
                                Based on {analysisResult.confidence.shipment_count} shipments
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Key Insights */}
            <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <AlertTriangle size={18} className="text-yellow-400" />
                    Key Insights
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {analysisResult.insights.slice(0, 4).map((insight, idx) => (
                        <div key={idx} className={`p-3 rounded-lg border flex gap-3 items-start ${getBorderColor(insight.type)}`}>
                            <div className="mt-0.5 flex-shrink-0">{getIcon(insight.type)}</div>
                            <p className="text-sm text-slate-300 leading-snug">{insight.message}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
