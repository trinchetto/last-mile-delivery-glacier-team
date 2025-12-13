import React from 'react';
import { X, HelpCircle, Zap, Package, BarChart2, Target, Truck, AlertTriangle, Clock, TrendingUp, CheckCircle } from 'lucide-react';

const HelpModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />
            
            {/* Modal */}
            <div className="relative bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden mx-4">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-700 bg-gradient-to-r from-blue-500/10 to-purple-500/10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                            <HelpCircle className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">DeliveryIQ Help Guide</h2>
                            <p className="text-sm text-slate-400">Learn how to use the AI-Powered Delivery Advisor</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        <X size={20} className="text-slate-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(85vh-180px)]">
                    {/* Quick Start */}
                    <section className="mb-8">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <Zap size={20} className="text-yellow-400" />
                            Quick Start Guide
                        </h3>
                        <div className="space-y-3">
                            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-700/30 border border-slate-600/50">
                                <span className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold">1</span>
                                <div>
                                    <p className="text-sm font-medium text-slate-200">Select a Lane</p>
                                    <p className="text-xs text-slate-400">Choose origin → destination from the dropdown</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-700/30 border border-slate-600/50">
                                <span className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold">2</span>
                                <div>
                                    <p className="text-sm font-medium text-slate-200">Select a Carrier</p>
                                    <p className="text-xs text-slate-400">Pick the carrier you plan to use</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-700/30 border border-slate-600/50">
                                <span className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold">3</span>
                                <div>
                                    <p className="text-sm font-medium text-slate-200">Click "Analyze Risk"</p>
                                    <p className="text-xs text-slate-400">Get instant AI-powered predictions</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Risk Levels */}
                    <section className="mb-8">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <AlertTriangle size={20} className="text-orange-400" />
                            Understanding Risk Levels
                        </h3>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30 text-center">
                                <div className="text-2xl mb-2">🟢</div>
                                <div className="text-sm font-semibold text-green-400">Low Risk</div>
                                <div className="text-xs text-slate-400 mt-1">&lt;30% late probability</div>
                                <p className="text-xs text-slate-500 mt-2">Safe to ship with tight delivery window</p>
                            </div>
                            <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-center">
                                <div className="text-2xl mb-2">🟡</div>
                                <div className="text-sm font-semibold text-yellow-400">Medium Risk</div>
                                <div className="text-xs text-slate-400 mt-1">30-70% late probability</div>
                                <p className="text-xs text-slate-500 mt-2">Monitor closely, provide wider window</p>
                            </div>
                            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-center">
                                <div className="text-2xl mb-2">🔴</div>
                                <div className="text-sm font-semibold text-red-400">High Risk</div>
                                <div className="text-xs text-slate-400 mt-1">&gt;70% late probability</div>
                                <p className="text-xs text-slate-500 mt-2">Notify customer, consider alternatives</p>
                            </div>
                        </div>
                    </section>

                    {/* Features */}
                    <section className="mb-8">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <Package size={20} className="text-blue-400" />
                            Features Overview
                        </h3>
                        <div className="space-y-3">
                            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-700/30 border border-slate-600/50">
                                <Target className="w-5 h-5 text-orange-400 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-slate-200">Risk Score Gauge</p>
                                    <p className="text-xs text-slate-400">AI-calculated probability of late delivery based on ML model, lane history, and carrier performance</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-700/30 border border-slate-600/50">
                                <Clock className="w-5 h-5 text-blue-400 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-slate-200">Delivery Window</p>
                                    <p className="text-xs text-slate-400">Recommended delivery timeframe adjusted for risk level (tight, moderate, or wide)</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-700/30 border border-slate-600/50">
                                <TrendingUp className="w-5 h-5 text-green-400 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-slate-200">SLA Comparison</p>
                                    <p className="text-xs text-slate-400">Compare your SLA promise against actual expected transit time</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-700/30 border border-slate-600/50">
                                <BarChart2 className="w-5 h-5 text-purple-400 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-slate-200">Probability Distribution</p>
                                    <p className="text-xs text-slate-400">See probability of delivery in 1, 2, 3+ days with percentile breakdowns</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-700/30 border border-slate-600/50">
                                <Truck className="w-5 h-5 text-cyan-400 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-slate-200">Carrier Comparison</p>
                                    <p className="text-xs text-slate-400">Compare carrier performance on the selected lane with recommendations</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Navigation */}
                    <section className="mb-8">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <BarChart2 size={20} className="text-purple-400" />
                            Navigation Views
                        </h3>
                        <div className="space-y-2">
                            <div className="flex items-center gap-3 p-2">
                                <span className="text-blue-400 font-medium text-sm w-32">Risk Analysis</span>
                                <span className="text-xs text-slate-400">Main dashboard with full shipment analysis</span>
                            </div>
                            <div className="flex items-center gap-3 p-2">
                                <span className="text-blue-400 font-medium text-sm w-32">Problematic Lanes</span>
                                <span className="text-xs text-slate-400">Top 10 lanes with highest late rates</span>
                            </div>
                            <div className="flex items-center gap-3 p-2">
                                <span className="text-blue-400 font-medium text-sm w-32">Analytics</span>
                                <span className="text-xs text-slate-400">Overall performance metrics and trends</span>
                            </div>
                        </div>
                    </section>

                    {/* Tips */}
                    <section>
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <CheckCircle size={20} className="text-green-400" />
                            Pro Tips
                        </h3>
                        <div className="space-y-2 text-sm text-slate-300">
                            <p className="flex items-start gap-2">
                                <span className="text-green-400">💡</span>
                                Click on lanes in the Problematic Lanes table to quickly analyze them
                            </p>
                            <p className="flex items-start gap-2">
                                <span className="text-green-400">💡</span>
                                Use the recommended carrier when high-risk lanes show better alternatives
                            </p>
                            <p className="flex items-start gap-2">
                                <span className="text-green-400">💡</span>
                                Check the SLA comparison before promising delivery dates to customers
                            </p>
                            <p className="flex items-start gap-2">
                                <span className="text-green-400">💡</span>
                                Review similar historical shipments to understand past performance patterns
                            </p>
                        </div>
                    </section>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-700 bg-slate-800/50">
                    <div className="flex items-center justify-between">
                        <p className="text-xs text-slate-500">
                            DeliveryIQ • Powered by 73,000+ historical shipments
                        </p>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                            Got it!
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HelpModal;
