import { useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import analysisData from '@/data/13f-analysis.json'
import styles from '@/styles/ThirteenFReport.module.css'

type View = 'overview' | 'managers' | 'companies' | 'moves'
type AnalysisData = typeof analysisData
type Manager = AnalysisData['managers'][number]
type Company = AnalysisData['volatileHoldings'][number]
type Move = AnalysisData['recentMoves'][number]
type CompanyManager = Company['managerBreakdown'][number]

const views: { id: View; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'managers', label: 'Managers' },
  { id: 'companies', label: 'Companies' },
  { id: 'moves', label: 'Latest Moves' },
]

const managerColors = [
  '#0b7a75',
  '#c2691a',
  '#8a4038',
  '#5f77a8',
  '#8a6fb0',
  '#3d8b57',
  '#ad7b2c',
  '#9c4f72',
  '#4f879c',
  '#77823d',
]

function formatUsd(value: number): string {
  const abs = Math.abs(value)
  const sign = value < 0 ? '-' : ''

  if (abs >= 1_000_000_000_000) {
    return `${sign}$${(abs / 1_000_000_000_000).toFixed(2)}T`
  }

  if (abs >= 1_000_000_000) {
    return `${sign}$${(abs / 1_000_000_000).toFixed(1)}B`
  }

  if (abs >= 1_000_000) {
    return `${sign}$${(abs / 1_000_000).toFixed(0)}M`
  }

  return `${sign}$${abs.toLocaleString()}`
}

function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return 'new'
  }

  return `${(value * 100).toFixed(1)}%`
}

function formatPeriod(period: string): string {
  const [year, month] = period.split('-')
  const quarter = month === '03' ? 'Q1' : month === '06' ? 'Q2' : month === '09' ? 'Q3' : 'Q4'
  return `${year} ${quarter}`
}

function formatShortPeriod(period: string): string {
  const [year, month] = period.split('-')
  const quarter = month === '03' ? 'Q1' : month === '06' ? 'Q2' : month === '09' ? 'Q3' : 'Q4'
  return `${year.slice(2)} ${quarter}`
}

