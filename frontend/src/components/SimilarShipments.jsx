import React from 'react';
import { History, Package, Clock, CheckCircle, XCircle, Calendar } from 'lucide-react';

const SimilarShipments = ({ shipments }) => {
    const onTimeCount = shipments.filter(s => s.status === 'On Time').length;
    const lateCount = shipments.filter(s => s.status === 'Late').length;
    const avgDelay = shipments.reduce((sum, s) => sum + s.delay_days, 0) / shipments.length;

    return (
        <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                    <History size={18} className="text-cyan-500" />
                    Similar Historical Shipments
                </h3>
                <span className="text-xs text-slate-400">
                    Last {shipments.length} shipments on this lane
                </span>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                        <CheckCircle size={14} className="text-green-400" />
                        <span className="text-lg font-bold text-green-400">{onTimeCount}</span>
                    </div>
                    <div className="text-xs text-slate-400">On Time</div>
                </div>
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                        <XCircle size={14} className="text-red-400" />
                        <span className="text-lg font-bold text-red-400">{lateCount}</span>
                    </div>
                    <div className="text-xs text-slate-400">Late</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-700/30 border border-slate-600/50 text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                        <Clock size={14} className="text-slate-400" />
                        <span className="text-lg font-bold text-slate-200">{avgDelay.toFixed(1)}d</span>
                    </div>
                    <div className="text-xs text-slate-400">Avg Delay</div>
                </div>
            </div>

            {/* Historical Rate */}
            <div className="mb-4 p-3 rounded-lg bg-slate-700/30 border border-slate-600/50">
                <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-slate-400">Historical On-Time Rate</span>
                    <span className={`font-semibold ${
                        (onTimeCount / shipments.length) >= 0.7 ? 'text-green-400' :
                        (onTimeCount / shipments.length) >= 0.5 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                        {((onTimeCount / shipments.length) * 100).toFixed(0)}%
                    </span>
                </div>
                <div className="h-2 bg-slate-600 rounded-full overflow-hidden">
                    <div 
                        className={`h-full rounded-full ${
                            (onTimeCount / shipments.length) >= 0.7 ? 'bg-green-500' :
                            (onTimeCount / shipments.length) >= 0.5 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${(onTimeCount / shipments.length) * 100}%` }}
                    />
                </div>
            </div>

            {/* Shipments List */}
            <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                {shipments.map((shipment) => (
                    <div 
                        key={shipment.id}
                        className={`p-3 rounded-lg border transition-all hover:bg-slate-700/50 ${
                            shipment.status === 'On Time' 
                                ? 'bg-slate-700/20 border-slate-600/50' 
                                : 'bg-red-500/5 border-red-500/20'
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                    shipment.status === 'On Time' ? 'bg-green-500/20' : 'bg-red-500/20'
                                }`}>
                                    {shipment.status === 'On Time' ? (
                                        <CheckCircle size={16} className="text-green-400" />
                                    ) : (
                                        <XCircle size={16} className="text-red-400" />
                                    )}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-slate-200">{shipment.id}</span>
                                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                                            shipment.status === 'On Time' 
                                                ? 'bg-green-500/20 text-green-400' 
                                                : 'bg-red-500/20 text-red-400'
                                        }`}>
                                            {shipment.status}
                                        </span>
                                    </div>
                                    <div className="text-xs text-slate-400">{shipment.carrier}</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="flex items-center gap-1 text-sm">
                                    <Clock size={12} className="text-slate-400" />
                                    <span className="text-slate-200">{shipment.transit_days}d</span>
                                    <span className="text-slate-500">/</span>
                                    <span className="text-slate-400">{shipment.goal_days}d goal</span>
                                </div>
                                <div className="flex items-center gap-1 text-xs text-slate-500">
                                    <Calendar size={10} />
                                    <span>{shipment.ship_date}</span>
                                </div>
                            </div>
                        </div>
                        {shipment.delay_days > 0 && (
                            <div className="mt-2 text-xs text-red-400">
                                Delayed by {shipment.delay_days} day{shipment.delay_days > 1 ? 's' : ''}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Footer insight */}
            <div className="mt-4 pt-4 border-t border-slate-700 text-xs text-slate-400 text-center">
                💡 Based on {shipments.length} similar shipments from the last 3 months
            </div>
        </div>
    );
};

export default SimilarShipments;
