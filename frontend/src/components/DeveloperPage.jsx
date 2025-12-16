import React, { useState } from 'react';
import { Code, FileCode, FileText, Braces, Layout, Settings, GitBranch, Database, Cpu, Brain, ArrowRight } from 'lucide-react';
import DatasetTable from './DatasetTable';

const DeveloperPage = () => {
    const [activeTab, setActiveTab] = useState('docs');

    // Code statistics (lines of code by file type)
    const codeStats = [
        { type: 'Python', extension: '.py', lines: 5705, color: 'bg-blue-500', icon: FileCode },
        { type: 'JSX', extension: '.jsx', lines: 3990, color: 'bg-cyan-500', icon: Braces },
        { type: 'Markdown', extension: '.md', lines: 889, color: 'bg-slate-400', icon: FileText },
        { type: 'JavaScript', extension: '.js', lines: 690, color: 'bg-yellow-500', icon: Code },
        { type: 'YAML', extension: '.yaml', lines: 441, color: 'bg-purple-500', icon: Settings },
        { type: 'CSS', extension: '.css', lines: 69, color: 'bg-pink-500', icon: Layout },
        { type: 'HTML', extension: '.html', lines: 13, color: 'bg-orange-500', icon: FileText },
    ];

    const totalLines = codeStats.reduce((sum, stat) => sum + stat.lines, 0);

    // If showing dataset, render the DatasetTable component
    if (activeTab === 'dataset') {
        return (
            <div className="h-full flex flex-col overflow-hidden">
                {/* Tab Navigation */}
                <div className="flex-shrink-0 px-8 pt-8 pb-4">
                    <div className="flex gap-2 mb-4">
                        <button
                            onClick={() => setActiveTab('docs')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                activeTab === 'docs'
                                    ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                            }`}
                        >
                            <Code size={16} />
                            Documentation
                        </button>
                        <button
                            onClick={() => setActiveTab('model')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                activeTab === 'model'
                                    ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                            }`}
                        >
                            <Brain size={16} />
                            ML Model
                        </button>
                        <button
                            onClick={() => setActiveTab('dataset')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                activeTab === 'dataset'
                                    ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                            }`}
                        >
                            <Database size={16} />
                            Dataset Explorer
                        </button>
                    </div>
                </div>
                <div className="flex-1 overflow-hidden">
                    <DatasetTable />
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col overflow-hidden">
            {/* Tab Navigation */}
            <div className="flex-shrink-0 px-8 pt-8">
                <div className="flex gap-2 mb-4">
                    <button
                        onClick={() => setActiveTab('docs')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            activeTab === 'docs'
                                ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                        }`}
                    >
                        <Code size={16} />
                        Documentation
                    </button>
                    <button
                        onClick={() => setActiveTab('model')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            activeTab === 'model'
                                ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                        }`}
                    >
                        <Brain size={16} />
                        ML Model
                    </button>
                    <button
                        onClick={() => setActiveTab('dataset')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            activeTab === 'dataset'
                                ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                        }`}
                    >
                        <Database size={16} />
                        Dataset Explorer
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-8 pb-8">
                {activeTab === 'model' ? (
                    <>
                        {/* ML Model Header */}
                        <header className="mb-8">
                            <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
                                <Brain className="text-primary-400" />
                                Prediction Model Documentation
                            </h1>
                            <p className="text-slate-400">
                                XGBoost-based delivery risk prediction model - inputs, processing, and outputs.
                            </p>
                        </header>

                        {/* Model Overview */}
                        <div className="mb-8 bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-xl p-6">
                            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <Brain className="text-primary-400" size={20} />
                                Model Overview
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                                <div className="p-4 bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-lg border border-blue-500/30">
                                    <div className="text-2xl font-bold text-white">XGBoost</div>
                                    <div className="text-sm text-slate-400">Algorithm</div>
                                </div>
                                <div className="p-4 bg-gradient-to-br from-green-500/20 to-green-600/10 rounded-lg border border-green-500/30">
                                    <div className="text-2xl font-bold text-white">~0.85</div>
                                    <div className="text-sm text-slate-400">ROC AUC Score</div>
                                </div>
                                <div className="p-4 bg-gradient-to-br from-purple-500/20 to-purple-600/10 rounded-lg border border-purple-500/30">
                                    <div className="text-2xl font-bold text-white">30</div>
                                    <div className="text-sm text-slate-400">Features</div>
                                </div>
                                <div className="p-4 bg-gradient-to-br from-orange-500/20 to-orange-600/10 rounded-lg border border-orange-500/30">
                                    <div className="text-2xl font-bold text-white">72K+</div>
                                    <div className="text-sm text-slate-400">Training Samples</div>
                                </div>
                            </div>
                        </div>

                        {/* Model Pipeline */}
                        <div className="mb-8 bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-xl p-6">
                            <h2 className="text-lg font-semibold text-white mb-4">Model Pipeline</h2>
                            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                                <div className="flex-1 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg text-center">
                                    <div className="text-lg font-semibold text-blue-400 mb-2">📥 INPUT</div>
                                    <div className="text-xs text-slate-300 space-y-1">
                                        <div>lane_id</div>
                                        <div>carrier_pseudo</div>
                                        <div>carrier_mode</div>
                                        <div>customer_distance</div>
                                        <div>goal_transit_days</div>
                                        <div>ship_date/time</div>
                                    </div>
                                </div>
                                <ArrowRight className="text-slate-500 hidden md:block" size={32} />
                                <div className="flex-1 p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg text-center">
                                    <div className="text-lg font-semibold text-purple-400 mb-2">⚙️ FEATURE ENGINEERING</div>
                                    <div className="text-xs text-slate-300 space-y-1">
                                        <div>Lane historical stats</div>
                                        <div>Carrier historical stats</div>
                                        <div>Carrier-Lane combo stats</div>
                                        <div>Temporal features</div>
                                        <div>Risk indicators</div>
                                    </div>
                                </div>
                                <ArrowRight className="text-slate-500 hidden md:block" size={32} />
                                <div className="flex-1 p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-center">
                                    <div className="text-lg font-semibold text-green-400 mb-2">🧠 XGBOOST</div>
                                    <div className="text-xs text-slate-300 space-y-1">
                                        <div>200 estimators</div>
                                        <div>max_depth: 6</div>
                                        <div>learning_rate: 0.1</div>
                                        <div>Binary classification</div>
                                    </div>
                                </div>
                                <ArrowRight className="text-slate-500 hidden md:block" size={32} />
                                <div className="flex-1 p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg text-center">
                                    <div className="text-lg font-semibold text-orange-400 mb-2">📤 OUTPUT</div>
                                    <div className="text-xs text-slate-300 space-y-1">
                                        <div>risk_score (0-1)</div>
                                        <div>risk_level</div>
                                        <div>confidence</div>
                                        <div>lane_late_rate</div>
                                        <div>carrier_late_rate</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Input Features */}
                        <div className="mb-8 bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-xl p-6">
                            <h2 className="text-lg font-semibold text-white mb-4">Input Features (Raw Data)</h2>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-700">
                                            <th className="text-left py-2 px-3 text-slate-400">Field</th>
                                            <th className="text-left py-2 px-3 text-slate-400">Type</th>
                                            <th className="text-left py-2 px-3 text-slate-400">Example</th>
                                            <th className="text-left py-2 px-3 text-slate-400">Description</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-slate-300">
                                        <tr className="border-b border-slate-700/50"><td className="py-2 px-3 font-mono text-blue-400">lane_id</td><td className="py-2 px-3">string</td><td className="py-2 px-3">"109c918ef6db"</td><td className="py-2 px-3">Origin → Destination identifier</td></tr>
                                        <tr className="border-b border-slate-700/50"><td className="py-2 px-3 font-mono text-blue-400">carrier_pseudo</td><td className="py-2 px-3">string</td><td className="py-2 px-3">"19936bf01cc6"</td><td className="py-2 px-3">Anonymized carrier ID</td></tr>
                                        <tr className="border-b border-slate-700/50"><td className="py-2 px-3 font-mono text-blue-400">carrier_mode</td><td className="py-2 px-3">string</td><td className="py-2 px-3">"Truckload" | "LTL"</td><td className="py-2 px-3">Shipping mode</td></tr>
                                        <tr className="border-b border-slate-700/50"><td className="py-2 px-3 font-mono text-blue-400">customer_distance</td><td className="py-2 px-3">number</td><td className="py-2 px-3">275</td><td className="py-2 px-3">Distance in miles</td></tr>
                                        <tr className="border-b border-slate-700/50"><td className="py-2 px-3 font-mono text-blue-400">distance_bucket</td><td className="py-2 px-3">string</td><td className="py-2 px-3">"250-500"</td><td className="py-2 px-3">Distance category</td></tr>
                                        <tr className="border-b border-slate-700/50"><td className="py-2 px-3 font-mono text-blue-400">goal_transit_days</td><td className="py-2 px-3">number</td><td className="py-2 px-3">1</td><td className="py-2 px-3">Expected transit time</td></tr>
                                        <tr className="border-b border-slate-700/50"><td className="py-2 px-3 font-mono text-blue-400">ship_dow</td><td className="py-2 px-3">number</td><td className="py-2 px-3">0-6</td><td className="py-2 px-3">Day of week (0=Mon)</td></tr>
                                        <tr className="border-b border-slate-700/50"><td className="py-2 px-3 font-mono text-blue-400">ship_month</td><td className="py-2 px-3">number</td><td className="py-2 px-3">1-12</td><td className="py-2 px-3">Month of shipment</td></tr>
                                        <tr><td className="py-2 px-3 font-mono text-blue-400">ship_hour</td><td className="py-2 px-3">number</td><td className="py-2 px-3">0-23</td><td className="py-2 px-3">Hour of shipment</td></tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Engineered Features */}
                        <div className="mb-8 bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-xl p-6">
                            <h2 className="text-lg font-semibold text-white mb-4">Engineered Features</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="p-4 bg-slate-900/50 border border-slate-700 rounded-lg">
                                    <div className="font-semibold text-white mb-2">🛣️ Lane Features</div>
                                    <ul className="text-xs text-slate-400 space-y-1">
                                        <li>• lane_late_rate (historical)</li>
                                        <li>• lane_shipment_count</li>
                                        <li>• lane_avg_transit</li>
                                        <li>• lane_transit_std</li>
                                        <li>• lane_avg_distance</li>
                                        <li>• high_risk_lane (rate {">"} 30%)</li>
                                    </ul>
                                </div>
                                <div className="p-4 bg-slate-900/50 border border-slate-700 rounded-lg">
                                    <div className="font-semibold text-white mb-2">🚚 Carrier Features</div>
                                    <ul className="text-xs text-slate-400 space-y-1">
                                        <li>• carrier_late_rate</li>
                                        <li>• carrier_shipment_count</li>
                                        <li>• carrier_avg_transit</li>
                                        <li>• carrier_transit_std</li>
                                        <li>• is_ltl (mode flag)</li>
                                        <li>• high_risk_carrier</li>
                                    </ul>
                                </div>
                                <div className="p-4 bg-slate-900/50 border border-slate-700 rounded-lg">
                                    <div className="font-semibold text-white mb-2">🔗 Combo & Temporal</div>
                                    <ul className="text-xs text-slate-400 space-y-1">
                                        <li>• carrier_lane_late_rate</li>
                                        <li>• carrier_lane_count</li>
                                        <li>• is_weekend_ship</li>
                                        <li>• is_month_end</li>
                                        <li>• goal_transit_ratio</li>
                                        <li>• distance_per_goal_day</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Output */}
                        <div className="mb-8 bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-xl p-6">
                            <h2 className="text-lg font-semibold text-white mb-4">Model Output</h2>
                            <pre className="bg-slate-900/80 border border-slate-700 rounded-lg p-4 text-sm text-slate-300 overflow-x-auto font-mono">
{`{
  "risk_score": 0.72,         // Probability of late delivery (0-1)
  "risk_level": "HIGH",       // LOW (<0.3), MEDIUM (0.3-0.7), HIGH (>0.7)
  "confidence": 0.85,         // Based on historical data volume
  "lane_late_rate": 0.35,     // Historical lane performance
  "carrier_late_rate": 0.28   // Historical carrier performance
}`}
                            </pre>
                            <div className="mt-4 grid grid-cols-3 gap-3">
                                <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-center">
                                    <div className="text-lg font-bold text-green-400">LOW</div>
                                    <div className="text-xs text-slate-400">risk_score {"<"} 0.30</div>
                                </div>
                                <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-center">
                                    <div className="text-lg font-bold text-yellow-400">MEDIUM</div>
                                    <div className="text-xs text-slate-400">0.30 ≤ score {"<"} 0.70</div>
                                </div>
                                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-center">
                                    <div className="text-lg font-bold text-red-400">HIGH</div>
                                    <div className="text-xs text-slate-400">risk_score ≥ 0.70</div>
                                </div>
                            </div>
                        </div>

                        {/* Top Feature Importances */}
                        <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-xl p-6">
                            <h2 className="text-lg font-semibold text-white mb-4">Top Feature Importances</h2>
                            <div className="space-y-2">
                                {[
                                    { name: 'carrier_lane_late_rate', importance: 0.18, desc: 'Carrier performance on this specific lane' },
                                    { name: 'lane_late_rate', importance: 0.15, desc: 'Historical lane performance' },
                                    { name: 'carrier_late_rate', importance: 0.12, desc: 'Overall carrier performance' },
                                    { name: 'goal_transit_ratio', importance: 0.10, desc: 'How aggressive is the goal' },
                                    { name: 'carrier_lane_avg_transit', importance: 0.08, desc: 'Past transit time on this route' },
                                    { name: 'high_risk_lane', importance: 0.07, desc: 'Binary risk indicator' },
                                ].map((feature) => (
                                    <div key={feature.name} className="flex items-center gap-3">
                                        <div className="w-40 text-xs font-mono text-primary-400">{feature.name}</div>
                                        <div className="flex-1 h-3 bg-slate-700/50 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-gradient-to-r from-primary-500 to-accent-purple rounded-full"
                                                style={{ width: `${feature.importance * 100 * 5}%` }}
                                            />
                                        </div>
                                        <div className="w-12 text-xs text-slate-400 text-right">{(feature.importance * 100).toFixed(0)}%</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                ) : (
                <>
                {/* Header */}
                <header className="mb-8">
                    <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
                        <Code className="text-primary-400" />
                        Developer Documentation
                    </h1>
                    <p className="text-slate-400">
                        Technical overview of the DeliveryIQ architecture and codebase statistics.
                    </p>
                </header>

                {/* Code Statistics Section */}
            <div className="mb-8 bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <GitBranch className="text-primary-400" size={20} />
                    Codebase Statistics
                </h2>
                
                {/* Total Lines */}
                <div className="mb-6 p-4 bg-gradient-to-r from-primary-500/20 to-accent-purple/20 rounded-lg border border-primary-500/30">
                    <div className="text-4xl font-bold text-white">{totalLines.toLocaleString()}</div>
                    <div className="text-sm text-slate-400">Total Lines of Code</div>
                </div>

                {/* Bar Chart */}
                <div className="space-y-3">
                    {codeStats.map((stat) => {
                        const Icon = stat.icon;
                        const percentage = (stat.lines / totalLines) * 100;
                        return (
                            <div key={stat.type} className="group">
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                        <Icon size={16} className="text-slate-400" />
                                        <span className="text-sm font-medium text-slate-200">{stat.type}</span>
                                        <span className="text-xs text-slate-500">{stat.extension}</span>
                                    </div>
                                    <span className="text-sm text-slate-400">
                                        {stat.lines.toLocaleString()} lines ({percentage.toFixed(1)}%)
                                    </span>
                                </div>
                                <div className="h-3 bg-slate-700/50 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full ${stat.color} rounded-full transition-all duration-500 group-hover:brightness-110`}
                                        style={{ width: `${percentage}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Agent Flow Documentation */}
            <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Cpu className="text-primary-400" size={20} />
                    Agent Architecture Flow
                </h2>

                {/* System Architecture */}
                <div className="mb-6">
                    <h3 className="text-md font-semibold text-slate-200 mb-3">System Architecture Overview</h3>
                    <pre className="bg-slate-900/80 border border-slate-700 rounded-lg p-4 text-xs text-slate-300 overflow-x-auto font-mono">
{`┌─────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND (React)                                │
│  ┌─────────────┐    ┌──────────────────┐    ┌─────────────────────────────┐ │
│  │  Chat UI    │───►│   API Service    │───►│   Dashboard Visualizations  │ │
│  │  (Input)    │    │   (WebSocket)    │    │   (Charts/Metrics Output)   │ │
│  └─────────────┘    └────────┬─────────┘    └─────────────────────────────┘ │
└──────────────────────────────┼──────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         BACKEND (LangGraph)                                  │
│                                                                              │
│    ┌──────────────────────────────────────────────────────────────────┐     │
│    │                      State Management                             │     │
│    │  • user_query          • chat_history      • visualizations      │     │
│    │  • visualization_request  • analytical_summary                   │     │
│    └──────────────────────────────────────────────────────────────────┘     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘`}
                    </pre>
                </div>

                {/* Agent Flow Diagram */}
                <div className="mb-6">
                    <h3 className="text-md font-semibold text-slate-200 mb-3">Agent Flow Diagram</h3>
                    <pre className="bg-slate-900/80 border border-slate-700 rounded-lg p-4 text-xs text-slate-300 overflow-x-auto font-mono">
{`                                    START
                                      │
                                      ▼
                              ┌───────────────┐
                              │   CHAT AGENT  │
                              │   (Router)    │
                              └───────┬───────┘
                                      │
                        ┌─────────────┴─────────────┐
                        │     Decision Point        │
                        │  "Does user want data     │
                        │   visualization?"         │
                        └─────────────┬─────────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    │                 │                 │
                    ▼                 ▼                 ▼
            ┌───────────┐     ┌───────────┐     ┌───────────┐
            │  Direct   │     │ Analytics │     │   END     │
            │  Response │     │  Request  │     │ (Goodbye) │
            └─────┬─────┘     └─────┬─────┘     └───────────┘
                  │                 │
                  │                 ▼
                  │         ┌───────────────┐
                  │         │  ANALYTICAL   │
                  │         │    AGENT      │
                  │         │               │
                  │         │ • Query Data  │
                  │         │ • Create Viz  │
                  │         │ • Summarize   │
                  │         └───────┬───────┘
                  │                 │
                  │                 ▼
                  │         ┌───────────────┐
                  │         │  CHAT AGENT   │
                  │         │  (Summarize)  │
                  │         └───────┬───────┘
                  │                 │
                  └────────┬────────┘
                           │
                           ▼
                   ┌───────────────┐
                   │  HUMAN INPUT  │
                   │   (Wait for   │
                   │  next query)  │
                   └───────┬───────┘
                           │
                           └──────────► Back to CHAT AGENT`}
                    </pre>
                </div>

                {/* Agent Descriptions */}
                <div className="mb-6">
                    <h3 className="text-md font-semibold text-slate-200 mb-3">Agent Descriptions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Chat Agent */}
                        <div className="p-4 bg-slate-900/50 border border-slate-700 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-lg">1️⃣</span>
                                <span className="font-semibold text-white">Chat Agent</span>
                            </div>
                            <p className="text-sm text-slate-400 mb-3">Main router & conversational interface</p>
                            <div className="space-y-2 text-xs">
                                <div className="flex justify-between">
                                    <span className="text-green-400">Input:</span>
                                    <span className="text-slate-300">user_query, chat_history</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-blue-400">Output:</span>
                                    <span className="text-slate-300">chat_response, viz_request</span>
                                </div>
                            </div>
                        </div>

                        {/* Analytical Agent */}
                        <div className="p-4 bg-slate-900/50 border border-slate-700 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-lg">2️⃣</span>
                                <span className="font-semibold text-white">Analytical Agent</span>
                            </div>
                            <p className="text-sm text-slate-400 mb-3">Data specialist & visualization creator</p>
                            <div className="space-y-2 text-xs">
                                <div className="flex justify-between">
                                    <span className="text-green-400">Input:</span>
                                    <span className="text-slate-300">viz_request, dataset</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-blue-400">Output:</span>
                                    <span className="text-slate-300">visualizations, summary</span>
                                </div>
                            </div>
                        </div>

                        {/* Human Input */}
                        <div className="p-4 bg-slate-900/50 border border-slate-700 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-lg">3️⃣</span>
                                <span className="font-semibold text-white">Human Input Node</span>
                            </div>
                            <p className="text-sm text-slate-400 mb-3">Interrupt & wait for user input</p>
                            <div className="space-y-2 text-xs">
                                <div className="flex justify-between">
                                    <span className="text-green-400">Input:</span>
                                    <span className="text-slate-300">result, visualizations</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-blue-400">Output:</span>
                                    <span className="text-slate-300">user_message</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Example Flow */}
                <div className="mb-6">
                    <h3 className="text-md font-semibold text-slate-200 mb-3">Example Flow: "Show me late deliveries by carrier"</h3>
                    <div className="space-y-2">
                        <div className="flex items-center gap-3 p-3 bg-slate-900/50 border border-slate-700 rounded-lg">
                            <span className="w-6 h-6 rounded-full bg-primary-500/30 flex items-center justify-center text-xs font-bold text-primary-400">1</span>
                            <span className="text-sm text-slate-300">User sends query via Chat UI</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-slate-900/50 border border-slate-700 rounded-lg">
                            <span className="w-6 h-6 rounded-full bg-primary-500/30 flex items-center justify-center text-xs font-bold text-primary-400">2</span>
                            <span className="text-sm text-slate-300">Chat Agent detects "show me" → routes to Analytical</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-slate-900/50 border border-slate-700 rounded-lg">
                            <span className="w-6 h-6 rounded-full bg-primary-500/30 flex items-center justify-center text-xs font-bold text-primary-400">3</span>
                            <span className="text-sm text-slate-300">Analytical Agent queries 72K+ records, creates bar chart</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-slate-900/50 border border-slate-700 rounded-lg">
                            <span className="w-6 h-6 rounded-full bg-primary-500/30 flex items-center justify-center text-xs font-bold text-primary-400">4</span>
                            <span className="text-sm text-slate-300">Chat Agent summarizes: "Created visualization. Carrier X has highest late rate..."</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-slate-900/50 border border-slate-700 rounded-lg">
                            <span className="w-6 h-6 rounded-full bg-primary-500/30 flex items-center justify-center text-xs font-bold text-primary-400">5</span>
                            <span className="text-sm text-slate-300">Frontend displays chat response + dashboard chart</span>
                        </div>
                    </div>
                </div>

                {/* Tech Stack */}
                <div>
                    <h3 className="text-md font-semibold text-slate-200 mb-3">Technology Stack</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="p-3 bg-slate-900/50 border border-slate-700 rounded-lg text-center">
                            <div className="text-xl mb-1">🦜</div>
                            <div className="text-sm font-medium text-white">LangGraph</div>
                            <div className="text-xs text-slate-500">Agent Framework</div>
                        </div>
                        <div className="p-3 bg-slate-900/50 border border-slate-700 rounded-lg text-center">
                            <div className="text-xl mb-1">⚛️</div>
                            <div className="text-sm font-medium text-white">React + Vite</div>
                            <div className="text-xs text-slate-500">Frontend</div>
                        </div>
                        <div className="p-3 bg-slate-900/50 border border-slate-700 rounded-lg text-center">
                            <div className="text-xl mb-1">🐍</div>
                            <div className="text-sm font-medium text-white">Python</div>
                            <div className="text-xs text-slate-500">Backend</div>
                        </div>
                        <div className="p-3 bg-slate-900/50 border border-slate-700 rounded-lg text-center">
                            <div className="text-xl mb-1">📊</div>
                            <div className="text-sm font-medium text-white">Recharts</div>
                            <div className="text-xs text-slate-500">Visualization</div>
                        </div>
                    </div>
                </div>
            </div>
                </>
                )}
            </div>
        </div>
    );
};

export default DeveloperPage;
