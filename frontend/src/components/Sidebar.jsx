import React from 'react';
import { LayoutDashboard, Truck, Package, Settings, BarChart2, Zap, Search, MapPin, Calendar, MessageSquare, Plus, ChevronLeft, ChevronRight, Code } from 'lucide-react';
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
    setActiveView,
    isMinimized,
    setIsMinimized,
    onNewChat,
    showAgentDashboard,
    onToggleAgentDashboard
}) => {
    const handleAnalyze = () => {
        if (onAnalyze) {
            onAnalyze();
        }
    };

    return (
        <div className={`${isMinimized ? 'w-20' : 'w-80'} bg-midnight-900/80 backdrop-blur-xl border-r border-white/5 flex flex-col h-screen relative z-10 transition-all duration-300`}>
            {/* Logo */}
            <div className={`${isMinimized ? 'p-4' : 'p-8'} border-b border-white/5`}>
                <div className={`flex items-center ${isMinimized ? 'flex-col gap-3' : 'gap-3'} text-white font-bold text-2xl tracking-tight`}>
                    <div className={`${isMinimized ? 'w-14 h-14' : 'w-12 h-12'} rounded-xl bg-gradient-to-br from-primary-500 to-accent-purple flex items-center justify-center shadow-lg shadow-primary-500/20`}>
                        <Truck className={`${isMinimized ? 'w-8 h-8' : 'w-7 h-7'} text-white`} />
                    </div>
                    {isMinimized ? (
                        /* Minimized: Button under logo */
                        <button
                            onClick={() => setIsMinimized(!isMinimized)}
                            className="w-8 h-8 bg-midnight-950/50 border border-white/10 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-primary-500/20 transition-all"
                        >
                            <ChevronRight size={16} />
                        </button>
                    ) : (
                        /* Expanded: Button next to text */
                        <>
                            <div className="flex-1">
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">DeliveryIQ</span>
                                <div className="text-xs font-medium text-primary-400">AI-Powered Advisor</div>
                            </div>
                            <button
                                onClick={() => setIsMinimized(!isMinimized)}
                                className="w-8 h-8 bg-midnight-950/50 border border-white/10 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-primary-500/20 transition-all"
                            >
                                <ChevronLeft size={16} />
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Shipment Analysis Form / AI Assistant Toggle */}
            <div className={`${isMinimized ? 'p-2' : 'p-4'} border-b border-slate-700`}>
                {isMinimized ? (
                    /* Minimized: Icon-only toggle */
                    <div className="flex flex-col gap-2">
                        <button
                            onClick={() => activeView !== 'chat' ? null : setActiveView('dashboard')}
                            className={`flex items-center justify-center p-3 rounded-xl transition-all duration-200 ${
                                activeView !== 'chat'
                                    ? 'text-primary-400 bg-primary-500/10 border border-primary-500/20'
                                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                            }`}
                            title="Risk Calculator"
                        >
                            <Search size={20} />
                        </button>
                        <button
                            onClick={() => setActiveView('chat')}
                            className={`flex items-center justify-center p-3 rounded-xl transition-all duration-200 ${
                                activeView === 'chat'
                                    ? 'text-primary-400 bg-primary-500/10 border border-primary-500/20'
                                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                            }`}
                            title="IQ Agent"
                        >
                            <MessageSquare size={20} />
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Toggle Slider */}
                        <div className="flex gap-2 mt-1 mb-2">
                            <button
                                onClick={() => activeView !== 'chat' ? null : setActiveView('dashboard')}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                                    activeView !== 'chat'
                                        ? 'text-primary-400 bg-primary-500/10 border border-primary-500/20 shadow-lg shadow-primary-500/5'
                                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
                                }`}
                            >
                                <Search size={18} />
                                <span>Risk Calculator</span>
                            </button>
                            <button
                                onClick={() => setActiveView('chat')}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                                    activeView === 'chat'
                                        ? 'text-primary-400 bg-primary-500/10 border border-primary-500/20 shadow-lg shadow-primary-500/5'
                                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
                                }`}
                            >
                                <MessageSquare size={18} />
                                <span>IQ Agent</span>
                            </button>
                        </div>

                        {/* Risk Calculator Form - only show when not in chat view */}
                        {activeView !== 'chat' && (<div className="space-y-3">
                            {/* Lane Selection */}
                            <div className="space-y-1">
                                <label className="text-xs text-slate-400 flex items-center gap-1 mt-4">
                                    <MapPin size={12} />
                                    Select Lane
                                </label>
                                <select
                                    value={selectedLane}
                                    onChange={(e) => setSelectedLane(e.target.value)}
                                    className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-slate-200 focus:outline-none transition-all hover:border-white/20 cursor-pointer"
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
                                    className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-slate-200 focus:outline-none transition-all hover:border-white/20 cursor-pointer"
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
                                    className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-slate-200 focus:outline-none transition-all hover:border-white/20 cursor-pointer"
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
                        </div>)}
                    </>
                )}
            </div>

            {/* Navigation */}
            <div className={`flex-1 ${isMinimized ? 'px-2' : 'px-4'} py-4 overflow-y-auto`}>
                {isMinimized ? (
                    /* Minimized Navigation */
                    <nav className="space-y-1">
                        {activeView === 'chat' ? (
                            <>
                                <button
                                    onClick={onToggleAgentDashboard}
                                    className="w-full flex items-center justify-center p-3 rounded-xl transition-all duration-200 text-slate-400 hover:text-slate-200 hover:bg-white/5"
                                    title={showAgentDashboard ? "Hide Dashboard" : "Show Dashboard"}
                                >
                                    <BarChart2 size={20} />
                                </button>
                                <button
                                    onClick={onNewChat}
                                    className="w-full flex items-center justify-center p-3 rounded-xl transition-all duration-200 text-slate-400 hover:text-slate-200 hover:bg-white/5"
                                    title="New Chat"
                                >
                                    <Plus size={20} />
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={() => setActiveView('dashboard')}
                                    className={`w-full flex items-center justify-center p-3 rounded-xl transition-all duration-200 ${activeView === 'dashboard'
                                            ? 'text-primary-400 bg-primary-500/10 border border-primary-500/20'
                                            : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                                        }`}
                                    title="Risk Analysis"
                                >
                                    <LayoutDashboard size={20} />
                                </button>
                                <button
                                    onClick={() => setActiveView('lanes')}
                                    className={`w-full flex items-center justify-center p-3 rounded-xl transition-all duration-200 ${activeView === 'lanes'
                                            ? 'text-primary-400 bg-primary-500/10 border border-primary-500/20'
                                            : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                                        }`}
                                    title="Problematic Lanes"
                                >
                                    <Package size={20} />
                                </button>
                                <button
                                    onClick={() => setActiveView('analytics')}
                                    className={`w-full flex items-center justify-center p-3 rounded-xl transition-all duration-200 ${activeView === 'analytics'
                                            ? 'text-primary-400 bg-primary-500/10 border border-primary-500/20'
                                            : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                                        }`}
                                    title="Analytics"
                                >
                                    <BarChart2 size={20} />
                                </button>
                                <button
                                    onClick={() => setActiveView('developer')}
                                    className={`w-full flex items-center justify-center p-3 rounded-xl transition-all duration-200 ${activeView === 'developer'
                                            ? 'text-primary-400 bg-primary-500/10 border border-primary-500/20'
                                            : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                                        }`}
                                    title="Developer"
                                >
                                    <Code size={20} />
                                </button>
                            </>
                        )}
                    </nav>
                ) : (
                    <>
                        {activeView === 'chat' ? (
                            <>
                                <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Chat</div>
                                <nav className="space-y-1">
                                    <button
                                        onClick={onToggleAgentDashboard}
                                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-slate-400 hover:text-slate-200 hover:bg-white/5"
                                    >
                                        <BarChart2 size={20} />
                                        <span>{showAgentDashboard ? 'Hide Dashboard' : 'Show Dashboard'}</span>
                                    </button>
                                    <button
                                        onClick={onNewChat}
                                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-slate-400 hover:text-slate-200 hover:bg-white/5"
                                    >
                                        <Plus size={20} />
                                        <span>New Chat</span>
                                    </button>
                                </nav>
                            </>
                        ) : (
                            <>
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
                                    <button
                                        onClick={() => setActiveView('developer')}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${activeView === 'developer'
                                                ? 'text-primary-400 bg-primary-500/10 border border-primary-500/20 shadow-lg shadow-primary-500/5'
                                                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                                            }`}
                                    >
                                        <Code size={20} />
                                        <span>Developer</span>
                                    </button>
                                </nav>
                            </>
                        )}
                    </>
                )}

            </div>

            {/* User Profile */}
            <div className={`${isMinimized ? 'p-2' : 'p-4'} border-t border-slate-700`}>
                <div className={`flex items-center ${isMinimized ? 'justify-center' : 'gap-3'}`}>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                        AP
                    </div>
                    {!isMinimized && (
                        <>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-white">Admin User</p>
                                <p className="text-xs text-slate-400">Glacier Team</p>
                            </div>
                            <button className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
                                <Settings size={18} className="text-slate-400" />
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
