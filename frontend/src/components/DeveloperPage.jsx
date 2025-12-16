import React, { useState } from 'react';
import { Code, FileCode, FileText, Braces, Layout, Settings, GitBranch, Database, Cpu } from 'lucide-react';
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
        </div>
    </div>
    );
};

export default DeveloperPage;
