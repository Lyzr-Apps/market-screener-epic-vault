import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { callAIAgent } from '@/utils/aiAgent'
import type { NormalizedAgentResponse } from '@/utils/aiAgent'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Search,
  RefreshCw,
  Loader2,
  ChevronRight,
  X,
  Plus,
  AlertCircle,
  Settings as SettingsIcon,
  BarChart,
  DollarSign,
  Shield,
  Newspaper,
  Cpu
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Agent IDs from the orchestrator
const STOCK_COORDINATOR_ID = "697233d11d92f5e2dd22e545"
const TECHNICAL_ANALYSIS_ID = "697233471d92f5e2dd22e52f"
const FUNDAMENTAL_ANALYSIS_ID = "6972335fd6d0dcaec111be25"
const NEWS_SENTIMENT_ID = "69723379d6d0dcaec111be2f"
const INDUSTRY_TRENDS_ID = "69723391d6d0dcaec111be36"
const RISK_ASSESSMENT_ID = "697233add6d0dcaec111be3a"

// TypeScript Interfaces from actual test responses
interface CoordinatorResult {
  ticker: string
  company_name: string
  conviction_score: number
  overall_recommendation: 'buy' | 'hold' | 'sell'
  alert_triggered: boolean
  analysis_summary: {
    technical_score: number
    fundamental_score: number
    sentiment_score: number
    industry_score: number
    risk_score: number
  }
  key_insights: {
    strengths: string[]
    weaknesses: string[]
    opportunities: string[]
    threats: string[]
  }
  price_target: {
    current_price: number
    target_price: number
    upside_potential: number
  }
  action_items: string[]
  confidence: number
  summary: string
}

interface TechnicalResult {
  technical_score: number
  signals: {
    trend: 'bullish' | 'bearish' | 'neutral'
    momentum: 'strong' | 'moderate' | 'weak'
    volume_pattern: string
  }
  indicators: {
    rsi: number
    macd: string
    moving_averages: {
      ma_50: number
      ma_200: number
      golden_cross: boolean
    }
  }
  support_resistance: {
    support_levels: number[]
    resistance_levels: number[]
  }
  recommendation: 'buy' | 'hold' | 'sell'
  confidence: number
  summary: string
}

interface FundamentalResult {
  fundamental_score: number
  valuation: {
    pe_ratio: number
    peg_ratio: number
    price_to_book: number
    valuation_assessment: string
  }
  financial_health: {
    revenue_growth_yoy: number
    profit_margin: number
    debt_to_equity: number
    current_ratio: number
    health_rating: string
  }
  earnings: {
    eps_growth: number
    earnings_surprise: number
    next_earnings_date: string
  }
  recommendation: 'buy' | 'hold' | 'sell'
  confidence: number
  summary: string
}

interface NewsArticle {
  headline: string
  source: string
  date: string
  sentiment: 'positive' | 'negative' | 'neutral'
  relevance: number
}

interface SentimentResult {
  sentiment_score: number
  overall_sentiment: 'positive' | 'negative' | 'neutral'
  news_articles: NewsArticle[]
  catalysts: {
    positive_catalysts: string[]
    negative_catalysts: string[]
    upcoming_events: string[]
  }
  social_sentiment: {
    buzz_level: string
    sentiment_trend: string
  }
  recommendation: 'buy' | 'hold' | 'sell'
  confidence: number
  summary: string
}

interface IndustryResult {
  industry_score: number
  sector_performance: {
    sector_name: string
    performance_ytd: number
    trend: string
    outlook: string
  }
  competitive_landscape: {
    market_position: string
    competitive_advantages: string[]
    competitive_threats: string[]
  }
  regulatory_environment: {
    regulatory_risk: string
    recent_changes: string[]
    upcoming_regulations: string[]
  }
  macroeconomic_factors: {
    interest_rate_sensitivity: string
    economic_cycle_stage: string
    key_indicators: string[]
  }
  recommendation: 'buy' | 'hold' | 'sell'
  confidence: number
  summary: string
}

interface RiskResult {
  risk_score: number
  overall_risk: string
  volatility_analysis: {
    beta: number
    volatility_30d: number
    max_drawdown: number
    volatility_rating: string
  }
  liquidity_analysis: {
    avg_daily_volume: number
    bid_ask_spread: number
    liquidity_rating: string
  }
  concentration_risks: {
    insider_ownership: number
    institutional_ownership: number
    top_holder_concentration: number
    concentration_concern: string
  }
  negative_catalysts: {
    identified_risks: string[]
    upcoming_risk_events: string[]
    systemic_risks: string[]
  }
  recommendation: 'buy' | 'hold' | 'sell'
  confidence: number
  summary: string
}

interface Alert {
  id: string
  ticker: string
  company_name: string
  conviction_score: number
  recommendation: 'buy' | 'hold' | 'sell'
  summary: string
  timestamp: string
  coordinatorData?: CoordinatorResult
  technicalData?: TechnicalResult
  fundamentalData?: FundamentalResult
  sentimentData?: SentimentResult
  industryData?: IndustryResult
  riskData?: RiskResult
}

interface WatchlistItem {
  ticker: string
  lastPrice: number
  change24h: number
  lastScan: string
}

interface Settings {
  convictionThreshold: number
  scanFrequency: string
  enableNotifications: boolean
  watchlist: string[]
}

