import React from 'react';
import { Calendar, ArrowRight, ShieldCheck, ShieldAlert, Clock, CalendarDays } from 'lucide-react';

const DeliveryWindow = ({ window, riskLevel }) => {
    // Parse dates for calendar display
    const startDate = new Date(window.start);
    const endDate = new Date(window.end);

    // Calculate days until delivery
    const today = new Date();
    const daysUntilStart = Math.ceil((startDate - today) / (1000 * 60 * 60 * 24));

    // Format dates
    const formatDate = (date) => {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    // Get window type badge
    const getWindowBadge = () => {
        if (riskLevel === 'LOW') {
            return { text: 'Tight Window', color: 'bg-green-500/20 text-green-400 border-green-500/20' };
        } else if (riskLevel === 'MEDIUM') {
            return { text: 'Moderate Window', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/20' };
        } else {
            return { text: 'Wide Window', color: 'bg-red-500/20 text-red-400 border-red-500/20' };
        }
    };

    const badge = getWindowBadge();

    return (
        <div className="glass-card rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-opacity group-hover:opacity-100"></div>

            <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center justify-between relative z-10">
                <span className="flex items-center gap-2">
                    <CalendarDays size={18} className="text-primary-400 drop-shadow-md" />
                    Recommended Window
                </span>
                <span className={`text-xs px-2 py-1 rounded-full border ${badge.color}`}>
                    {badge.text}
                </span>
            </h3>

            {/* Main Window Display */}
            <div className="bg-midnight-950/50 rounded-xl p-5 border border-white/5 mb-5 relative z-10">
                <div className="flex items-center justify-between text-slate-300 mb-3">
                    <div className="text-center">
                        <div className="text-xs text-slate-500 mb-1">Earliest</div>
                        <div className="text-xl font-bold text-primary-400 text-glow">{formatDate(startDate)}</div>
                    </div>
                    <div className="flex flex-col items-center">
                        <ArrowRight size={20} className="text-slate-500" />
                        <div className="text-xs text-slate-500">{window.max_days - window.min_days + 1} day span</div>
                    </div>
                    <div className="text-center">
                        <div className="text-xs text-slate-500 mb-1">Latest</div>
                        <div className="text-xl font-bold text-primary-400 text-glow">{formatDate(endDate)}</div>
                    </div>
                </div>

                {/* Transit Days Display */}
                <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-700/50">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-white">{window.min_days}</div>
                        <div className="text-xs text-slate-500">Min Days</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-primary-400">{window.expected_days?.toFixed(1) || window.min_days}</div>
                        <div className="text-xs text-slate-500">Expected</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-white">{window.max_days}</div>
                        <div className="text-xs text-slate-500">Max Days</div>
                    </div>
                </div>
            </div>

            {/* Visual Timeline */}
            <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                    <Clock size={14} className="text-slate-400" />
                    <span className="text-xs text-slate-400">Transit Timeline</span>
                </div>
                <div className="relative h-8 bg-slate-700/50 rounded-full overflow-hidden">
                    {/* Expected range highlight */}
                    <div
                        className={`absolute h-full ${riskLevel === 'LOW' ? 'bg-green-500/40' :
                                riskLevel === 'MEDIUM' ? 'bg-yellow-500/40' : 'bg-red-500/40'
                            }`}
                        style={{
                            left: `${(window.min_days / 7) * 100}%`,
                            width: `${((window.max_days - window.min_days + 1) / 7) * 100}%`
                        }}
                    />
                    {/* Day markers */}
                    <div className="absolute inset-0 flex justify-between items-center px-2">
                        {[1, 2, 3, 4, 5, 6, 7].map(day => (
                            <div
                                key={day}
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${day >= window.min_days && day <= window.max_days
                                        ? riskLevel === 'LOW' ? 'bg-green-500 text-white' :
                                            riskLevel === 'MEDIUM' ? 'bg-yellow-500 text-slate-900' : 'bg-red-500 text-white'
                                        : 'bg-slate-600 text-slate-400'
                                    }`}
                            >
                                {day}
                            </div>
                        ))}
                    </div>
                </div>
                <div className="flex justify-between text-xs text-slate-500 mt-1 px-2">
                    <span>1 day</span>
                    <span>7 days</span>
                </div>
            </div>

            {/* Status Message */}
            <div className={`p-3 rounded-lg border ${riskLevel === 'LOW' ? 'bg-green-500/10 border-green-500/20' :
                    riskLevel === 'MEDIUM' ? 'bg-yellow-500/10 border-yellow-500/20' :
                        'bg-red-500/10 border-red-500/20'
                }`}>
                <div className="flex items-start gap-2">
                    {riskLevel === 'LOW' ? (
                        <ShieldCheck className="w-5 h-5 text-green-500 mt-0.5" />
                    ) : (
                        <ShieldAlert className={`w-5 h-5 mt-0.5 ${riskLevel === 'MEDIUM' ? 'text-yellow-500' : 'text-red-500'
                            }`} />
                    )}
                    <div>
                        <p className={`text-sm font-medium ${riskLevel === 'LOW' ? 'text-green-400' :
                                riskLevel === 'MEDIUM' ? 'text-yellow-400' : 'text-red-400'
                            }`}>
                            {riskLevel === 'LOW' ? 'High Confidence' :
                                riskLevel === 'MEDIUM' ? 'Moderate Confidence' : 'Low Confidence'}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                            {riskLevel === 'LOW'
                                ? 'Expected delivery falls within tight parameters.'
                                : riskLevel === 'MEDIUM'
                                    ? 'Consider providing a wider window to customers.'
                                    : 'High variability expected. Recommend conservative estimates.'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeliveryWindow;
