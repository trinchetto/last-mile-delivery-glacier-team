import { useState, useEffect, useRef, useCallback } from 'react'
import {
  AlertTriangle, Truck, Clock, TrendingUp, MapPin, Calendar, Package,
  Star, ChevronRight, BarChart3, PieChart as PieChartIcon, List, Table2,
  Loader2
} from 'lucide-react'
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  Tooltip, LineChart, Line, CartesianGrid, Legend
} from 'recharts'

/**
 * Agent Dashboard - Renders dynamic visualizations from the Analytical Agent
 * Supports: pie_chart, bar_chart, line_chart, gauge_chart, ranked_list,
 * comparison_table, metric_card, metric_group, delivery_timeline, risk_breakdown
 */
const AgentDashboard = ({ analysisResult, isAnalyticalWorking = false }) => {
  const [visualizations, setVisualizations] = useState([])
  const [width, setWidth] = useState(420)
  const isResizing = useRef(false)
  const startX = useRef(0)
  const startWidth = useRef(0)

  // Extract visualizations from analysis result
  useEffect(() => {
    if (analysisResult?.visualizations) {
      setVisualizations(analysisResult.visualizations)
    }
  }, [analysisResult])

  // Handle resize drag
  const handleMouseDown = useCallback((e) => {
    isResizing.current = true
    startX.current = e.clientX
    startWidth.current = width
    document.body.style.cursor = 'ew-resize'
    document.body.style.userSelect = 'none'
  }, [width])

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing.current) return
      const delta = startX.current - e.clientX
      const newWidth = Math.min(800, Math.max(320, startWidth.current + delta))
      setWidth(newWidth)
    }

    const handleMouseUp = () => {
      isResizing.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [])

  // Empty state (but not when analytical agent is working)
  if (!isAnalyticalWorking && (!analysisResult || (!visualizations.length && !analysisResult.risk_score))) {
    return (
      <div
        className="border-l border-slate-700/50 bg-midnight-900/80 backdrop-blur-xl flex flex-col flex-shrink-0 relative"
        style={{ width: `${width}px` }}
      >
        {/* Resize handle */}
        <div
          className="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-primary-500/50 transition-colors z-20"
          onMouseDown={handleMouseDown}
        />
        <div className="px-4 py-3 border-b border-slate-700/50 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary-400" />
          <span className="font-semibold text-white text-sm">Analytics Dashboard</span>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center text-slate-500">
            <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Ask to "show" or "visualize" data to see charts here</p>
            <p className="text-xs mt-2 text-slate-600">Try: "Show me the best carriers"</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="border-l border-slate-700/50 bg-midnight-900/80 backdrop-blur-xl flex flex-col flex-shrink-0 relative"
      style={{ width: `${width}px` }}
    >
      {/* Resize handle */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-primary-500/50 transition-colors z-20"
        onMouseDown={handleMouseDown}
      />
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-700/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary-400" />
          <span className="font-semibold text-white text-sm">Analytics Dashboard</span>
          {/* Inline spinner when updating existing visualizations */}
          {isAnalyticalWorking && visualizations.length > 0 && (
            <>
              <Loader2 className="w-4 h-4 text-primary-400 animate-spin" />
              <span className="text-xs text-slate-400">Gathering new...</span>
            </>
          )}
        </div>
        {visualizations.length > 0 && (
          <span className="text-xs text-slate-500">{visualizations.length} charts</span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 p-4 overflow-y-auto hide-scrollbar space-y-4 relative">
        {/* Loading overlay only when analytical agent is working AND no existing visualizations */}
        {isAnalyticalWorking && visualizations.length === 0 && (
          <div className="absolute inset-0 bg-midnight-900/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
            <Loader2 className="w-8 h-8 text-primary-400 animate-spin mb-3" />
            <span className="text-sm text-slate-300 font-medium">Creating visualizations...</span>
            <span className="text-xs text-slate-500 mt-1">Analytical Agent working</span>
          </div>
        )}

        {/* Render dynamic visualizations */}
        {visualizations.map((viz, index) => (
          <VisualizationRenderer key={index} visualization={viz} />
        ))}

        {/* Fallback: render legacy static components if no visualizations but has legacy data */}
        {!visualizations.length && analysisResult?.risk_score !== undefined && (
          <LegacyRiskCard score={analysisResult.risk_score} />
        )}
      </div>
    </div>
  )
}

/**
 * Main visualization renderer - routes to specific components based on type
 */
const VisualizationRenderer = ({ visualization }) => {
  const { type } = visualization

  switch (type) {
    case 'pie_chart':
      return <PieChartViz {...visualization} />
    case 'bar_chart':
      return <BarChartViz {...visualization} />
    case 'line_chart':
      return <LineChartViz {...visualization} />
    case 'gauge_chart':
      return <GaugeChartViz {...visualization} />
    case 'ranked_list':
      return <RankedListViz {...visualization} />
    case 'comparison_table':
      return <ComparisonTableViz {...visualization} />
    case 'metric_card':
      return <MetricCardViz {...visualization} />
    case 'metric_group':
      return <MetricGroupViz {...visualization} />
    case 'delivery_timeline':
      return <DeliveryTimelineViz {...visualization} />
    case 'risk_breakdown':
      return <RiskBreakdownViz {...visualization} />
    default:
      return null
  }
}

// =============================================================================
// CHART VISUALIZATIONS
// =============================================================================

const COLORS = ['#22c55e', '#3b82f6', '#a855f7', '#eab308', '#ef4444', '#06b6d4']

const PieChartViz = ({ title, data, description }) => (
  <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
    <div className="flex items-center gap-2 mb-1">
      <PieChartIcon className="w-4 h-4 text-purple-400" />
      <span className="text-xs font-semibold text-slate-400 uppercase">{title}</span>
    </div>
      {/* Legend */}
    <div className="flex flex-wrap gap-2 mt-2">
      {data.slice(0, 4).map((item, idx) => (
        <div key={idx} className="flex items-center gap-1 text-xs">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: item.color || COLORS[idx % COLORS.length] }}
          />
          <span className="text-slate-400">{item.name}</span>
        </div>
      ))}
    </div>
    <div className="h-60">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            dataKey="value"
            stroke="none"
            paddingAngle={3}
            minAngle={2}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', fontSize: 12 }}
            formatter={(value, name) => [value, name]}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
    {description && <p className="text-xs text-slate-500 mt-1">{description}</p>}
  </div>
)

const BarChartViz = ({ title, data, x_label, y_label, description, orientation }) => {
  const isHorizontal = orientation === 'horizontal'

  return (
    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 className="w-4 h-4 text-blue-400" />
        <span className="text-xs font-semibold text-slate-400 uppercase">{title}</span>
      </div>
      <div className="h-36">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout={isHorizontal ? 'vertical' : 'horizontal'}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            {isHorizontal ? (
              <>
                <XAxis type="number" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" stroke="#94a3b8" width={60} tick={{ fontSize: 10 }} />
              </>
            ) : (
              <>
                <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} />
              </>
            )}
            <Tooltip
              contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', fontSize: 12 }}
            />
            <Bar dataKey="value" radius={isHorizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      {description && <p className="text-xs text-slate-500 mt-2">{description}</p>}
    </div>
  )
}

const LineChartViz = ({ title, data, x_label, y_label, description }) => (
  <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
    <div className="flex items-center gap-2 mb-3">
      <TrendingUp className="w-4 h-4 text-green-400" />
      <span className="text-xs font-semibold text-slate-400 uppercase">{title}</span>
    </div>
    <div className="h-36">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="x" stroke="#94a3b8" tick={{ fontSize: 10 }} />
          <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', fontSize: 12 }}
          />
          <Line
            type="monotone"
            dataKey="y"
            stroke="#22c55e"
            strokeWidth={2}
            dot={{ r: 3, fill: '#1e293b', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
    {description && <p className="text-xs text-slate-500 mt-2">{description}</p>}
  </div>
)

const GaugeChartViz = ({ title, value, max_value, thresholds, description }) => {
  const percentage = Math.min(100, (value / max_value) * 100)
  const color = percentage >= thresholds.green ? 'green' :
                percentage >= thresholds.yellow ? 'yellow' : 'red'

  const colors = {
    green: { text: 'text-green-400', fill: '#22c55e' },
    yellow: { text: 'text-yellow-400', fill: '#eab308' },
    red: { text: 'text-red-400', fill: '#ef4444' }
  }[color]

  const gaugeData = [
    { value: percentage },
    { value: 100 - percentage }
  ]

  return (
    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className={`w-4 h-4 ${colors.text}`} />
        <span className="text-xs font-semibold text-slate-400 uppercase">{title}</span>
      </div>
      <div className="flex items-center gap-4">
        <div className="w-20 h-20">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={gaugeData}
                cx="50%"
                cy="50%"
                innerRadius={25}
                outerRadius={35}
                startAngle={180}
                endAngle={0}
                dataKey="value"
                stroke="none"
              >
                <Cell fill={colors.fill} />
                <Cell fill="#1e293b" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div>
          <div className="text-2xl font-bold text-white">{Math.round(value)}</div>
          <div className={`text-sm ${colors.text}`}>
            {color === 'green' ? 'Good' : color === 'yellow' ? 'Moderate' : 'High Risk'}
          </div>
        </div>
      </div>
      {description && <p className="text-xs text-slate-500 mt-2">{description}</p>}
    </div>
  )
}

// =============================================================================
// LIST AND TABLE VISUALIZATIONS
// =============================================================================

const RankedListViz = ({ title, items, description, show_rank }) => (
  <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
    <div className="flex items-center gap-2 mb-3">
      <List className="w-4 h-4 text-primary-400" />
      <span className="text-xs font-semibold text-slate-400 uppercase">{title}</span>
    </div>
    <div className="space-y-2">
      {items.slice(0, 5).map((item, idx) => (
        <div
          key={idx}
          className={`p-2.5 rounded-lg border ${
            idx === 0 ? 'bg-green-500/10 border-green-500/30' : 'bg-slate-700/30 border-slate-600/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {show_rank && (
                <span className={`text-xs font-bold ${idx === 0 ? 'text-green-400' : 'text-slate-500'}`}>
                  #{idx + 1}
                </span>
              )}
              <div>
                <div className="text-sm font-medium text-white">{item.name}</div>
                {item.subtitle && <div className="text-xs text-slate-500">{item.subtitle}</div>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {item.value && (
                <span className={`text-sm font-semibold ${idx === 0 ? 'text-green-400' : 'text-slate-300'}`}>
                  {item.value}
                </span>
              )}
              {item.badge && (
                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
    {description && <p className="text-xs text-slate-500 mt-3">{description}</p>}
  </div>
)

const ComparisonTableViz = ({ title, columns, rows, description, highlight_best }) => (
  <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
    <div className="flex items-center gap-2 mb-3">
      <Table2 className="w-4 h-4 text-purple-400" />
      <span className="text-xs font-semibold text-slate-400 uppercase">{title}</span>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-slate-600">
            {columns.map((col, idx) => (
              <th key={idx} className="text-left py-2 px-1 text-slate-400 font-medium">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 5).map((row, rowIdx) => (
            <tr key={rowIdx} className={`border-b border-slate-700/50 ${rowIdx === 0 && highlight_best ? 'bg-green-500/5' : ''}`}>
              {row.map((cell, cellIdx) => (
                <td key={cellIdx} className={`py-2 px-1 ${rowIdx === 0 && highlight_best ? 'text-green-400' : 'text-slate-300'}`}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    {description && <p className="text-xs text-slate-500 mt-3">{description}</p>}
  </div>
)

// =============================================================================
// METRIC VISUALIZATIONS
// =============================================================================

const MetricCardViz = ({ title, value, change, change_type, icon, description }) => {
  const IconComponent = {
    truck: Truck,
    clock: Clock,
    alert: AlertTriangle,
    check: Package,
    trending: TrendingUp,
  }[icon] || TrendingUp

  const changeColor = change_type === 'positive' ? 'text-green-400' :
                      change_type === 'negative' ? 'text-red-400' : 'text-slate-400'

  return (
    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-slate-500 uppercase mb-1">{title}</div>
          <div className="text-2xl font-bold text-white">{value}</div>
          {change && (
            <div className={`text-xs mt-1 ${changeColor}`}>{change}</div>
          )}
        </div>
        <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
          <IconComponent className="w-5 h-5 text-primary-400" />
        </div>
      </div>
      {description && <p className="text-xs text-slate-500 mt-2">{description}</p>}
    </div>
  )
}

const MetricGroupViz = ({ title, metrics, description }) => (
  <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
    <div className="text-xs font-semibold text-slate-400 uppercase mb-3">{title}</div>
    <div className="grid grid-cols-2 gap-2">
      {metrics.slice(0, 4).map((metric, idx) => {
        const IconComponent = {
          truck: Truck,
          clock: Clock,
          alert: AlertTriangle,
          check: Package,
          trending: TrendingUp,
        }[metric.icon] || TrendingUp

        return (
          <div key={idx} className="p-2.5 bg-slate-700/30 rounded-lg">
            <div className="flex items-center gap-1 mb-1">
              <IconComponent className="w-3 h-3 text-slate-500" />
              <span className="text-xs text-slate-500">{metric.title}</span>
            </div>
            <div className="text-lg font-bold text-white">{metric.value}</div>
          </div>
        )
      })}
    </div>
    {description && <p className="text-xs text-slate-500 mt-3">{description}</p>}
  </div>
)

// =============================================================================
// SPECIALIZED VISUALIZATIONS
// =============================================================================

const DeliveryTimelineViz = ({ title, min_days, max_days, expected_days, sla_days, description }) => {
  const maxRange = Math.max(max_days, sla_days || max_days, 7)

  return (
    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
      <div className="flex items-center gap-2 mb-3">
        <Calendar className="w-4 h-4 text-primary-400" />
        <span className="text-xs font-semibold text-slate-400 uppercase">{title}</span>
      </div>

      {/* Transit Days Summary */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="text-center p-2 bg-slate-700/30 rounded-lg">
          <div className="text-lg font-bold text-white">{min_days}</div>
          <div className="text-xs text-slate-500">Min</div>
        </div>
        <div className="text-center p-2 bg-primary-500/20 rounded-lg border border-primary-500/30">
          <div className="text-lg font-bold text-primary-400">{expected_days}</div>
          <div className="text-xs text-slate-500">Expected</div>
        </div>
        <div className="text-center p-2 bg-slate-700/30 rounded-lg">
          <div className="text-lg font-bold text-white">{max_days}</div>
          <div className="text-xs text-slate-500">Max</div>
        </div>
      </div>

      {/* Visual Timeline */}
      <div className="relative h-6 bg-slate-700/50 rounded-full overflow-hidden">
        <div
          className="absolute h-full bg-primary-500/40"
          style={{
            left: `${(min_days / maxRange) * 100}%`,
            width: `${((max_days - min_days + 1) / maxRange) * 100}%`
          }}
        />
        {sla_days && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-yellow-500"
            style={{ left: `${(sla_days / maxRange) * 100}%` }}
          />
        )}
      </div>
      {sla_days && (
        <div className="text-xs text-yellow-400 mt-1">SLA Target: {sla_days} days</div>
      )}

      {description && <p className="text-xs text-slate-500 mt-2">{description}</p>}
    </div>
  )
}

const RiskBreakdownViz = ({ title, overall_score, factors, description }) => {
  const riskLevel = overall_score < 30 ? 'Low' : overall_score < 60 ? 'Medium' : 'High'
  const riskColor = overall_score < 30 ? 'green' : overall_score < 60 ? 'yellow' : 'red'

  const colors = {
    green: { text: 'text-green-400', bg: 'bg-green-500' },
    yellow: { text: 'text-yellow-400', bg: 'bg-yellow-500' },
    red: { text: 'text-red-400', bg: 'bg-red-500' }
  }[riskColor]

  return (
    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className={`w-4 h-4 ${colors.text}`} />
        <span className="text-xs font-semibold text-slate-400 uppercase">{title}</span>
      </div>

      {/* Overall Score */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-3xl font-bold text-white">{Math.round(overall_score)}</div>
          <div className={`text-sm ${colors.text}`}>{riskLevel} Risk</div>
        </div>
        <div className="w-16 h-16 rounded-full border-4 border-slate-700 flex items-center justify-center"
          style={{ borderColor: riskColor === 'green' ? '#22c55e' : riskColor === 'yellow' ? '#eab308' : '#ef4444' }}>
          <span className={`text-lg font-bold ${colors.text}`}>{Math.round(overall_score)}%</span>
        </div>
      </div>

      {/* Risk Factors */}
      <div className="space-y-2">
        {factors.slice(0, 4).map((factor, idx) => {
          const impactColor = factor.impact === 'high' ? 'text-red-400' :
                              factor.impact === 'medium' ? 'text-yellow-400' : 'text-slate-400'
          return (
            <div key={idx} className="flex items-center justify-between text-xs">
              <span className="text-slate-300">{factor.name}</span>
              <div className="flex items-center gap-2">
                <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${factor.impact === 'high' ? 'bg-red-500' : factor.impact === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'}`}
                    style={{ width: `${factor.score}%` }}
                  />
                </div>
                <span className={impactColor}>{factor.score}</span>
              </div>
            </div>
          )
        })}
      </div>

      {description && <p className="text-xs text-slate-500 mt-3">{description}</p>}
    </div>
  )
}

// =============================================================================
// LEGACY FALLBACK (for backwards compatibility)
// =============================================================================

const LegacyRiskCard = ({ score }) => {
  const percentage = Math.round(score * 100)
  const riskLevel = score < 0.3 ? 'Low' : score < 0.7 ? 'Medium' : 'High'
  const riskColor = score < 0.3 ? 'green' : score < 0.7 ? 'yellow' : 'red'

  const colors = {
    green: { text: 'text-green-400', fill: '#22c55e' },
    yellow: { text: 'text-yellow-400', fill: '#eab308' },
    red: { text: 'text-red-400', fill: '#ef4444' }
  }[riskColor]

  const gaugeData = [
    { value: percentage },
    { value: 100 - percentage }
  ]

  return (
    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className={`w-4 h-4 ${colors.text}`} />
        <span className="text-xs font-semibold text-slate-400 uppercase">Delivery Risk</span>
      </div>
      <div className="flex items-center gap-4">
        <div className="w-20 h-20">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={gaugeData}
                cx="50%"
                cy="50%"
                innerRadius={25}
                outerRadius={35}
                startAngle={180}
                endAngle={0}
                dataKey="value"
                stroke="none"
              >
                <Cell fill={colors.fill} />
                <Cell fill="#1e293b" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div>
          <div className="text-3xl font-bold text-white">{percentage}%</div>
          <div className={`text-sm ${colors.text}`}>{riskLevel} Risk</div>
        </div>
      </div>
    </div>
  )
}

export default AgentDashboard