export default function Home() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'details' | 'settings'>('dashboard')
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null)
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([
    { ticker: 'NVDA', lastPrice: 1192.0, change24h: 2.5, lastScan: '2h ago' },
    { ticker: 'AAPL', lastPrice: 185.5, change24h: -0.8, lastScan: '3h ago' },
    { ticker: 'MSFT', lastPrice: 425.3, change24h: 1.2, lastScan: '1h ago' },
  ])
  const [settings, setSettings] = useState<Settings>({
    convictionThreshold: 70,
    scanFrequency: '4h',
    enableNotifications: true,
    watchlist: ['NVDA', 'AAPL', 'MSFT']
  })
  const [newTicker, setNewTicker] = useState('')
  const [searchTicker, setSearchTicker] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisStatus, setAnalysisStatus] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [selectedTab, setSelectedTab] = useState('technical')

  // Load saved data from localStorage
  useEffect(() => {
    const savedAlerts = localStorage.getItem('stock_alerts')
    const savedSettings = localStorage.getItem('stock_settings')
    const savedWatchlist = localStorage.getItem('stock_watchlist')

    if (savedAlerts) setAlerts(JSON.parse(savedAlerts))
    if (savedSettings) setSettings(JSON.parse(savedSettings))
    if (savedWatchlist) setWatchlist(JSON.parse(savedWatchlist))
  }, [])

  // Save data to localStorage
  useEffect(() => {
    localStorage.setItem('stock_alerts', JSON.stringify(alerts))
    localStorage.setItem('stock_settings', JSON.stringify(settings))
    localStorage.setItem('stock_watchlist', JSON.stringify(watchlist))
  }, [alerts, settings, watchlist])

  const analyzeStock = async (ticker: string) => {
    setAnalyzing(true)
    setError(null)
    setAnalysisStatus('Initiating hidden gem discovery...')

    try {
      // Call Stock Opportunity Coordinator
      setAnalysisStatus(`Analyzing ${ticker} - Searching for hidden gem potential...`)
      const coordinatorResult = await callAIAgent(
        `Analyze ${ticker} stock ticker to determine if it's a hidden gem - an undervalued small-to-medium cap stock with high growth potential that's overlooked by the market. Search the web for current data and identify what the market is missing.`,
        STOCK_COORDINATOR_ID
      )

      if (!coordinatorResult.success || coordinatorResult.response.status !== 'success') {
        throw new Error(coordinatorResult.error || 'Analysis failed')
      }

      const coordData = coordinatorResult.response.result as CoordinatorResult

      // Only fetch detailed analysis if conviction score meets threshold
      if (coordData.conviction_score >= settings.convictionThreshold) {
        // Fetch all detailed analyses in parallel
        setAnalysisStatus(`${ticker} shows potential - Deep diving for hidden gem signals...`)
        const [techResult, fundResult, sentResult, indResult, riskResult] = await Promise.all([
          callAIAgent(
            `${ticker}: Search web for early breakout patterns, accumulation phases, and unusual volume. Is this stock in discovery stage before mainstream notices?`,
            TECHNICAL_ANALYSIS_ID
          ),
          callAIAgent(
            `${ticker}: Search web for undervaluation signs - low P/E but high growth, improving margins, strong revenue growth. What fundamentals is Wall Street missing?`,
            FUNDAMENTAL_ANALYSIS_ID
          ),
          callAIAgent(
            `${ticker}: Search web for emerging catalysts not yet priced in - new contracts, product launches, partnerships, under-the-radar announcements. What positive news is being overlooked?`,
            NEWS_SENTIMENT_ID
          ),
          callAIAgent(
            `${ticker}: Search web for emerging industry trends and tailwinds that could lift this small-cap. What macro trends position this stock for growth?`,
            INDUSTRY_TRENDS_ID
          ),
          callAIAgent(
            `${ticker}: Assess small-cap risks - is this a hidden gem or a value trap? Check liquidity, insider selling, red flags.`,
            RISK_ASSESSMENT_ID
          )
        ])

        const newAlert: Alert = {
          id: Date.now().toString(),
          ticker: coordData.ticker,
          company_name: coordData.company_name,
          conviction_score: coordData.conviction_score,
          recommendation: coordData.overall_recommendation,
          summary: coordData.summary,
          timestamp: new Date().toISOString(),
          coordinatorData: coordData,
          technicalData: techResult.success ? techResult.response.result as TechnicalResult : undefined,
          fundamentalData: fundResult.success ? fundResult.response.result as FundamentalResult : undefined,
          sentimentData: sentResult.success ? sentResult.response.result as SentimentResult : undefined,
          industryData: indResult.success ? indResult.response.result as IndustryResult : undefined,
          riskData: riskResult.success ? riskResult.response.result as RiskResult : undefined,
        }

        setAnalysisStatus('Analysis complete!')
        setAlerts(prev => [newAlert, ...prev])
        setSelectedAlert(newAlert)
        setCurrentView('details')
      } else {
        setAnalysisStatus(`${ticker} conviction score (${coordData.conviction_score.toFixed(1)}) below threshold`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed')
    } finally {
      setAnalyzing(false)
      setTimeout(() => setAnalysisStatus(''), 3000)
    }
  }

  const handleAnalyzeNow = () => {
    if (watchlist.length > 0) {
      analyzeStock(watchlist[0].ticker)
    }
  }

  const handleSearchAnalyze = () => {
    const ticker = searchTicker.trim().toUpperCase()
    if (ticker) {
      analyzeStock(ticker)
      setSearchTicker('')
    }
  }

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearchAnalyze()
    }
  }

  const handleViewDetails = (alert: Alert) => {
    setSelectedAlert(alert)
    setCurrentView('details')
  }

  const handleDismissAlert = (alertId: string) => {
    setAlerts(prev => prev.filter(a => a.id !== alertId))
    if (selectedAlert?.id === alertId) {
      setCurrentView('dashboard')
      setSelectedAlert(null)
    }
  }

  const handleAddToWatchlist = () => {
    if (newTicker.trim() && !settings.watchlist.includes(newTicker.toUpperCase())) {
      const ticker = newTicker.toUpperCase()
      setSettings(prev => ({
        ...prev,
        watchlist: [...prev.watchlist, ticker]
      }))
      setWatchlist(prev => [...prev, {
        ticker,
        lastPrice: 0,
        change24h: 0,
        lastScan: 'Never'
      }])
      setNewTicker('')
    }
  }

  const handleRemoveFromWatchlist = (ticker: string) => {
    setSettings(prev => ({
      ...prev,
      watchlist: prev.watchlist.filter(t => t !== ticker)
    }))
    setWatchlist(prev => prev.filter(w => w.ticker !== ticker))
  }

  const getConvictionColor = (score: number) => {
    if (score >= 80) return 'bg-green-500'
    if (score >= 60) return 'bg-amber-500'
    return 'bg-red-500'
  }

  const getRecommendationColor = (rec: string) => {
    if (rec === 'buy') return 'bg-green-500/10 text-green-400 border-green-500/20'
    if (rec === 'hold') return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
    return 'bg-red-500/10 text-red-400 border-red-500/20'
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor(diff / (1000 * 60))

    if (hours > 0) return `${hours}h ago`
    if (minutes > 0) return `${minutes}m ago`
    return 'Just now'
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value)
  }

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
  }

  // Dashboard View
  if (currentView === 'dashboard') {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100">
        {/* Header */}
        <header className="border-b border-gray-800 bg-gray-900">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Activity className="w-8 h-8 text-emerald-400" />
                <div>
                  <h1 className="text-2xl font-bold text-white">Hidden Gem Stock Finder</h1>
                  <p className="text-sm text-gray-400">AI-Powered Discovery of Undervalued Small-Cap Opportunities</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  onClick={handleAnalyzeNow}
                  disabled={analyzing || watchlist.length === 0}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {analyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Analyze Now
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => setCurrentView('settings')}
                  variant="outline"
                  className="border-gray-700 text-gray-300 hover:bg-gray-800"
                >
                  <SettingsIcon className="w-4 h-4 mr-2" />
                  Settings
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Stock Search Bar */}
        <div className="container mx-auto px-6 py-6">
          <Card className="bg-gradient-to-r from-emerald-900/20 to-blue-900/20 border-emerald-500/30">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Label htmlFor="stock-search" className="text-white text-lg font-semibold mb-2 block">
                    Find Hidden Gems - AI Web Research for Undervalued Stocks
                  </Label>
                  <div className="flex gap-3">
                    <div className="relative flex-1 max-w-md">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        id="stock-search"
                        type="text"
                        placeholder="Enter small-cap ticker to discover (e.g., CRWD, PLTR, SNOW)..."
                        value={searchTicker}
                        onChange={(e) => setSearchTicker(e.target.value.toUpperCase())}
                        onKeyPress={handleSearchKeyPress}
                        disabled={analyzing}
                        className="pl-10 bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 h-12 text-lg"
                      />
                    </div>
                    <Button
                      onClick={handleSearchAnalyze}
                      disabled={analyzing || !searchTicker.trim()}
                      size="lg"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-8"
                    >
                      {analyzing ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Search className="w-5 h-5 mr-2" />
                          Find Hidden Gem
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-gray-400 text-sm mt-2">
                    AI agents search the web for undervalued opportunities with strong fundamentals, emerging catalysts, and breakout potential before they go mainstream
                  </p>
                  {analysisStatus && (
                    <div className="mt-3 flex items-center gap-2 text-emerald-400">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm font-medium">{analysisStatus}</span>
                    </div>
                  )}
                </div>
                {analyzing && (
                  <div className="ml-4 pl-4 border-l border-gray-700">
                    <p className="text-xs text-gray-400 font-semibold mb-2">Active Agents:</p>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-gray-300">
                        <Activity className="w-3 h-3 text-emerald-400" />
                        <span>Coordinator</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-300">
                        <BarChart className="w-3 h-3 text-blue-400" />
                        <span>Technical Analysis</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-300">
                        <DollarSign className="w-3 h-3 text-green-400" />
                        <span>Fundamental Analysis</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-300">
                        <Newspaper className="w-3 h-3 text-amber-400" />
                        <span>News & Sentiment (Web Search)</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-300">
                        <Cpu className="w-3 h-3 text-purple-400" />
                        <span>Industry Trends (Web Search)</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-300">
                        <Shield className="w-3 h-3 text-red-400" />
                        <span>Risk Assessment</span>
                      </div>
                    </div>
                  </div>
                )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Error Display */}
        {error && (
          <div className="container mx-auto px-6 py-4">
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-red-400 font-semibold">Analysis Error</h3>
                <p className="text-red-300 text-sm mt-1">{error}</p>
              </div>
              <Button
                onClick={() => setError(null)}
                variant="ghost"
                size="sm"
                className="ml-auto text-red-400 hover:bg-red-500/10"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="container mx-auto px-6 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Alerts Panel (Left - 50%) */}
            <div className="lg:col-span-1">
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                    Hidden Gems Discovered
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Undervalued small-cap opportunities with breakout potential
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[600px] pr-4">
                    {alerts.length === 0 ? (
                      <div className="text-center py-12">
                        <Activity className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-500">No hidden gems discovered yet</p>
                        <p className="text-gray-600 text-sm mt-1">
                          Enter a stock ticker above to start discovering undervalued opportunities
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {alerts.map(alert => (
                          <Card
                            key={alert.id}
                            className="bg-gray-800 border-gray-700 hover:border-gray-600 transition-colors cursor-pointer"
                            onClick={() => handleViewDetails(alert)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <h3 className="text-lg font-bold text-white">
                                      {alert.ticker}
                                    </h3>
                                    <Badge
                                      className={cn(
                                        'text-xs font-semibold',
                                        getRecommendationColor(alert.recommendation)
                                      )}
                                    >
                                      {alert.recommendation.toUpperCase()}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-gray-400">
                                    {alert.company_name}
                                  </p>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                  <div className={cn(
                                    'px-3 py-1 rounded-full text-sm font-bold',
                                    getConvictionColor(alert.conviction_score),
                                    'text-white'
                                  )}>
                                    {alert.conviction_score.toFixed(1)}
                                  </div>
                                  <span className="text-xs text-gray-500">
                                    {formatTime(alert.timestamp)}
                                  </span>
                                </div>
                              </div>
                              <p className="text-sm text-gray-300 line-clamp-2 mb-3">
                                {alert.summary}
                              </p>
                              <div className="flex items-center justify-between">
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleViewDetails(alert)
                                  }}
                                  size="sm"
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                >
                                  View Details
                                  <ChevronRight className="w-4 h-4 ml-1" />
                                </Button>
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDismissAlert(alert.id)
                                  }}
                                  size="sm"
                                  variant="ghost"
                                  className="text-gray-400 hover:text-red-400 hover:bg-red-500/10"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Watchlist & Stats */}
            <div className="lg:col-span-1 space-y-6">
              {/* Watchlist Summary */}
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <BarChart className="w-5 h-5 text-blue-400" />
                    Watchlist
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Tracked stocks for analysis
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-800 hover:bg-transparent">
                        <TableHead className="text-gray-400">Ticker</TableHead>
                        <TableHead className="text-gray-400 text-right">Price</TableHead>
                        <TableHead className="text-gray-400 text-right">24h</TableHead>
                        <TableHead className="text-gray-400 text-right">Last Scan</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {watchlist.map(item => (
                        <TableRow
                          key={item.ticker}
                          className="border-gray-800 hover:bg-gray-800/50"
                        >
                          <TableCell className="font-bold text-white">
                            {item.ticker}
                          </TableCell>
                          <TableCell className="text-right text-gray-300">
                            {item.lastPrice > 0 ? formatCurrency(item.lastPrice) : '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            {item.lastPrice > 0 ? (
                              <span className={item.change24h >= 0 ? 'text-green-400' : 'text-red-400'}>
                                {item.change24h >= 0 ? (
                                  <TrendingUp className="w-4 h-4 inline mr-1" />
                                ) : (
                                  <TrendingDown className="w-4 h-4 inline mr-1" />
                                )}
                                {formatPercent(item.change24h)}
                              </span>
                            ) : '-'}
                          </TableCell>
                          <TableCell className="text-right text-gray-500 text-sm">
                            {item.lastScan}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-gray-900 border-gray-800">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-400 mb-1">Alerts Today</p>
                        <p className="text-3xl font-bold text-white">
                          {alerts.filter(a => {
                            const alertDate = new Date(a.timestamp).toDateString()
                            const today = new Date().toDateString()
                            return alertDate === today
                          }).length}
                        </p>
                      </div>
                      <AlertCircle className="w-10 h-10 text-emerald-400" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-900 border-gray-800">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-400 mb-1">Watchlist</p>
                        <p className="text-3xl font-bold text-white">
                          {watchlist.length}
                        </p>
                      </div>
                      <BarChart className="w-10 h-10 text-blue-400" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Next Scan Info */}
              <Card className="bg-gradient-to-br from-emerald-900/20 to-blue-900/20 border-emerald-500/20">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <RefreshCw className="w-8 h-8 text-emerald-400" />
                    <div>
                      <p className="text-sm text-gray-400">Auto-scan Interval</p>
                      <p className="text-xl font-bold text-white">
                        Every {settings.scanFrequency}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Settings View
  if (currentView === 'settings') {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100">
        {/* Header */}
        <header className="border-b border-gray-800 bg-gray-900">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <SettingsIcon className="w-8 h-8 text-emerald-400" />
                <h1 className="text-2xl font-bold text-white">Settings</h1>
              </div>
              <Button
                onClick={() => setCurrentView('dashboard')}
                variant="outline"
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                Back to Dashboard
              </Button>
            </div>
          </div>
        </header>

        {/* Settings Content */}
        <div className="container mx-auto px-6 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Watchlist Manager */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Watchlist Manager</CardTitle>
                <CardDescription className="text-gray-400">
                  Add or remove tickers from your watchlist
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter ticker (e.g., AAPL)"
                    value={newTicker}
                    onChange={(e) => setNewTicker(e.target.value.toUpperCase())}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddToWatchlist()
                    }}
                    className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                  />
                  <Button
                    onClick={handleAddToWatchlist}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                <Separator className="bg-gray-800" />

                <div className="space-y-2">
                  <Label className="text-gray-300">Current Watchlist</Label>
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-2">
                      {settings.watchlist.map(ticker => (
                        <div
                          key={ticker}
                          className="flex items-center justify-between p-3 bg-gray-800 rounded-lg border border-gray-700"
                        >
                          <span className="font-mono font-bold text-white">
                            {ticker}
                          </span>
                          <Button
                            onClick={() => handleRemoveFromWatchlist(ticker)}
                            size="sm"
                            variant="ghost"
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </CardContent>
            </Card>

            {/* Alert Preferences */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Alert Preferences</CardTitle>
                <CardDescription className="text-gray-400">
                  Configure when and how you receive alerts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-gray-300">
                    Conviction Score Threshold: {settings.convictionThreshold}
                  </Label>
                  <Slider
                    value={[settings.convictionThreshold]}
                    onValueChange={([value]) => setSettings(prev => ({
                      ...prev,
                      convictionThreshold: value
                    }))}
                    min={1}
                    max={100}
                    step={1}
                    className="py-4"
                  />
                  <p className="text-xs text-gray-500">
                    Only show alerts with conviction score above this threshold
                  </p>
                </div>

                <Separator className="bg-gray-800" />

                <div className="space-y-3">
                  <Label className="text-gray-300">Scan Frequency</Label>
                  <Select
                    value={settings.scanFrequency}
                    onValueChange={(value) => setSettings(prev => ({
                      ...prev,
                      scanFrequency: value
                    }))}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="1h" className="text-white">Every 1 hour</SelectItem>
                      <SelectItem value="2h" className="text-white">Every 2 hours</SelectItem>
                      <SelectItem value="4h" className="text-white">Every 4 hours</SelectItem>
                      <SelectItem value="8h" className="text-white">Every 8 hours</SelectItem>
                      <SelectItem value="24h" className="text-white">Once daily</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator className="bg-gray-800" />

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-gray-300">Enable Notifications</Label>
                    <p className="text-xs text-gray-500 mt-1">
                      Get notified when new alerts are triggered
                    </p>
                  </div>
                  <Switch
                    checked={settings.enableNotifications}
                    onCheckedChange={(checked) => setSettings(prev => ({
                      ...prev,
                      enableNotifications: checked
                    }))}
                  />
                </div>

                <Button
                  onClick={() => {
                    localStorage.setItem('stock_settings', JSON.stringify(settings))
                    setCurrentView('dashboard')
                  }}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Save Settings
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // Analysis Details View
  if (currentView === 'details' && selectedAlert) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100">
        {/* Header */}
        <header className="border-b border-gray-800 bg-gray-900">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => setCurrentView('dashboard')}
                  variant="ghost"
                  className="text-gray-400 hover:text-white"
                >
                  <ChevronRight className="w-5 h-5 rotate-180" />
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    {selectedAlert.ticker} - {selectedAlert.company_name}
                  </h1>
                  <p className="text-sm text-gray-400">
                    Analysis from {formatTime(selectedAlert.timestamp)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => handleDismissAlert(selectedAlert.id)}
                  variant="outline"
                  className="border-gray-700 text-gray-300 hover:bg-gray-800"
                >
                  Dismiss Alert
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Summary Header */}
        <div className="border-b border-gray-800 bg-gradient-to-r from-gray-900 to-gray-800">
          <div className="container mx-auto px-6 py-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="md:col-span-1">
                <p className="text-sm text-gray-400 mb-2">Conviction Score</p>
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold',
                    getConvictionColor(selectedAlert.conviction_score),
                    'text-white'
                  )}>
                    {selectedAlert.conviction_score.toFixed(0)}
                  </div>
                  <div>
                    <Badge className={cn('text-sm', getRecommendationColor(selectedAlert.recommendation))}>
                      {selectedAlert.recommendation.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </div>

              {selectedAlert.coordinatorData && (
                <>
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Current Price</p>
                    <p className="text-2xl font-bold text-white">
                      {formatCurrency(selectedAlert.coordinatorData.price_target.current_price)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Price Target</p>
                    <p className="text-2xl font-bold text-emerald-400">
                      {formatCurrency(selectedAlert.coordinatorData.price_target.target_price)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Upside Potential</p>
                    <p className="text-2xl font-bold text-green-400">
                      +{selectedAlert.coordinatorData.price_target.upside_potential.toFixed(2)}%
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Tabbed Analysis */}
        <div className="container mx-auto px-6 py-6">
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="bg-gray-900 border-b border-gray-800 w-full justify-start rounded-none h-auto p-0">
              <TabsTrigger
                value="technical"
                className="data-[state=active]:bg-gray-800 data-[state=active]:text-emerald-400 text-gray-400 rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-400"
              >
                <BarChart className="w-4 h-4 mr-2" />
                Technical
              </TabsTrigger>
              <TabsTrigger
                value="fundamental"
                className="data-[state=active]:bg-gray-800 data-[state=active]:text-emerald-400 text-gray-400 rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-400"
              >
                <DollarSign className="w-4 h-4 mr-2" />
                Fundamental
              </TabsTrigger>
              <TabsTrigger
                value="sentiment"
                className="data-[state=active]:bg-gray-800 data-[state=active]:text-emerald-400 text-gray-400 rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-400"
              >
                <Newspaper className="w-4 h-4 mr-2" />
                Sentiment
              </TabsTrigger>
              <TabsTrigger
                value="industry"
                className="data-[state=active]:bg-gray-800 data-[state=active]:text-emerald-400 text-gray-400 rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-400"
              >
                <Cpu className="w-4 h-4 mr-2" />
                Industry
              </TabsTrigger>
              <TabsTrigger
                value="risk"
                className="data-[state=active]:bg-gray-800 data-[state=active]:text-emerald-400 text-gray-400 rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-400"
              >
                <Shield className="w-4 h-4 mr-2" />
                Risk
              </TabsTrigger>
            </TabsList>

            {/* Technical Tab */}
            <TabsContent value="technical" className="mt-6">
              {selectedAlert.technicalData ? (
                <div className="space-y-6">
                  <Card className="bg-gray-900 border-gray-800">
                    <CardHeader>
                      <CardTitle className="text-white">Technical Analysis</CardTitle>
                      <CardDescription className="text-gray-400">
                        Score: {selectedAlert.technicalData.technical_score.toFixed(1)} |
                        Confidence: {(selectedAlert.technicalData.confidence * 100).toFixed(0)}%
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-300 mb-3">Key Indicators</h3>
                        <Table>
                          <TableBody>
                            <TableRow className="border-gray-800">
                              <TableCell className="text-gray-400">RSI</TableCell>
                              <TableCell className="text-right">
                                <span className={cn(
                                  'font-bold',
                                  selectedAlert.technicalData.indicators.rsi > 70 ? 'text-red-400' :
                                  selectedAlert.technicalData.indicators.rsi < 30 ? 'text-green-400' :
                                  'text-amber-400'
                                )}>
                                  {selectedAlert.technicalData.indicators.rsi.toFixed(1)}
                                </span>
                              </TableCell>
                            </TableRow>
                            <TableRow className="border-gray-800">
                              <TableCell className="text-gray-400">MACD</TableCell>
                              <TableCell className="text-right text-gray-300 text-sm">
                                {selectedAlert.technicalData.indicators.macd}
                              </TableCell>
                            </TableRow>
                            <TableRow className="border-gray-800">
                              <TableCell className="text-gray-400">50-Day MA</TableCell>
                              <TableCell className="text-right text-white font-bold">
                                {formatCurrency(selectedAlert.technicalData.indicators.moving_averages.ma_50)}
                              </TableCell>
                            </TableRow>
                            <TableRow className="border-gray-800">
                              <TableCell className="text-gray-400">200-Day MA</TableCell>
                              <TableCell className="text-right text-white font-bold">
                                {formatCurrency(selectedAlert.technicalData.indicators.moving_averages.ma_200)}
                              </TableCell>
                            </TableRow>
                            <TableRow className="border-gray-800">
                              <TableCell className="text-gray-400">Golden Cross</TableCell>
                              <TableCell className="text-right">
                                {selectedAlert.technicalData.indicators.moving_averages.golden_cross ? (
                                  <Badge className="bg-green-500/10 text-green-400 border-green-500/20">Yes</Badge>
                                ) : (
                                  <Badge className="bg-gray-500/10 text-gray-400 border-gray-500/20">No</Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>

                      <Separator className="bg-gray-800" />

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-gray-400 mb-2">Trend</p>
                          <Badge className={cn(
                            'text-sm',
                            selectedAlert.technicalData.signals.trend === 'bullish' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                            selectedAlert.technicalData.signals.trend === 'bearish' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                            'bg-gray-500/10 text-gray-400 border-gray-500/20'
                          )}>
                            {selectedAlert.technicalData.signals.trend}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400 mb-2">Momentum</p>
                          <Badge className={cn(
                            'text-sm',
                            selectedAlert.technicalData.signals.momentum === 'strong' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                            selectedAlert.technicalData.signals.momentum === 'weak' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                            'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          )}>
                            {selectedAlert.technicalData.signals.momentum}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400 mb-2">Recommendation</p>
                          <Badge className={getRecommendationColor(selectedAlert.technicalData.recommendation)}>
                            {selectedAlert.technicalData.recommendation.toUpperCase()}
                          </Badge>
                        </div>
                      </div>

                      <Separator className="bg-gray-800" />

                      <div>
                        <h3 className="text-sm font-semibold text-gray-300 mb-3">Support & Resistance</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-gray-500 mb-2">Support Levels</p>
                            <div className="space-y-1">
                              {selectedAlert.technicalData.support_resistance.support_levels.map((level, i) => (
                                <div key={i} className="text-green-400 font-mono text-sm">
                                  {formatCurrency(level)}
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-2">Resistance Levels</p>
                            <div className="space-y-1">
                              {selectedAlert.technicalData.support_resistance.resistance_levels.map((level, i) => (
                                <div key={i} className="text-red-400 font-mono text-sm">
                                  {formatCurrency(level)}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      <Separator className="bg-gray-800" />

                      <div>
                        <h3 className="text-sm font-semibold text-gray-300 mb-2">Volume Pattern</h3>
                        <p className="text-sm text-gray-400">
                          {selectedAlert.technicalData.signals.volume_pattern}
                        </p>
                      </div>

                      <div className="bg-gray-800 rounded-lg p-4">
                        <p className="text-sm text-gray-300">
                          {selectedAlert.technicalData.summary}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card className="bg-gray-900 border-gray-800">
                  <CardContent className="py-12 text-center">
                    <p className="text-gray-500">Technical analysis data not available</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Fundamental Tab */}
            <TabsContent value="fundamental" className="mt-6">
              {selectedAlert.fundamentalData ? (
                <div className="space-y-6">
                  <Card className="bg-gray-900 border-gray-800">
                    <CardHeader>
                      <CardTitle className="text-white">Fundamental Analysis</CardTitle>
                      <CardDescription className="text-gray-400">
                        Score: {selectedAlert.fundamentalData.fundamental_score.toFixed(1)} |
                        Confidence: {(selectedAlert.fundamentalData.confidence * 100).toFixed(0)}%
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-300 mb-3">Valuation Metrics</h3>
                        <Table>
                          <TableBody>
                            <TableRow className="border-gray-800">
                              <TableCell className="text-gray-400">P/E Ratio</TableCell>
                              <TableCell className="text-right text-white font-bold">
                                {selectedAlert.fundamentalData.valuation.pe_ratio.toFixed(2)}
                              </TableCell>
                            </TableRow>
                            <TableRow className="border-gray-800">
                              <TableCell className="text-gray-400">PEG Ratio</TableCell>
                              <TableCell className="text-right text-white font-bold">
                                {selectedAlert.fundamentalData.valuation.peg_ratio.toFixed(2)}
                              </TableCell>
                            </TableRow>
                            <TableRow className="border-gray-800">
                              <TableCell className="text-gray-400">Price to Book</TableCell>
                              <TableCell className="text-right text-white font-bold">
                                {selectedAlert.fundamentalData.valuation.price_to_book.toFixed(2)}
                              </TableCell>
                            </TableRow>
                            <TableRow className="border-gray-800">
                              <TableCell className="text-gray-400">Assessment</TableCell>
                              <TableCell className="text-right">
                                <Badge className={cn(
                                  'text-sm',
                                  selectedAlert.fundamentalData.valuation.valuation_assessment === 'overvalued' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                  selectedAlert.fundamentalData.valuation.valuation_assessment === 'undervalued' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                  'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                )}>
                                  {selectedAlert.fundamentalData.valuation.valuation_assessment}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>

                      <Separator className="bg-gray-800" />

                      <div>
                        <h3 className="text-sm font-semibold text-gray-300 mb-3">Financial Health</h3>
                        <Table>
                          <TableBody>
                            <TableRow className="border-gray-800">
                              <TableCell className="text-gray-400">Revenue Growth (YoY)</TableCell>
                              <TableCell className="text-right text-green-400 font-bold">
                                {(selectedAlert.fundamentalData.financial_health.revenue_growth_yoy * 100).toFixed(1)}%
                              </TableCell>
                            </TableRow>
                            <TableRow className="border-gray-800">
                              <TableCell className="text-gray-400">Profit Margin</TableCell>
                              <TableCell className="text-right text-white font-bold">
                                {(selectedAlert.fundamentalData.financial_health.profit_margin * 100).toFixed(1)}%
                              </TableCell>
                            </TableRow>
                            <TableRow className="border-gray-800">
                              <TableCell className="text-gray-400">Debt to Equity</TableCell>
                              <TableCell className="text-right text-white font-bold">
                                {selectedAlert.fundamentalData.financial_health.debt_to_equity.toFixed(2)}
                              </TableCell>
                            </TableRow>
                            <TableRow className="border-gray-800">
                              <TableCell className="text-gray-400">Current Ratio</TableCell>
                              <TableCell className="text-right text-white font-bold">
                                {selectedAlert.fundamentalData.financial_health.current_ratio.toFixed(2)}
                              </TableCell>
                            </TableRow>
                            <TableRow className="border-gray-800">
                              <TableCell className="text-gray-400">Health Rating</TableCell>
                              <TableCell className="text-right">
                                <Badge className="bg-green-500/10 text-green-400 border-green-500/20">
                                  {selectedAlert.fundamentalData.financial_health.health_rating}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>

                      <Separator className="bg-gray-800" />

                      <div>
                        <h3 className="text-sm font-semibold text-gray-300 mb-3">Earnings</h3>
                        <Table>
                          <TableBody>
                            <TableRow className="border-gray-800">
                              <TableCell className="text-gray-400">EPS Growth</TableCell>
                              <TableCell className="text-right text-green-400 font-bold">
                                {(selectedAlert.fundamentalData.earnings.eps_growth * 100).toFixed(1)}%
                              </TableCell>
                            </TableRow>
                            <TableRow className="border-gray-800">
                              <TableCell className="text-gray-400">Earnings Surprise</TableCell>
                              <TableCell className="text-right text-green-400 font-bold">
                                +{(selectedAlert.fundamentalData.earnings.earnings_surprise * 100).toFixed(1)}%
                              </TableCell>
                            </TableRow>
                            <TableRow className="border-gray-800">
                              <TableCell className="text-gray-400">Next Earnings Date</TableCell>
                              <TableCell className="text-right text-white">
                                {new Date(selectedAlert.fundamentalData.earnings.next_earnings_date).toLocaleDateString()}
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>

                      <div className="bg-gray-800 rounded-lg p-4">
                        <p className="text-sm text-gray-300">
                          {selectedAlert.fundamentalData.summary}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card className="bg-gray-900 border-gray-800">
                  <CardContent className="py-12 text-center">
                    <p className="text-gray-500">Fundamental analysis data not available</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Sentiment Tab */}
            <TabsContent value="sentiment" className="mt-6">
              {selectedAlert.sentimentData ? (
                <div className="space-y-6">
                  <Card className="bg-gray-900 border-gray-800">
                    <CardHeader>
                      <CardTitle className="text-white">News & Sentiment Analysis</CardTitle>
                      <CardDescription className="text-gray-400">
                        Score: {selectedAlert.sentimentData.sentiment_score.toFixed(1)} |
                        Confidence: {(selectedAlert.sentimentData.confidence * 100).toFixed(0)}%
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-gray-400 mb-2">Overall Sentiment</p>
                          <Badge className={cn(
                            'text-sm',
                            selectedAlert.sentimentData.overall_sentiment === 'positive' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                            selectedAlert.sentimentData.overall_sentiment === 'negative' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                            'bg-gray-500/10 text-gray-400 border-gray-500/20'
                          )}>
                            {selectedAlert.sentimentData.overall_sentiment}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400 mb-2">Buzz Level</p>
                          <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                            {selectedAlert.sentimentData.social_sentiment.buzz_level}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400 mb-2">Sentiment Trend</p>
                          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                            {selectedAlert.sentimentData.social_sentiment.sentiment_trend}
                          </Badge>
                        </div>
                      </div>

                      <Separator className="bg-gray-800" />

                      <div>
                        <h3 className="text-sm font-semibold text-gray-300 mb-3">Recent News</h3>
                        <div className="space-y-3">
                          {selectedAlert.sentimentData.news_articles.map((article, i) => (
                            <Card key={i} className="bg-gray-800 border-gray-700">
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1">
                                    <h4 className="text-sm font-semibold text-white mb-1">
                                      {article.headline}
                                    </h4>
                                    <p className="text-xs text-gray-500">
                                      {article.source} • {new Date(article.date).toLocaleDateString()}
                                    </p>
                                  </div>
                                  <div className="flex flex-col items-end gap-1">
                                    <Badge className={cn(
                                      'text-xs',
                                      article.sentiment === 'positive' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                      article.sentiment === 'negative' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                      'bg-gray-500/10 text-gray-400 border-gray-500/20'
                                    )}>
                                      {article.sentiment}
                                    </Badge>
                                    <span className="text-xs text-gray-500">
                                      {(article.relevance * 100).toFixed(0)}% relevant
                                    </span>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>

                      <Separator className="bg-gray-800" />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h3 className="text-sm font-semibold text-green-400 mb-2">Positive Catalysts</h3>
                          <ul className="space-y-1">
                            {selectedAlert.sentimentData.catalysts.positive_catalysts.map((catalyst, i) => (
                              <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                                <TrendingUp className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                                {catalyst}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-red-400 mb-2">Negative Catalysts</h3>
                          <ul className="space-y-1">
                            {selectedAlert.sentimentData.catalysts.negative_catalysts.map((catalyst, i) => (
                              <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                                <TrendingDown className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                                {catalyst}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <Separator className="bg-gray-800" />

                      <div>
                        <h3 className="text-sm font-semibold text-gray-300 mb-2">Upcoming Events</h3>
                        <ul className="space-y-1">
                          {selectedAlert.sentimentData.catalysts.upcoming_events.map((event, i) => (
                            <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0 mt-2" />
                              {event}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="bg-gray-800 rounded-lg p-4">
                        <p className="text-sm text-gray-300">
                          {selectedAlert.sentimentData.summary}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card className="bg-gray-900 border-gray-800">
                  <CardContent className="py-12 text-center">
                    <p className="text-gray-500">Sentiment analysis data not available</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Industry Tab */}
            <TabsContent value="industry" className="mt-6">
              {selectedAlert.industryData ? (
                <div className="space-y-6">
                  <Card className="bg-gray-900 border-gray-800">
                    <CardHeader>
                      <CardTitle className="text-white">Industry & Sector Analysis</CardTitle>
                      <CardDescription className="text-gray-400">
                        Score: {selectedAlert.industryData.industry_score.toFixed(1)} |
                        Confidence: {(selectedAlert.industryData.confidence * 100).toFixed(0)}%
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-300 mb-3">Sector Performance</h3>
                        <Table>
                          <TableBody>
                            <TableRow className="border-gray-800">
                              <TableCell className="text-gray-400">Sector</TableCell>
                              <TableCell className="text-right text-white font-bold">
                                {selectedAlert.industryData.sector_performance.sector_name}
                              </TableCell>
                            </TableRow>
                            <TableRow className="border-gray-800">
                              <TableCell className="text-gray-400">YTD Performance</TableCell>
                              <TableCell className="text-right text-green-400 font-bold">
                                +{selectedAlert.industryData.sector_performance.performance_ytd.toFixed(1)}%
                              </TableCell>
                            </TableRow>
                            <TableRow className="border-gray-800">
                              <TableCell className="text-gray-400">Trend</TableCell>
                              <TableCell className="text-right">
                                <Badge className="bg-green-500/10 text-green-400 border-green-500/20">
                                  {selectedAlert.industryData.sector_performance.trend}
                                </Badge>
                              </TableCell>
                            </TableRow>
                            <TableRow className="border-gray-800">
                              <TableCell className="text-gray-400">Outlook</TableCell>
                              <TableCell className="text-right">
                                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                                  {selectedAlert.industryData.sector_performance.outlook}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>

                      <Separator className="bg-gray-800" />

                      <div>
                        <h3 className="text-sm font-semibold text-gray-300 mb-3">Competitive Landscape</h3>
                        <div className="space-y-4">
                          <div>
                            <p className="text-xs text-gray-500 mb-2">Market Position</p>
                            <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                              {selectedAlert.industryData.competitive_landscape.market_position}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-gray-500 mb-2">Competitive Advantages</p>
                              <ul className="space-y-1">
                                {selectedAlert.industryData.competitive_landscape.competitive_advantages.map((adv, i) => (
                                  <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0 mt-2" />
                                    {adv}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-2">Competitive Threats</p>
                              <ul className="space-y-1">
                                {selectedAlert.industryData.competitive_landscape.competitive_threats.map((threat, i) => (
                                  <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0 mt-2" />
                                    {threat}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>

                      <Separator className="bg-gray-800" />

                      <div>
                        <h3 className="text-sm font-semibold text-gray-300 mb-3">Regulatory Environment</h3>
                        <div className="space-y-4">
                          <div>
                            <p className="text-xs text-gray-500 mb-2">Regulatory Risk</p>
                            <Badge className={cn(
                              'text-sm',
                              selectedAlert.industryData.regulatory_environment.regulatory_risk === 'low' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                              selectedAlert.industryData.regulatory_environment.regulatory_risk === 'high' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                              'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            )}>
                              {selectedAlert.industryData.regulatory_environment.regulatory_risk}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-gray-500 mb-2">Recent Changes</p>
                              <ul className="space-y-1">
                                {selectedAlert.industryData.regulatory_environment.recent_changes.map((change, i) => (
                                  <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0 mt-2" />
                                    {change}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-2">Upcoming Regulations</p>
                              <ul className="space-y-1">
                                {selectedAlert.industryData.regulatory_environment.upcoming_regulations.map((reg, i) => (
                                  <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0 mt-2" />
                                    {reg}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>

                      <Separator className="bg-gray-800" />

                      <div>
                        <h3 className="text-sm font-semibold text-gray-300 mb-3">Macroeconomic Factors</h3>
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Interest Rate Sensitivity</p>
                              <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20">
                                {selectedAlert.industryData.macroeconomic_factors.interest_rate_sensitivity}
                              </Badge>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Economic Cycle Stage</p>
                              <Badge className="bg-green-500/10 text-green-400 border-green-500/20">
                                {selectedAlert.industryData.macroeconomic_factors.economic_cycle_stage}
                              </Badge>
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-2">Key Indicators</p>
                            <ul className="space-y-1">
                              {selectedAlert.industryData.macroeconomic_factors.key_indicators.map((indicator, i) => (
                                <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0 mt-2" />
                                  {indicator}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-800 rounded-lg p-4">
                        <p className="text-sm text-gray-300">
                          {selectedAlert.industryData.summary}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card className="bg-gray-900 border-gray-800">
                  <CardContent className="py-12 text-center">
                    <p className="text-gray-500">Industry analysis data not available</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Risk Tab */}
            <TabsContent value="risk" className="mt-6">
              {selectedAlert.riskData ? (
                <div className="space-y-6">
                  <Card className="bg-gray-900 border-gray-800">
                    <CardHeader>
                      <CardTitle className="text-white">Risk Assessment</CardTitle>
                      <CardDescription className="text-gray-400">
                        Score: {selectedAlert.riskData.risk_score.toFixed(1)} |
                        Confidence: {(selectedAlert.riskData.confidence * 100).toFixed(0)}%
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-300 mb-3">Overall Risk</h3>
                        <Badge className={cn(
                          'text-lg px-4 py-2',
                          selectedAlert.riskData.overall_risk === 'low' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                          selectedAlert.riskData.overall_risk === 'high' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                          'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        )}>
                          {selectedAlert.riskData.overall_risk} risk
                        </Badge>
                      </div>

                      <Separator className="bg-gray-800" />

                      <div>
                        <h3 className="text-sm font-semibold text-gray-300 mb-3">Volatility Analysis</h3>
                        <Table>
                          <TableBody>
                            <TableRow className="border-gray-800">
                              <TableCell className="text-gray-400">Beta</TableCell>
                              <TableCell className="text-right text-white font-bold">
                                {selectedAlert.riskData.volatility_analysis.beta.toFixed(2)}
                              </TableCell>
                            </TableRow>
                            <TableRow className="border-gray-800">
                              <TableCell className="text-gray-400">30-Day Volatility</TableCell>
                              <TableCell className="text-right text-amber-400 font-bold">
                                {(selectedAlert.riskData.volatility_analysis.volatility_30d * 100).toFixed(2)}%
                              </TableCell>
                            </TableRow>
                            <TableRow className="border-gray-800">
                              <TableCell className="text-gray-400">Max Drawdown</TableCell>
                              <TableCell className="text-right text-red-400 font-bold">
                                -{(selectedAlert.riskData.volatility_analysis.max_drawdown * 100).toFixed(1)}%
                              </TableCell>
                            </TableRow>
                            <TableRow className="border-gray-800">
                              <TableCell className="text-gray-400">Volatility Rating</TableCell>
                              <TableCell className="text-right">
                                <Badge className={cn(
                                  'text-sm',
                                  selectedAlert.riskData.volatility_analysis.volatility_rating === 'low' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                  selectedAlert.riskData.volatility_analysis.volatility_rating === 'high' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                  'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                )}>
                                  {selectedAlert.riskData.volatility_analysis.volatility_rating}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>

                      <Separator className="bg-gray-800" />

                      <div>
                        <h3 className="text-sm font-semibold text-gray-300 mb-3">Liquidity Analysis</h3>
                        <Table>
                          <TableBody>
                            <TableRow className="border-gray-800">
                              <TableCell className="text-gray-400">Avg Daily Volume</TableCell>
                              <TableCell className="text-right text-white font-bold">
                                {selectedAlert.riskData.liquidity_analysis.avg_daily_volume.toLocaleString()}
                              </TableCell>
                            </TableRow>
                            <TableRow className="border-gray-800">
                              <TableCell className="text-gray-400">Bid-Ask Spread</TableCell>
                              <TableCell className="text-right text-white font-bold">
                                {(selectedAlert.riskData.liquidity_analysis.bid_ask_spread * 100).toFixed(3)}%
                              </TableCell>
                            </TableRow>
                            <TableRow className="border-gray-800">
                              <TableCell className="text-gray-400">Liquidity Rating</TableCell>
                              <TableCell className="text-right">
                                <Badge className="bg-green-500/10 text-green-400 border-green-500/20">
                                  {selectedAlert.riskData.liquidity_analysis.liquidity_rating}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>

                      <Separator className="bg-gray-800" />

                      <div>
                        <h3 className="text-sm font-semibold text-gray-300 mb-3">Concentration Risks</h3>
                        <Table>
                          <TableBody>
                            <TableRow className="border-gray-800">
                              <TableCell className="text-gray-400">Insider Ownership</TableCell>
                              <TableCell className="text-right text-white">
                                {(selectedAlert.riskData.concentration_risks.insider_ownership * 100).toFixed(1)}%
                              </TableCell>
                            </TableRow>
                            <TableRow className="border-gray-800">
                              <TableCell className="text-gray-400">Institutional Ownership</TableCell>
                              <TableCell className="text-right text-white">
                                {(selectedAlert.riskData.concentration_risks.institutional_ownership * 100).toFixed(1)}%
                              </TableCell>
                            </TableRow>
                            <TableRow className="border-gray-800">
                              <TableCell className="text-gray-400">Top Holder Concentration</TableCell>
                              <TableCell className="text-right text-white">
                                {(selectedAlert.riskData.concentration_risks.top_holder_concentration * 100).toFixed(1)}%
                              </TableCell>
                            </TableRow>
                            <TableRow className="border-gray-800">
                              <TableCell className="text-gray-400">Concentration Concern</TableCell>
                              <TableCell className="text-right">
                                <Badge className={cn(
                                  'text-sm',
                                  selectedAlert.riskData.concentration_risks.concentration_concern === 'low' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                  selectedAlert.riskData.concentration_risks.concentration_concern === 'high' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                  'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                )}>
                                  {selectedAlert.riskData.concentration_risks.concentration_concern}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>

                      <Separator className="bg-gray-800" />

                      <div>
                        <h3 className="text-sm font-semibold text-gray-300 mb-3">Negative Catalysts</h3>
                        <div className="space-y-4">
                          <div>
                            <p className="text-xs text-gray-500 mb-2">Identified Risks</p>
                            <ul className="space-y-2">
                              {selectedAlert.riskData.negative_catalysts.identified_risks.map((risk, i) => (
                                <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                                  {risk}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-2">Upcoming Risk Events</p>
                            <ul className="space-y-2">
                              {selectedAlert.riskData.negative_catalysts.upcoming_risk_events.map((event, i) => (
                                <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                                  <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                                  {event}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-2">Systemic Risks</p>
                            <ul className="space-y-2">
                              {selectedAlert.riskData.negative_catalysts.systemic_risks.map((risk, i) => (
                                <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                                  <AlertCircle className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
                                  {risk}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-800 rounded-lg p-4">
                        <p className="text-sm text-gray-300">
                          {selectedAlert.riskData.summary}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card className="bg-gray-900 border-gray-800">
                  <CardContent className="py-12 text-center">
                    <p className="text-gray-500">Risk assessment data not available</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>

          {/* Action Items Section */}
          {selectedAlert.coordinatorData?.action_items && (
            <Card className="bg-gray-900 border-gray-800 mt-6">
              <CardHeader>
                <CardTitle className="text-white">Action Items</CardTitle>
                <CardDescription className="text-gray-400">
                  Recommended next steps based on this analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {selectedAlert.coordinatorData.action_items.map((item, i) => (
                    <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                      <div className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold">
                        {i + 1}
                      </div>
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* SWOT Summary */}
          {selectedAlert.coordinatorData?.key_insights && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <Card className="bg-green-900/10 border-green-500/20">
                <CardHeader>
                  <CardTitle className="text-green-400 text-sm">Strengths</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1">
                    {selectedAlert.coordinatorData.key_insights.strengths.map((item, i) => (
                      <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0 mt-2" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-red-900/10 border-red-500/20">
                <CardHeader>
                  <CardTitle className="text-red-400 text-sm">Weaknesses</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1">
                    {selectedAlert.coordinatorData.key_insights.weaknesses.map((item, i) => (
                      <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0 mt-2" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-blue-900/10 border-blue-500/20">
                <CardHeader>
                  <CardTitle className="text-blue-400 text-sm">Opportunities</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1">
                    {selectedAlert.coordinatorData.key_insights.opportunities.map((item, i) => (
                      <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0 mt-2" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-amber-900/10 border-amber-500/20">
                <CardHeader>
                  <CardTitle className="text-amber-400 text-sm">Threats</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1">
                    {selectedAlert.coordinatorData.key_insights.threats.map((item, i) => (
                      <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0 mt-2" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    )
  }

  return null
}
