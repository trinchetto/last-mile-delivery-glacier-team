import React from 'react';
import { AlertTriangle, TrendingDown, ArrowUpRight } from 'lucide-react';

const ProblematicLanesTable = ({ lanes, onLaneSelect }) => {
    const getRiskBadge = (lateRate) => {
        if (lateRate >= 0.7) {
            return <span className="px-2 py-1 text-xs font-medium bg-red-500/20 text-red-400 rounded-full border border-red-500/30">Critical</span>;
        } else if (lateRate >= 0.5) {
            return <span className="px-2 py-1 text-xs font-medium bg-orange-500/20 text-orange-400 rounded-full border border-orange-500/30">High</span>;
        } else {
            return <span className="px-2 py-1 text-xs font-medium bg-yellow-500/20 text-yellow-400 rounded-full border border-yellow-500/30">Elevated</span>;
        }
    };

    return (
        <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                    <AlertTriangle size={18} className="text-red-500" />
                    Top 10 Problematic Lanes
                </h3>
                <span className="text-xs text-slate-400">Based on historical late rate</span>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-slate-400 border-b border-slate-700">
                            <th className="text-left py-3 px-2 font-medium">Lane</th>
                            <th className="text-left py-3 px-2 font-medium">Route</th>
                            <th className="text-center py-3 px-2 font-medium">Late Rate</th>
                            <th className="text-center py-3 px-2 font-medium">Risk</th>
                            <th className="text-center py-3 px-2 font-medium">Shipments</th>
                            <th className="text-center py-3 px-2 font-medium">Avg Delay</th>
                            <th className="text-center py-3 px-2 font-medium">SLA Gap</th>
                            <th className="text-center py-3 px-2 font-medium"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {lanes.map((lane, idx) => (
                            <tr 
                                key={lane.lane_id} 
                                className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors cursor-pointer"
                                onClick={() => onLaneSelect && onLaneSelect(lane.lane_id)}
                            >
                                <td className="py-3 px-2">
                                    <div className="flex items-center gap-2">
                                        <span className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-xs text-slate-300">
                                            {idx + 1}
                                        </span>
                                        <span className="font-mono text-xs text-slate-400">{lane.lane_id.slice(0, 8)}...</span>
                                    </div>
                                </td>
                                <td className="py-3 px-2">
                                    <div className="text-slate-200">{lane.origin}</div>
                                    <div className="text-xs text-slate-500">→ {lane.destination}</div>
                                </td>
                                <td className="py-3 px-2 text-center">
                                    <div className="flex items-center justify-center gap-1">
                                        <TrendingDown size={14} className="text-red-400" />
                                        <span className="text-red-400 font-semibold">{(lane.late_rate * 100).toFixed(0)}%</span>
                                    </div>
                                </td>
                                <td className="py-3 px-2 text-center">
                                    {getRiskBadge(lane.late_rate)}
                                </td>
                                <td className="py-3 px-2 text-center text-slate-300">
                                    {lane.shipments}
                                </td>
                                <td className="py-3 px-2 text-center">
                                    <span className="text-orange-400">+{lane.avg_delay.toFixed(1)}d</span>
                                </td>
                                <td className="py-3 px-2 text-center">
                                    <div className="text-xs">
                                        <span className="text-slate-400">Goal:</span> <span className="text-slate-300">{lane.goal_transit}d</span>
                                        <br />
                                        <span className="text-slate-400">Actual:</span> <span className="text-red-400">{lane.avg_transit.toFixed(1)}d</span>
                                    </div>
                                </td>
                                <td className="py-3 px-2 text-center">
                                    <button 
                                        className="p-1 hover:bg-slate-600 rounded transition-colors"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onLaneSelect && onLaneSelect(lane.lane_id);
                                        }}
                                    >
                                        <ArrowUpRight size={16} className="text-blue-400" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-700 flex items-center justify-between text-xs text-slate-400">
                <span>💡 Click on a lane to analyze it in detail</span>
                <span>Data from last 6 months • 73,000+ shipments analyzed</span>
            </div>
        </div>
    );
};

export default ProblematicLanesTable;
