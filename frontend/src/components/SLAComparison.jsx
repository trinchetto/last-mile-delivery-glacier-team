import React from 'react';
import { Target, AlertCircle, CheckCircle, XCircle, ArrowRight, TrendingUp, TrendingDown } from 'lucide-react';

const SLAComparison = ({ slaData }) => {
    const {
        current_sla,
        alignment,
        message,
        expected_transit,
        diff_from_goal,
    } = slaData;

    const getAlignmentConfig = () => {
        switch (alignment) {
            case 'ALIGNED':
                return {
                    icon: CheckCircle,
                    color: 'green',
                    bgColor: 'bg-green-500/10',
                    borderColor: 'border-green-500/30',
                    textColor: 'text-green-400',
                    emoji: '🟢',
                    label: 'SLA Aligned'
                };
            case 'TIGHT':
                return {
                    icon: AlertCircle,
                    color: 'yellow',
                    bgColor: 'bg-yellow-500/10',
                    borderColor: 'border-yellow-500/30',
                    textColor: 'text-yellow-400',
                    emoji: '🟡',
                    label: 'SLA Tight'
                };
            case 'MISALIGNED':
            default:
                return {
                    icon: XCircle,
                    color: 'red',
                    bgColor: 'bg-red-500/10',
                    borderColor: 'border-red-500/30',
                    textColor: 'text-red-400',
                    emoji: '🔴',
                    label: 'SLA Misaligned'
                };
        }
    };

    const config = getAlignmentConfig();
    const Icon = config.icon;

    return (
        <div className={`glass-card rounded-2xl p-6`}>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                    <Target size={18} className="text-orange-500" />
                    SLA vs Reality
                </h3>
                <span className={`text-xs px-2 py-1 rounded-full border ${config.bgColor} ${config.borderColor} ${config.textColor}`}>
                    {config.emoji} {config.label}
                </span>
            </div>

            {/* Visual Comparison */}
            <div className="relative p-4 rounded-xl bg-midnight-950/50 border border-white/5 mb-4">
                <div className="flex items-center justify-between">
                    {/* SLA Goal */}
                    <div className="text-center flex-1">
                        <div className="text-xs text-slate-400 mb-1">SLA Promise</div>
                        <div className="text-3xl font-bold text-blue-400">{current_sla}</div>
                        <div className="text-sm text-slate-400">days</div>
                    </div>

                    {/* Arrow with difference */}
                    <div className="flex flex-col items-center px-4">
                        <div className={`flex items-center gap-1 ${diff_from_goal > 0 ? 'text-red-400' : 'text-green-400'}`}>
                            {diff_from_goal > 0 ? (
                                <>
                                    <TrendingUp size={16} />
                                    <span className="text-sm font-medium">+{diff_from_goal.toFixed(1)}d</span>
                                </>
                            ) : (
                                <>
                                    <TrendingDown size={16} />
                                    <span className="text-sm font-medium">{diff_from_goal.toFixed(1)}d</span>
                                </>
                            )}
                        </div>
                        <ArrowRight size={24} className="text-slate-500 my-1" />
                        <div className="text-xs text-slate-500">gap</div>
                    </div>

                    {/* Actual Expected */}
                    <div className="text-center flex-1">
                        <div className="text-xs text-slate-400 mb-1">Actual Expected</div>
                        <div className={`text-3xl font-bold ${config.textColor}`}>{expected_transit.toFixed(1)}</div>
                        <div className="text-sm text-slate-400">days</div>
                    </div>
                </div>

                {/* Progress bar visualization */}
                <div className="mt-4 relative">
                    <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                        {/* SLA marker */}
                        <div
                            className="absolute h-full w-1 bg-blue-400 z-10"
                            style={{ left: `${Math.min(100, (current_sla / 7) * 100)}%` }}
                        />
                        {/* Actual fill */}
                        <div
                            className={`h-full rounded-full transition-all ${alignment === 'ALIGNED' ? 'bg-green-500' :
                                    alignment === 'TIGHT' ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                            style={{ width: `${Math.min(100, (expected_transit / 7) * 100)}%` }}
                        />
                    </div>
                    <div className="flex justify-between text-xs text-slate-500 mt-1">
                        <span>0d</span>
                        <span>7d</span>
                    </div>
                </div>
            </div>

            {/* Message */}
            <div className={`p-4 rounded-lg border ${config.bgColor} ${config.borderColor}`}>
                <div className="flex items-start gap-3">
                    <Icon className={config.textColor} size={20} />
                    <div>
                        <p className={`text-sm font-medium ${config.textColor}`}>
                            {alignment === 'ALIGNED' ? 'Good News!' :
                                alignment === 'TIGHT' ? 'Caution Required' : 'Action Required'}
                        </p>
                        <p className="text-sm text-slate-300 mt-1">{message}</p>
                    </div>
                </div>
            </div>

            {/* Recommendations based on alignment */}
            {alignment !== 'ALIGNED' && (
                <div className="mt-4 space-y-2">
                    <div className="text-xs font-medium text-slate-400 uppercase">Recommended Actions</div>
                    {alignment === 'MISALIGNED' && (
                        <>
                            <div className="flex items-center gap-2 text-sm text-slate-300">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                                Update ERP delivery promise to {Math.ceil(expected_transit)} days
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-300">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                                Proactively notify customer of realistic timeline
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-300">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                                Escalate to forwarder for SLA review
                            </div>
                        </>
                    )}
                    {alignment === 'TIGHT' && (
                        <>
                            <div className="flex items-center gap-2 text-sm text-slate-300">
                                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400"></span>
                                Set up tracking alerts for this shipment
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-300">
                                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400"></span>
                                Prepare contingency communication
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default SLAComparison;
