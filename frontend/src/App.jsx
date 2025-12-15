import React, { useState, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ProblematicLanesTable from './components/ProblematicLanesTable';
import HelpModal from './components/HelpModal';
import ChatInterface from './components/ChatInterface';
import { generateRiskAnalysis, problematicLanes, carrierComparison, transitProbability, similarShipments, historicalPerformance } from './data/mockData';

function App() {
    // State for filters
    const [selectedLane, setSelectedLane] = useState('');
    const [selectedCarrier, setSelectedCarrier] = useState('');
    const [shipDate, setShipDate] = useState(new Date().toISOString().split('T')[0]);

    // State for analysis
    const [analysisResult, setAnalysisResult] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [hasAnalyzed, setHasAnalyzed] = useState(false);

    // State for navigation
    const [activeView, setActiveView] = useState('dashboard');

    // State for help modal
    const [showHelp, setShowHelp] = useState(false);

    // State for sidebar
    const [sidebarMinimized, setSidebarMinimized] = useState(false);

    // State for chat reset (incrementing key forces ChatInterface to remount)
    const [chatResetKey, setChatResetKey] = useState(0);

    // State for agent dashboard visibility
    const [showAgentDashboard, setShowAgentDashboard] = useState(true);

    // Handle new chat - clears localStorage and remounts ChatInterface
    const handleNewChat = useCallback(() => {
        localStorage.removeItem('deliveryiq_thread_id');
        localStorage.removeItem('deliveryiq_result');
        localStorage.removeItem('deliveryiq_messages');
        localStorage.removeItem('deliveryiq_is_first');
        setChatResetKey(prev => prev + 1);
    }, []);

    // Toggle agent dashboard
    const toggleAgentDashboard = useCallback(() => {
        setShowAgentDashboard(prev => !prev);
    }, []);

    // Handle analyze button click
    const handleAnalyze = useCallback(() => {
        if (!selectedLane || !selectedCarrier) return;

        setIsAnalyzing(true);

        // Simulate API call delay
        setTimeout(() => {
            const result = generateRiskAnalysis(selectedLane, selectedCarrier, shipDate);
            setAnalysisResult(result);
            setIsAnalyzing(false);
            setHasAnalyzed(true);
            setActiveView('dashboard');
        }, 800);
    }, [selectedLane, selectedCarrier, shipDate]);

    // Handle lane selection from problematic lanes table
    const handleLaneSelect = useCallback((laneId) => {
        setSelectedLane(laneId);
        setActiveView('dashboard');
    }, []);

    // Handle carrier selection
    const handleCarrierSelect = useCallback((carrierId) => {
        setSelectedCarrier(carrierId);
    }, []);

    return (
        <div className="flex h-screen bg-midnight-950 text-slate-100 font-sans antialiased overflow-hidden selection:bg-primary-500/30">
            {/* Help Modal */}
            <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />

            {/* Floating Help Button - hidden on chat view */}
            {activeView !== 'chat' && (
                <button
                    onClick={() => setShowHelp(true)}
                    className="fixed bottom-8 right-8 z-40 w-14 h-14 bg-gradient-to-r from-primary-500 to-accent-purple hover:from-primary-400 hover:to-accent-purple/90 rounded-full shadow-lg shadow-primary-500/25 flex items-center justify-center text-white transition-all hover:scale-110 hover:-translate-y-1 border border-white/20 animate-float"
                    title="Help - Click for guide"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                        <path d="M12 17h.01"></path>
                    </svg>
                </button>
            )}

            <Sidebar
                selectedLane={selectedLane}
                setSelectedLane={setSelectedLane}
                selectedCarrier={selectedCarrier}
                setSelectedCarrier={setSelectedCarrier}
                shipDate={shipDate}
                setShipDate={setShipDate}
                onAnalyze={handleAnalyze}
                isAnalyzing={isAnalyzing}
                activeView={activeView}
                setActiveView={setActiveView}
                isMinimized={sidebarMinimized}
                setIsMinimized={setSidebarMinimized}
                onNewChat={handleNewChat}
                showAgentDashboard={showAgentDashboard}
                onToggleAgentDashboard={toggleAgentDashboard}
            />

            <main className="flex-1 flex flex-col overflow-hidden relative">
                {activeView === 'dashboard' && (
                    <Dashboard
                        analysisResult={analysisResult}
                        hasAnalyzed={hasAnalyzed}
                        carrierComparison={carrierComparison}
                        transitProbability={transitProbability}
                        similarShipments={similarShipments}
                        historicalPerformance={historicalPerformance}
                        onCarrierSelect={handleCarrierSelect}
                        selectedCarrier={selectedCarrier}
                    />
                )}

                {activeView === 'lanes' && (
                    <div className="p-8 overflow-y-auto h-full">
                        <header className="mb-6">
                            <h1 className="text-2xl font-bold text-white mb-2">Problematic Lanes</h1>
                            <p className="text-slate-400">
                                Top lanes with highest late delivery rates. Click on a lane to analyze it in detail.
                            </p>
                        </header>
                        <ProblematicLanesTable
                            lanes={problematicLanes}
                            onLaneSelect={handleLaneSelect}
                        />
                    </div>
                )}

                {activeView === 'chat' && (
                    <ChatInterface key={chatResetKey} showDashboard={showAgentDashboard} />
                )}

                {activeView === 'analytics' && (
                    <div className="p-8 overflow-y-auto h-full">
                        <header className="mb-6">
                            <h1 className="text-2xl font-bold text-white mb-2">Analytics Overview</h1>
                            <p className="text-slate-400">
                                Performance metrics and trends across all lanes and carriers.
                            </p>
                        </header>

                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                            <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-xl p-6">
                                <div className="text-3xl font-bold text-white mb-1">73,000+</div>
                                <div className="text-sm text-slate-400">Total Shipments</div>
                            </div>
                            <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-xl p-6">
                                <div className="text-3xl font-bold text-red-400 mb-1">19.2%</div>
                                <div className="text-sm text-slate-400">Late Delivery Rate</div>
                            </div>
                            <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-xl p-6">
                                <div className="text-3xl font-bold text-white mb-1">970</div>
                                <div className="text-sm text-slate-400">Unique Lanes</div>
                            </div>
                            <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-xl p-6">
                                <div className="text-3xl font-bold text-white mb-1">117</div>
                                <div className="text-sm text-slate-400">Active Carriers</div>
                            </div>
                        </div>

                        {/* Historical Trend */}
                        <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-xl p-6">
                            <h3 className="text-lg font-semibold text-slate-100 mb-4">Monthly Performance Trend</h3>
                            <div className="grid grid-cols-6 gap-4">
                                {historicalPerformance.map((month) => (
                                    <div key={month.month} className="text-center">
                                        <div className="mb-2">
                                            <div
                                                className={`mx-auto w-12 rounded-t-lg ${month.on_time >= 80 ? 'bg-green-500' :
                                                    month.on_time >= 75 ? 'bg-yellow-500' : 'bg-red-500'
                                                    }`}
                                                style={{ height: `${month.on_time * 1.5}px` }}
                                            />
                                        </div>
                                        <div className="text-sm font-semibold text-slate-200">{month.on_time}%</div>
                                        <div className="text-xs text-slate-400">{month.month}</div>
                                        <div className="text-xs text-slate-500">{month.shipments} ship.</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Key Insights */}
                        <div className="mt-6 bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-xl p-6">
                            <h3 className="text-lg font-semibold text-slate-100 mb-4">Key Insights</h3>
                            <div className="space-y-3">
                                <div className="flex items-start gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                                    <span className="text-red-400">🔴</span>
                                    <p className="text-sm text-slate-300">
                                        <strong className="text-red-400">45 lanes</strong> have late rates above 50% and need immediate SLA review.
                                    </p>
                                </div>
                                <div className="flex items-start gap-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                                    <span className="text-yellow-400">🟡</span>
                                    <p className="text-sm text-slate-300">
                                        <strong className="text-yellow-400">December</strong> shows a declining on-time trend - likely due to holiday volume.
                                    </p>
                                </div>
                                <div className="flex items-start gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                                    <span className="text-green-400">🟢</span>
                                    <p className="text-sm text-slate-300">
                                        <strong className="text-green-400">SpeedLine Transport</strong> has the best overall performance with 92% on-time rate.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export default App;