function linePoints(values: number[], width: number, height: number, xPadding = 0): string {
  const min = Math.min(...values)
  const max = Math.max(...values)
  const spread = max - min || 1
  const plotWidth = width - xPadding * 2

  return values
    .map((value, index) => {
      const x = values.length === 1 ? width / 2 : xPadding + (index / (values.length - 1)) * plotWidth
      const y = height - ((value - min) / spread) * height
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
}

function absoluteLinePoints(
  values: number[],
  width: number,
  height: number,
  xPadding = 0,
  maxValue = Math.max(...values),
): string {
  const plotWidth = width - xPadding * 2
  const denominator = maxValue || 1

  return values
    .map((value, index) => {
      const x = values.length === 1 ? width / 2 : xPadding + (index / (values.length - 1)) * plotWidth
      const y = height - (value / denominator) * height
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
}

function TrendChart({
  series,
}: {
  series: AnalysisData['aggregateSeries']
}) {
  const width = 920
  const height = 260
  const xPadding = 44
  const values = series.map((item) => item.totalValue)
  const churnValues = series.map((item) => item.averageChurnRate * 1_000_000_000_000)
  const valuePolyline = linePoints(values, width, height, xPadding)
  const churnPolyline = linePoints(churnValues, width, height, xPadding)

  return (
    <div className={styles.chartWrap} aria-label="Aggregate 13F value and average swing trend">
      <svg viewBox={`0 0 ${width} ${height + 46}`} role="img">
        <title>Aggregate reported value and average swing trend</title>
        {[0, 1, 2, 3].map((line) => (
          <line
            key={line}
            x1="0"
            x2={width}
            y1={(line / 3) * height}
            y2={(line / 3) * height}
            className={styles.gridLine}
          />
        ))}
        <polyline points={valuePolyline} className={styles.valueLine} />
        <polyline points={churnPolyline} className={styles.churnLine} />
        {series.map((item, index) => {
          const x =
            series.length === 1
              ? width / 2
              : xPadding + (index / (series.length - 1)) * (width - xPadding * 2)
          return (
            <g key={item.period}>
              <line x1={x} x2={x} y1={height + 8} y2={height + 14} className={styles.tickLine} />
              <text x={x} y={height + 34} textAnchor="middle" className={styles.axisText}>
                {formatShortPeriod(item.period)}
              </text>
            </g>
          )
        })}
      </svg>
      <div className={styles.legend}>
        <span><i className={styles.valueKey} /> 可比机构合计持仓市值</span>
        <span><i className={styles.churnKey} /> 平均季度波动强度</span>
      </div>
    </div>
  )
}

function CompanyHoldingTimeline({
  company,
}: {
  company: Company
}) {
  const [activeIndex, setActiveIndex] = useState(company.series.length - 1)
  const width = 920
  const height = 342
  const top = 26
  const chartHeight = 238
  const xPadding = 58
  const valueMax = Math.max(...company.series.map((item) => item.value), 1)
  const holderValues = company.series.map((item) => item.holders)
  const holderMin = Math.min(...holderValues)
  const holderMax = Math.max(...holderValues)
  const holderSpread = holderMax - holderMin || 1
  const plotWidth = width - xPadding * 2
  const barWidth = Math.max(18, plotWidth / company.series.length - 18)
  const activePoint = company.series[activeIndex] || company.series[company.series.length - 1]

  const xForIndex = (index: number) =>
    company.series.length === 1 ? width / 2 : xPadding + (index / (company.series.length - 1)) * plotWidth

  const yForValue = (value: number) => top + chartHeight - (value / valueMax) * chartHeight
  const yForHolders = (holders: number) => top + chartHeight - ((holders - holderMin) / holderSpread) * chartHeight
  const holderLine = company.series
    .map((point, index) => `${xForIndex(index).toFixed(1)},${yForHolders(point.holders).toFixed(1)}`)
    .join(' ')
  const activeX = xForIndex(activeIndex)
  const activeValueY = yForValue(activePoint.value)
  const activeHolderY = yForHolders(activePoint.holders)

  return (
    <div className={styles.companyTimeline}>
      <div className={styles.timelineHeader}>
        <div>
          <p className={styles.eyebrow}>Company time series</p>
          <h4>{company.issuer}</h4>
        </div>
        <p>
          每个季度统计这 20 家样本机构里，持有该 CUSIP 的机构数和合计 reported value。
        </p>
      </div>
      <div className={styles.timelineReadout}>
        <span><strong>{formatPeriod(activePoint.period)}</strong> selected quarter</span>
        <span><strong>{formatUsd(activePoint.value)}</strong> aggregate value</span>
        <span><strong>{activePoint.holders}</strong> holding institutions</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${company.issuer} holders and value over time`}>
        <title>{company.issuer} quarterly holders and aggregate reported value</title>
        {[0, 1, 2, 3].map((line) => (
          <line
            key={line}
            x1="0"
            x2={width}
            y1={top + (line / 3) * chartHeight}
            y2={top + (line / 3) * chartHeight}
            className={styles.gridLine}
          />
        ))}
        <text x={xPadding} y={18} className={styles.timelineAxisLabel}>
          {formatUsd(valueMax)}
        </text>
        <text x={width - xPadding} y={18} textAnchor="end" className={styles.timelineAxisLabel}>
          {holderMax} funds
        </text>
        {company.series.map((point, index) => {
          const x = xForIndex(index)
          const barHeight = chartHeight - (yForValue(point.value) - top)
          const isActive = index === activeIndex
          return (
            <g key={point.period}>
              <rect
                x={x - barWidth / 2}
                y={top + chartHeight - barHeight}
                width={barWidth}
                height={Math.max(barHeight, 2)}
                className={isActive ? styles.timelineBarActive : styles.timelineBar}
              />
              <title>
                {formatPeriod(point.period)}: {formatUsd(point.value)}, {point.holders} institutions
              </title>
            </g>
          )
        })}
        <polyline points={holderLine} className={styles.holderLine} />
        <line x1={activeX} x2={activeX} y1={top} y2={top + chartHeight} className={styles.timelineCursor} />
        <circle cx={activeX} cy={activeValueY} r="6" className={styles.valuePoint} />
        <circle cx={activeX} cy={activeHolderY} r="7" className={styles.holderPoint} />
        {company.series.map((point, index) => {
          const x = xForIndex(index)
          return (
            <g
              key={`${point.period}-hit`}
              role="button"
              tabIndex={0}
              aria-label={`${formatPeriod(point.period)} ${formatUsd(point.value)} ${point.holders} institutions`}
              onMouseEnter={() => setActiveIndex(index)}
              onFocus={() => setActiveIndex(index)}
              onClick={() => setActiveIndex(index)}
            >
              <rect
                x={index === 0 ? 0 : x - plotWidth / (company.series.length - 1) / 2}
                y={top}
                width={index === 0 || index === company.series.length - 1 ? plotWidth / company.series.length : plotWidth / (company.series.length - 1)}
                height={chartHeight}
                className={styles.timelineHitArea}
              />
              <text x={x} y={height - 18} textAnchor="middle" className={styles.axisText}>
                {formatShortPeriod(point.period)}
              </text>
            </g>
          )
        })}
      </svg>
      <div className={styles.legend}>
        <span><i className={styles.valueKey} /> 合计持仓金额</span>
        <span><i className={styles.holderKey} /> 持仓机构数</span>
      </div>
    </div>
  )
}

function CompanyBreakdownChart({
  company,
}: {
  company: Company
}) {
  const managers = company.managerBreakdown.slice(0, 8)
  const width = 840
  const height = 250
  const xPadding = 44
  const maxValue = Math.max(
    ...managers.flatMap((manager) => manager.series.map((point) => point.value)),
    1,
  )

  return (
    <div className={styles.breakdownChart} aria-label={`${company.issuer} manager breakdown over time`}>
      <svg viewBox={`0 0 ${width} ${height + 48}`} role="img">
        <title>{company.issuer} institution breakdown over time</title>
        {[0, 1, 2, 3].map((line) => (
          <line
            key={line}
            x1="0"
            x2={width}
            y1={(line / 3) * height}
            y2={(line / 3) * height}
            className={styles.gridLine}
          />
        ))}
        {managers.map((manager, index) => (
          <polyline
            key={manager.id}
            points={absoluteLinePoints(
              manager.series.map((point) => point.value),
              width,
              height,
              xPadding,
              maxValue,
            )}
            className={styles.breakdownLine}
            style={{ stroke: managerColors[index % managerColors.length] }}
          />
        ))}
        {company.series.map((item, index) => {
          const x =
            company.series.length === 1
              ? width / 2
              : xPadding + (index / (company.series.length - 1)) * (width - xPadding * 2)
          return (
            <text key={item.period} x={x} y={height + 34} textAnchor="middle" className={styles.axisText}>
              {formatShortPeriod(item.period)}
            </text>
          )
        })}
      </svg>
      <div className={styles.breakdownLegend}>
        {managers.map((manager, index) => (
          <span key={manager.id}>
            <i style={{ backgroundColor: managerColors[index % managerColors.length] }} />
            {manager.name}
          </span>
        ))}
      </div>
    </div>
  )
}

function LatestHolderBars({
  managers,
  totalValue,
}: {
  managers: CompanyManager[]
  totalValue: number
}) {
  const denominator = totalValue || Math.max(...managers.map((manager) => manager.latestValue), 1)

  return (
    <div className={styles.holderBars} aria-label="Latest top holders">
      {managers.slice(0, 10).map((manager, index) => (
        <div key={manager.id}>
          <div>
            <strong>{manager.name}</strong>
            <span>{formatUsd(manager.latestValue)} / {formatPercent(manager.latestValue / denominator)}</span>
          </div>
          <em>
            <i
              style={{
                width: `${Math.max(2, (manager.latestValue / denominator) * 100)}%`,
                backgroundColor: managerColors[index % managerColors.length],
              }}
            />
          </em>
        </div>
      ))}
    </div>
  )
}

function ManagerBreakdownTable({
  company,
}: {
  company: Company
}) {
  const managers = company.managerBreakdown.slice(0, 10)

  return (
    <div className={styles.breakdownTableScroller}>
      <table className={styles.breakdownTable}>
        <thead>
          <tr>
            <th>机构</th>
            {company.series.map((point) => (
              <th key={point.period}>{formatShortPeriod(point.period)}</th>
            ))}
            <th>Latest</th>
          </tr>
        </thead>
        <tbody>
          {managers.map((manager) => {
            const maxValue = manager.maxValue || 1
            return (
              <tr key={manager.id}>
                <th>
                  <span>{manager.name}</span>
                  <small>{manager.category}</small>
                </th>
                {manager.series.map((point) => (
                  <td key={`${manager.id}-${point.period}`}>
                    <span
                      className={styles.breakdownCell}
                      style={{ opacity: 0.22 + (point.value / maxValue) * 0.78 }}
                      title={`${manager.name} ${formatPeriod(point.period)}: ${formatUsd(point.value)} (${formatPercent(point.share)})`}
                    >
                      {point.value > 0 ? formatPercent(point.share).replace('%', '') : '—'}
                    </span>
                  </td>
                ))}
                <td className={styles.breakdownLatest}>{formatUsd(manager.latestValue)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function churnColor(rate: number, missing: boolean): CSSProperties {
  if (missing) {
    return { backgroundColor: 'rgba(120, 128, 122, 0.12)' }
  }

  const clamped = Math.min(Math.max(rate, 0), 1)
  const red = Math.round(22 + clamped * 207)
  const green = Math.round(121 + clamped * 53)
  const blue = Math.round(117 - clamped * 80)

  return {
    backgroundColor: `rgba(${red}, ${green}, ${blue}, ${0.14 + clamped * 0.62})`,
  }
}

function ManagerHeatmap({
  managers,
  periods,
}: {
  managers: Manager[]
  periods: string[]
}) {
  const sorted = [...managers].sort((a, b) => b.averageChurnRate - a.averageChurnRate)

  return (
    <div className={styles.heatmapScroller}>
      <table className={styles.heatmap}>
        <thead>
          <tr>
            <th>机构</th>
            {periods.map((period) => (
              <th key={period}>{formatShortPeriod(period)}</th>
            ))}
            <th>Avg</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((manager) => (
            <tr key={manager.id}>
              <th>
                <span>{manager.name}</span>
                <small>{manager.category}</small>
              </th>
              {manager.quarters.map((quarter) => (
                <td key={quarter.period}>
                  <span
                    className={styles.heatCell}
                    style={churnColor(quarter.churnRate, quarter.missing)}
                    title={
                      quarter.missing
                        ? `${manager.name} missing ${formatPeriod(quarter.period)}`
                        : `${manager.name} ${formatPeriod(quarter.period)}: ${formatPercent(quarter.churnRate)} reported swing`
                    }
                  >
                    {quarter.missing ? '—' : Math.round(quarter.churnRate * 100)}
                  </span>
                </td>
              ))}
              <td className={styles.avgCell}>{formatPercent(manager.averageChurnRate)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function CompanyExplorer({
  companies,
}: {
  companies: Company[]
}) {
  const [selectedCusip, setSelectedCusip] = useState(companies[0]?.cusip || '')
  const [query, setQuery] = useState('')
  const selected = useMemo(
    () => companies.find((company) => company.cusip === selectedCusip) || companies[0],
    [companies, selectedCusip],
  )
  const filteredCompanies = useMemo(() => {
    const normalized = query.trim().toLowerCase()

    if (!normalized) {
      return companies
    }

    return companies.filter((company) =>
      [company.issuer, company.cusip, company.title].some((value) => value.toLowerCase().includes(normalized)),
    )
  }, [companies, query])

  if (!selected) {
    return null
  }

  return (
    <div className={styles.companyExplorer}>
      <div className={styles.companyList} aria-label="Most volatile holdings">
        <div className={styles.companySearch}>
          <input
            aria-label="Search companies"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search company / CUSIP"
          />
          <span>{filteredCompanies.length} companies</span>
        </div>
        {filteredCompanies.map((company, index) => (
          <button
            key={company.cusip}
            type="button"
            className={`${styles.companyRow} ${selected.cusip === company.cusip ? styles.companyRowActive : ''}`}
            onClick={() => setSelectedCusip(company.cusip)}
          >
            <span>{String(index + 1).padStart(2, '0')}</span>
            <strong>{company.issuer}</strong>
            <div className={styles.companyRowMeta}>
              <span>{formatUsd(company.latestValue)}</span>
              <em>{company.latestHolders} holders</em>
            </div>
          </button>
        ))}
        {filteredCompanies.length === 0 && (
          <p className={styles.emptyCompanySearch}>No matching company</p>
        )}
      </div>

      <div className={styles.companyDetail}>
        <div>
          <p className={styles.eyebrow}>{selected.cusip} / {selected.title}</p>
          <h3>{selected.issuer}</h3>
          <p>
            三年内最大季度合计持仓变动为 {formatUsd(selected.maxAbsQoqDelta)}。
            主图聚焦该公司的季度持仓机构数和合计金额。
          </p>
        </div>
        <CompanyHoldingTimeline company={selected} />
        <div className={styles.companyMetrics}>
          <span><strong>{formatUsd(selected.latestValue)}</strong> latest value</span>
          <span><strong>{selected.latestHolders}</strong> latest holders</span>
          <span><strong>{formatUsd(selected.maxValue)}</strong> peak value</span>
          <span><strong>{formatUsd(selected.maxAbsQoqDelta)}</strong> max q/q move</span>
        </div>
        <div className={styles.breakdownSection}>
          <div className={styles.breakdownHeader}>
            <div>
              <p className={styles.eyebrow}>Institution breakdown</p>
              <h4>机构拆分和时间波动</h4>
            </div>
            <p>
              折线展示前 8 大机构随季度变化；热力表里的数字是该机构占这 20 家合计持仓的百分比。
            </p>
          </div>
          <CompanyBreakdownChart company={selected} />
          <div className={styles.breakdownGrid}>
            <LatestHolderBars managers={selected.managerBreakdown} totalValue={selected.latestValue} />
            <ManagerBreakdownTable company={selected} />
          </div>
        </div>
        <div className={styles.eventList}>
          {selected.notableEvents.map((event) => (
            <div key={`${selected.cusip}-${event.period}`}>
              <span>{formatPeriod(event.period)}</span>
              <strong>{formatUsd(event.delta)}</strong>
              <em>{event.holderDelta > 0 ? '+' : ''}{event.holderDelta} holders</em>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function RecentMoves({
  moves,
  period,
}: {
  moves: Move[]
  period: string
}) {
  const topMoves = moves.slice(0, 16)
  const maxAbs = Math.max(...topMoves.map((move) => Math.abs(move.netChange)), 1)

  return (
    <div className={styles.movesList}>
      <div className={styles.movesHeader}>
        <span>{formatPeriod(period)} vs prior quarter</span>
        <span>Net reported value change</span>
      </div>
      {topMoves.map((move) => {
        const width = `${(Math.abs(move.netChange) / maxAbs) * 100}%`
        const positive = move.netChange >= 0
        return (
          <div key={move.cusip} className={styles.moveRow}>
            <div>
              <strong>{move.issuer}</strong>
              <span>{move.buyerCount} buyers / {move.sellerCount} sellers</span>
            </div>
            <div className={styles.moveBarTrack}>
              <span
                className={positive ? styles.moveBarPositive : styles.moveBarNegative}
                style={{ width }}
              />
            </div>
            <em className={positive ? styles.positive : styles.negative}>{formatUsd(move.netChange)}</em>
          </div>
        )
      })}
    </div>
  )
}

export function ThirteenFReport() {
  const [view, setView] = useState<View>('overview')
  const data = analysisData
  const latestAggregate = data.aggregateSeries[data.aggregateSeries.length - 1]
  const comparableAggregateSeries = useMemo(() => {
    const latestPeriod = data.universe.endPeriod
    const comparableManagers = data.managers.filter((manager) => {
      const latestQuarter = manager.quarters.find((quarter) => quarter.period === latestPeriod)
      return latestQuarter && !latestQuarter.missing
    })

    return data.universe.periods.map((period) => {
      const quarters = comparableManagers
        .map((manager) => manager.quarters.find((quarter) => quarter.period === period))
        .filter((quarter): quarter is Manager['quarters'][number] => Boolean(quarter && !quarter.missing))

      const totalValue = quarters.reduce((sum, quarter) => sum + quarter.totalValue, 0)
      const averageChurnRate =
        quarters.length > 0
          ? quarters.reduce((sum, quarter) => sum + quarter.churnRate, 0) / quarters.length
          : 0

      return {
        period,
        totalValue,
        reportingManagers: quarters.length,
        positionCount: quarters.reduce((sum, quarter) => sum + quarter.positionCount, 0),
        grossChange: quarters.reduce((sum, quarter) => sum + quarter.grossChange, 0),
        averageChurnRate,
      }
    })
  }, [data])
  const firstComparableAggregate = comparableAggregateSeries[0]
  const latestComparableAggregate = comparableAggregateSeries[comparableAggregateSeries.length - 1]
  const totalChange =
    (latestComparableAggregate.totalValue - firstComparableAggregate.totalValue) /
    firstComparableAggregate.totalValue
  const topChurnManagers = [...data.managers]
    .sort((a, b) => b.averageChurnRate - a.averageChurnRate)
    .slice(0, 6)
  const largestRecentMove = data.recentMoves[0]

  return (
    <section className={styles.report} aria-label="13F institutional holdings analysis">
      <div className={styles.reportHero}>
        <div>
          <p className={styles.eyebrow}>SEC 13F / 20 managers / 12 quarters</p>
          <h2>机构持仓波动地图</h2>
          <p>
            数据窗口为 {formatPeriod(data.universe.startPeriod)} 到 {formatPeriod(data.universe.endPeriod)}。
            最新季末覆盖 {latestAggregate.reportingManagers}/20 家机构，Vanguard Group 老 CIK 最新停在 2025 Q4。
          </p>
        </div>
        <div className={styles.metricGrid}>
          <div>
            <span>{formatUsd(latestAggregate.totalValue)}</span>
            <p>latest aggregate 13F value</p>
          </div>
          <div>
            <span>{formatPercent(totalChange)}</span>
            <p>three-year aggregate change</p>
          </div>
          <div>
            <span>{data.volatileHoldings.length}</span>
            <p>high-volatility CUSIPs retained</p>
          </div>
          <div>
            <span>{formatUsd(largestRecentMove?.netChange || 0)}</span>
            <p>largest latest-quarter net move</p>
          </div>
        </div>
      </div>

      <div className={styles.viewSwitch} role="tablist" aria-label="13F report sections">
        {views.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={view === item.id}
            className={view === item.id ? styles.viewButtonActive : styles.viewButton}
            onClick={() => setView(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {view === 'overview' && (
        <div className={styles.reportSection}>
          <div className={styles.sectionHead}>
            <div>
              <p className={styles.eyebrow}>Aggregate trend</p>
              <h3>被动巨头决定底色，交易型机构制造波峰。</h3>
            </div>
            <p>
              合计市值线按最新季有 filing 的 19 家机构回看，避免 Vanguard 缺口造成断崖；它仍同时包含市场价格、
              净申赎、买卖和管理人覆盖变化。
            </p>
          </div>
          <TrendChart series={comparableAggregateSeries} />
          <div className={styles.managerStrip}>
            {topChurnManagers.map((manager) => (
              <div key={manager.id}>
                <span>{formatPercent(manager.averageChurnRate)}</span>
                <strong>{manager.name}</strong>
                <p>{manager.category}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {view === 'managers' && (
        <div className={styles.reportSection}>
          <div className={styles.sectionHead}>
            <div>
              <p className={styles.eyebrow}>Manager heatmap</p>
              <h3>季度 reported-value swing 的热力图。</h3>
            </div>
            <p>
              数字是 gross reported value change / 前后两个季度平均组合市值。深色代表组合报告值变化更大。
            </p>
          </div>
          <ManagerHeatmap managers={data.managers} periods={data.universe.periods} />
        </div>
      )}

      {view === 'companies' && (
        <div className={styles.reportSection}>
          <div className={styles.sectionHead}>
            <div>
              <p className={styles.eyebrow}>Company volatility</p>
              <h3>哪些公司在 20 家机构里反复出现大幅波动。</h3>
            </div>
            <p>
              排名按规模、最大季度变化、事件次数和区间波动综合计算；同一家公司不同 share class 仍按 CUSIP 分开。
            </p>
          </div>
          <CompanyExplorer companies={data.volatileHoldings} />
        </div>
      )}

      {view === 'moves' && (
        <div className={styles.reportSection}>
          <div className={styles.sectionHead}>
            <div>
              <p className={styles.eyebrow}>Latest quarter</p>
              <h3>{formatPeriod(data.universe.latestComparisonPeriod)} 的最大净变化。</h3>
            </div>
            <p>
              仅比较本季和上一季都有 filing 的机构，因此最新季不包含 Vanguard Group 老 CIK。
            </p>
          </div>
          <RecentMoves moves={data.recentMoves} period={data.universe.latestComparisonPeriod} />
        </div>
      )}
    </section>
  )
}
