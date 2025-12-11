import React from 'react';
import { LayoutDashboard, Truck, Package, Settings, BarChart2, Zap, Search, MapPin, Calendar, HelpCircle } from 'lucide-react';
import { lanes, carriers } from '../data/mockData';

const Sidebar = ({
    selectedLane,
    setSelectedLane,
    selectedCarrier,
    setSelectedCarrier,
    shipDate,
    setShipDate,
    onAnalyze,
    isAnalyzing,
    activeView,
    setActiveView
}) => {
    const handleAnalyze = () => {
        if (onAnalyze) {
            onAnalyze();
        }
    };

    return (
        <div className="w-80 bg-midnight-900/80 backdrop-blur-xl border-r border-white/5 flex flex-col h-screen relative z-10">
            {/* Logo */}
            <div className="p-8 border-b border-white/5">
                <div className="flex items-center gap-3 text-white font-bold text-2xl tracking-tight">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-accent-purple flex items-center justify-center shadow-lg shadow-primary-500/20">
                        <Truck className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">DeliveryIQ</span>
                        <div className="text-xs font-medium text-primary-400">AI-Powered Advisor</div>
                    </div>
                </div>
            </div>

            {/* Shipment Analysis Form */}
            <div className="p-4 border-b border-slate-700">
                <div className="flex items-center gap-2 mb-4">
                    <Search size={16} className="text-blue-400" />
                    <span className="text-sm font-semibold text-slate-200">Shipment Risk Calculator</span>
                </div>

                <div className="space-y-3">
                    {/* Lane Selection */}
                    <div className="space-y-1">
                        <label className="text-xs text-slate-400 flex items-center gap-1">
                            <MapPin size={12} />
                            Select Lane
                        </label>
                        <select
                            value={selectedLane}
                            onChange={(e) => setSelectedLane(e.target.value)}
                            className="w-full bg-midnight-950/50 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/50 transition-all hover:border-white/20"
                        >
                            <option value="">Select a lane...</option>
                            {lanes.map((lane) => (
                                <option key={lane.id} value={lane.id}>
                                    {lane.origin_city} → {lane.dest_city}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Carrier Selection */}
                    <div className="space-y-1">
                        <label className="text-xs text-slate-400 flex items-center gap-1">
                            <Truck size={12} />
                            Select Carrier
                        </label>
                        <select
                            value={selectedCarrier}
                            onChange={(e) => setSelectedCarrier(e.target.value)}
                            className="w-full bg-midnight-950/50 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/50 transition-all hover:border-white/20"
                        >
                            <option value="">Select a carrier...</option>
                            {carriers.map((carrier) => (
                                <option key={carrier.id} value={carrier.id}>
                                    {carrier.name} ({carrier.mode})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Ship Date */}
                    <div className="space-y-1">
                        <label className="text-xs text-slate-400 flex items-center gap-1">
                            <Calendar size={12} />
                            Ship Date
                        </label>
                        <input
                            type="date"
                            value={shipDate}
                            onChange={(e) => setShipDate(e.target.value)}
                            className="w-full bg-midnight-950/50 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/50 transition-all hover:border-white/20"
                        />
                    </div>

                    {/* Analyze Button */}
                    <button
                        onClick={handleAnalyze}
                        disabled={!selectedLane || !selectedCarrier || isAnalyzing}
                        className={`w-full py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-300 ${selectedLane && selectedCarrier && !isAnalyzing
                                ? 'bg-gradient-to-r from-primary-600 to-accent-purple hover:from-primary-500 hover:to-accent-purple/90 text-white shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 hover:-translate-y-0.5'
                                : 'bg-slate-800/50 text-slate-500 cursor-not-allowed border border-white/5'
                            }`}
                    >
                        {isAnalyzing ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                Analyzing...
                            </>
                        ) : (
                            <>
                                <Zap size={16} />
                                Analyze Risk
                            </>
                        )}
                    </button>

                    {!selectedLane && (
                        <p className="text-xs text-slate-500 text-center">
                            Select a lane and carrier to analyze
                        </p>
                    )}
                </div>
            </div>

            {/* Navigation */}
            <div className="flex-1 px-4 py-4 overflow-y-auto">
                <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Views</div>
                <nav className="space-y-1">
                    <button
                        onClick={() => setActiveView('dashboard')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${activeView === 'dashboard'
                                ? 'text-primary-400 bg-primary-500/10 border border-primary-500/20 shadow-lg shadow-primary-500/5'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                            }`}
                    >
                        <LayoutDashboard size={20} />
                        <span className="font-medium">Risk Analysis</span>
                    </button>
                    <button
                        onClick={() => setActiveView('lanes')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${activeView === 'lanes'
                                ? 'text-primary-400 bg-primary-500/10 border border-primary-500/20 shadow-lg shadow-primary-500/5'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                            }`}
                    >
                        <Package size={20} />
                        <span>Problematic Lanes</span>
                    </button>
                    <button
                        onClick={() => setActiveView('analytics')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${activeView === 'analytics'
                                ? 'text-primary-400 bg-primary-500/10 border border-primary-500/20 shadow-lg shadow-primary-500/5'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                            }`}
                    >
                        <BarChart2 size={20} />
                        <span>Analytics</span>
                    </button>
                </nav>

                {/* Quick Stats */}
                <div className="mt-6">
                    <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Quick Stats</div>
                    <div className="space-y-2">
                        <div className="p-3 rounded-lg bg-slate-700/30 border border-slate-600/50">
                            <div className="text-2xl font-bold text-white">73K+</div>
                            <div className="text-xs text-slate-400">Shipments Analyzed</div>
                        </div>
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                            <div className="text-2xl font-bold text-red-400">19.2%</div>
                            <div className="text-xs text-slate-400">Overall Late Rate</div>
                        </div>
                        <div className="p-3 rounded-lg bg-slate-700/30 border border-slate-600/50">
                            <div className="text-2xl font-bold text-white">970</div>
                            <div className="text-xs text-slate-400">Unique Lanes</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* User Profile */}
            <div className="p-4 border-t border-slate-700">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                        AP
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-medium text-white">Admin User</p>
                        <p className="text-xs text-slate-400">Glacier Team</p>
                    </div>
                    <button className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
                        <Settings size={18} className="text-slate-400" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
