const fs = require('fs')
const path = require('path')

const USER_AGENT = 'LittlemoonResearch/1.0 yuhangxiaocs@gmail.com'
const CACHE_DIR = path.join(process.cwd(), '.cache', '13f')
const OUTPUT_PATH = path.join(process.cwd(), 'data', '13f-analysis.json')

const MANAGERS = [
  { id: 'berkshire', name: 'Berkshire Hathaway', cik: '1067983', category: 'Concentrated' },
  { id: 'vanguard', name: 'Vanguard Group', cik: '102909', category: 'Index core' },
  { id: 'blackrock', name: 'BlackRock', cik: '2012383', ciks: ['2012383', '1364742'], category: 'Index core' },
  { id: 'state-street', name: 'State Street', cik: '93751', category: 'Index core' },
  { id: 'fmr', name: 'FMR', cik: '315066', category: 'Active core' },
  { id: 'jpmorgan', name: 'JPMorgan Chase', cik: '19617', category: 'Bank platform' },
  { id: 'morgan-stanley', name: 'Morgan Stanley', cik: '895421', category: 'Bank platform' },
  { id: 'goldman-sachs', name: 'Goldman Sachs', cik: '886982', category: 'Bank platform' },
  { id: 'bank-of-america', name: 'Bank of America', cik: '70858', category: 'Bank platform' },
  { id: 'citadel', name: 'Citadel Advisors', cik: '1423053', category: 'Multi-strategy' },
  { id: 'millennium', name: 'Millennium Management', cik: '1273087', category: 'Multi-strategy' },
  { id: 'bridgewater', name: 'Bridgewater Associates', cik: '1350694', category: 'Macro' },
  { id: 'renaissance', name: 'Renaissance Technologies', cik: '1037389', category: 'Quant' },
  { id: 'de-shaw', name: 'D. E. Shaw', cik: '1009207', category: 'Quant' },
  { id: 'two-sigma', name: 'Two Sigma Investments', cik: '1179392', category: 'Quant' },
  { id: 'tiger-global', name: 'Tiger Global', cik: '1167483', category: 'Growth hedge fund' },
  { id: 'coatue', name: 'Coatue Management', cik: '1135730', category: 'Growth hedge fund' },
  { id: 'third-point', name: 'Third Point', cik: '1040273', category: 'Activist/event' },
  { id: 'pershing-square', name: 'Pershing Square', cik: '1336528', category: 'Concentrated' },
  { id: 'appaloosa', name: 'Appaloosa', cik: '1656456', category: 'Opportunistic' },
]

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function ensureDirectory(directory) {
  fs.mkdirSync(directory, { recursive: true })
}

function padCik(cik) {
  return String(cik).padStart(10, '0')
}

function unpaddedCik(cik) {
  return String(Number(cik))
}

function accessionDirectory(accession) {
  return accession.replaceAll('-', '')
}

function cachePathForUrl(url) {
  const safe = url
    .replace(/^https?:\/\//, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .slice(0, 220)

  return path.join(CACHE_DIR, safe)
}

async function fetchCached(url, accept = 'text/xml,application/xml,application/json,text/plain,*/*') {
  ensureDirectory(CACHE_DIR)
  const cachePath = cachePathForUrl(url)

  if (fs.existsSync(cachePath)) {
    return fs.readFileSync(cachePath, 'utf8')
  }

  const response = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      Accept: accept,
    },
  })

  if (!response.ok) {
    throw new Error(`SEC request failed: ${response.status} ${response.statusText} ${url}`)
  }

  const text = await response.text()
  fs.writeFileSync(cachePath, text)
  await sleep(140)
  return text
}

function decodeXml(value) {
  return String(value || '')
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&apos;', "'")
    .trim()
}

function normalizeIssuer(value) {
  return decodeXml(value)
    .replace(/\s+/g, ' ')
    .replace(/,\s*$/, '')
    .trim()
}

function normalizePeriod(value) {
  const raw = decodeXml(value)
  const match = raw.match(/^(\d{2})-(\d{2})-(\d{4})$/)
  if (!match) {
    return raw
  }

  return `${match[3]}-${match[1]}-${match[2]}`
}

function tagValue(xml, tagName) {
  const pattern = new RegExp(`<[^<>:]*:?${tagName}\\b[^>]*>([\\s\\S]*?)<\\/[^<>:]*:?${tagName}>`, 'i')
  const match = xml.match(pattern)
  return match ? decodeXml(match[1]) : ''
}

function numericTag(xml, tagName) {
  const value = tagValue(xml, tagName).replaceAll(',', '')
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function parseAtomEntries(xml) {
  return [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/gi)]
    .map((match) => {
      const block = match[1]
      const filingType = tagValue(block, 'filing-type')
      const accession = tagValue(block, 'accession-number')
      const filingDate = tagValue(block, 'filing-date')
      const href = tagValue(block, 'filing-href')

      return {
        accession,
        filingDate,
        filingType,
        href,
      }
    })
    .filter((entry) => entry.accession && /^13F-HR(?:\/A)?$/.test(entry.filingType))
}

function findInfoTableFile(indexJson) {
  const parsed = JSON.parse(indexJson)
  const items = parsed.directory?.item || []
  const xmlFiles = items
    .filter((item) => item.name && item.name.endsWith('.xml') && item.name !== 'primary_doc.xml')
    .filter((item) => !item.name.toLowerCase().includes('primary'))
    .sort((a, b) => Number(b.size || 0) - Number(a.size || 0))

  if (!xmlFiles.length) {
    throw new Error(`No information-table XML found in ${parsed.directory?.name || 'filing index'}`)
  }

  return xmlFiles[0].name
}

function parseInfoTable(xml) {
  const blocks = [...xml.matchAll(/<[^<>:]*:?infoTable\b[^>]*>([\s\S]*?)<\/[^<>:]*:?infoTable>/gi)]
  const holdings = new Map()
  let sourceEntryCount = 0
  let excludedOptionCount = 0

  for (const match of blocks) {
    sourceEntryCount += 1
    const block = match[1]
    const putCall = tagValue(block, 'putCall')
    if (putCall) {
      excludedOptionCount += 1
      continue
    }

    const cusip = tagValue(block, 'cusip').toUpperCase()
    const issuer = normalizeIssuer(tagValue(block, 'nameOfIssuer'))
    const title = normalizeIssuer(tagValue(block, 'titleOfClass'))
    const value = numericTag(block, 'value')
    const shares = numericTag(block, 'sshPrnamt')

    if (!cusip || !issuer || value <= 0) {
      continue
    }

    const key = cusip
    const existing = holdings.get(key)
    if (existing) {
      existing.value += value
      existing.shares += shares
      if (!existing.title && title) {
        existing.title = title
      }
    } else {
      holdings.set(key, {
        cusip,
        issuer,
        title,
        value,
        shares,
      })
    }
  }

  return {
    holdings: [...holdings.values()],
    sourceEntryCount,
    excludedOptionCount,
  }
}

async function fetchFiling(manager, entry) {
  const cikPath = unpaddedCik(entry.cik || manager.cik)
  const directory = accessionDirectory(entry.accession)
  const baseUrl = `https://www.sec.gov/Archives/edgar/data/${cikPath}/${directory}`
  const indexJson = await fetchCached(`${baseUrl}/index.json`, 'application/json,*/*')
  const infoTableFile = findInfoTableFile(indexJson)
  const [primaryDoc, infoTableXml] = await Promise.all([
    fetchCached(`${baseUrl}/primary_doc.xml`),
    fetchCached(`${baseUrl}/${infoTableFile}`),
  ])

  const period = normalizePeriod(tagValue(primaryDoc, 'periodOfReport') || tagValue(primaryDoc, 'reportCalendarOrQuarter'))
  const isAmendment = tagValue(primaryDoc, 'isAmendment').toLowerCase() === 'true'
  const amendmentType = tagValue(primaryDoc, 'amendmentType').toUpperCase()
  const tableValueTotal = numericTag(primaryDoc, 'tableValueTotal')
  const tableEntryTotal = numericTag(primaryDoc, 'tableEntryTotal')
  const filingManager = tagValue(primaryDoc, 'name')
  const parsed = parseInfoTable(infoTableXml)
  const totalValue = parsed.holdings.reduce((sum, holding) => sum + holding.value, 0)

  return {
    period,
    formType: entry.filingType,
    isAmendment,
    amendmentType,
    filingDate: entry.filingDate,
    accession: entry.accession,
    sourceUrl: `${baseUrl}/${infoTableFile}`,
    indexUrl: `${baseUrl}/${entry.accession}-index.html`,
    filingManager,
    tableValueTotal,
    tableEntryTotal,
    totalValue,
    positionCount: parsed.holdings.length,
    sourceEntryCount: parsed.sourceEntryCount,
    excludedOptionCount: parsed.excludedOptionCount,
    holdings: parsed.holdings,
  }
}

function shouldUseFiling(existing, candidate) {
  if (!existing) {
    return !candidate.isAmendment || candidate.amendmentType === 'RESTATEMENT'
  }

  if (candidate.isAmendment) {
    return (
      candidate.amendmentType === 'RESTATEMENT' &&
      candidate.filingDate >= existing.filingDate &&
      candidate.tableValueTotal >= existing.tableValueTotal * 0.75
    )
  }

  if (existing.isAmendment && existing.amendmentType !== 'RESTATEMENT') {
    return true
  }

  return !existing.isAmendment && candidate.filingDate > existing.filingDate
}

async function fetchManagerFilings(manager, filingLimit = 60, candidateLimit = 34) {
  const ciks = manager.ciks || [manager.cik]
  const entries = []
  for (const cik of ciks) {
    const url = `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${cik}&type=13F-HR&owner=exclude&count=${filingLimit}&output=atom`
    const atom = await fetchCached(url, 'application/atom+xml,text/xml,*/*')
    entries.push(...parseAtomEntries(atom).map((entry) => ({ ...entry, cik })))
  }

  entries.sort((a, b) => {
    const dateDiff = Date.parse(b.filingDate) - Date.parse(a.filingDate)
    if (dateDiff !== 0) {
      return dateDiff
    }

    return a.filingType === '13F-HR' ? -1 : 1
  })

  const filingsByPeriod = new Map()

  for (const entry of entries.slice(0, candidateLimit)) {
    const filing = await fetchFiling(manager, entry)
    const previous = filingsByPeriod.get(filing.period)
    if (shouldUseFiling(previous, filing)) {
      filingsByPeriod.set(filing.period, filing)
    }
  }

  return [...filingsByPeriod.values()]
    .sort((a, b) => Date.parse(a.period) - Date.parse(b.period))
    .slice(-12)
}

function dollars(value) {
  return Math.round(value)
}

function percentChange(current, previous) {
  if (previous === 0 && current === 0) {
    return 0
  }

  if (previous === 0) {
    return current > 0 ? null : 0
  }

  return (current - previous) / previous
}

function buildManagerSeries(manager, filings, periods) {
  const byPeriod = new Map(filings.map((filing) => [filing.period, filing]))
  const holdingsByPeriod = new Map(
    filings.map((filing) => [
      filing.period,
      new Map(filing.holdings.map((holding) => [holding.cusip, holding])),
    ]),
  )

  const quarters = periods.map((period, index) => {
    const filing = byPeriod.get(period)
    const currentHoldings = holdingsByPeriod.get(period) || new Map()
    const previousPeriod = periods[index - 1]
    const previousHoldings = previousPeriod ? holdingsByPeriod.get(previousPeriod) || new Map() : new Map()
    const allKeys = new Set([...currentHoldings.keys(), ...previousHoldings.keys()])
    let grossChange = 0
    let netChange = 0
    let initiations = 0
    let exits = 0

    for (const key of allKeys) {
      const current = currentHoldings.get(key)?.value || 0
      const previous = previousHoldings.get(key)?.value || 0
      const delta = current - previous
      grossChange += Math.abs(delta)
      netChange += delta

      if (current > 0 && previous === 0) {
        initiations += 1
      }

      if (current === 0 && previous > 0) {
        exits += 1
      }
    }

    const previousValue = previousPeriod ? byPeriod.get(previousPeriod)?.totalValue || 0 : 0
    const denominator = (Number(filing?.totalValue || 0) + previousValue) / 2

    return {
      period,
      totalValue: dollars(filing?.totalValue || 0),
      positionCount: filing?.positionCount || 0,
      filingDate: filing?.filingDate || null,
      accession: filing?.accession || null,
      missing: !filing,
      grossChange: dollars(grossChange),
      netChange: dollars(netChange),
      churnRate: denominator > 0 ? grossChange / denominator : 0,
      initiations,
      exits,
    }
  })

  const availableChurn = quarters
    .filter((quarter) => !quarter.missing && quarter.grossChange > 0)
    .map((quarter) => quarter.churnRate)

  const latest = [...filings].sort((a, b) => Date.parse(b.period) - Date.parse(a.period))[0]

  return {
    id: manager.id,
    name: manager.name,
    cik: padCik(manager.cik),
    ciks: (manager.ciks || [manager.cik]).map(padCik),
    category: manager.category,
    latestPeriod: latest?.period || null,
    latestFilingDate: latest?.filingDate || null,
    latestTotalValue: dollars(latest?.totalValue || 0),
    latestPositionCount: latest?.positionCount || 0,
    coverageCount: filings.length,
    averageChurnRate:
      availableChurn.length > 0
        ? availableChurn.reduce((sum, value) => sum + value, 0) / availableChurn.length
        : 0,
    quarters,
    filings: filings.map((filing) => ({
      period: filing.period,
      formType: filing.formType,
      isAmendment: filing.isAmendment,
      amendmentType: filing.amendmentType,
      filingDate: filing.filingDate,
      accession: filing.accession,
      sourceUrl: filing.sourceUrl,
      indexUrl: filing.indexUrl,
      filingManager: filing.filingManager,
      tableValueTotal: dollars(filing.tableValueTotal),
      totalValue: dollars(filing.totalValue),
      positionCount: filing.positionCount,
      sourceEntryCount: filing.sourceEntryCount,
      excludedOptionCount: filing.excludedOptionCount,
    })),
  }
}

function buildAggregateSeries(managerFilings, periods) {
  return periods.map((period) => {
    let totalValue = 0
    let holderFilings = 0
    let positionCount = 0
    let grossChange = 0
    let averageChurnRate = 0
    let churnManagers = 0

    for (const manager of managerFilings) {
      const series = manager.series.quarters.find((quarter) => quarter.period === period)
      if (!series || series.missing) {
        continue
      }

      holderFilings += 1
      totalValue += series.totalValue
      positionCount += series.positionCount
      grossChange += series.grossChange

      if (series.grossChange > 0) {
        averageChurnRate += series.churnRate
        churnManagers += 1
      }
    }

    return {
      period,
      totalValue: dollars(totalValue),
      reportingManagers: holderFilings,
      positionCount,
      grossChange: dollars(grossChange),
      averageChurnRate: churnManagers ? averageChurnRate / churnManagers : 0,
    }
  })
}

function buildCompanyStats(managerFilings, periods) {
  const managerById = new Map(
    managerFilings.map((manager) => [
      manager.id,
      {
        id: manager.id,
        name: manager.name,
        category: manager.category,
      },
    ]),
  )
  const companyMap = new Map()

  for (const manager of managerFilings) {
    for (const filing of manager.filings) {
      for (const holding of filing.holdings) {
        if (!companyMap.has(holding.cusip)) {
          companyMap.set(holding.cusip, {
            cusip: holding.cusip,
            issuer: holding.issuer,
            title: holding.title,
            valuesByPeriod: new Map(),
            managersByPeriod: new Map(),
            managerValues: new Map(),
          })
        }

        const company = companyMap.get(holding.cusip)
        company.valuesByPeriod.set(
          filing.period,
          (company.valuesByPeriod.get(filing.period) || 0) + holding.value,
        )

        if (!company.managersByPeriod.has(filing.period)) {
          company.managersByPeriod.set(filing.period, new Set())
        }
        company.managersByPeriod.get(filing.period).add(manager.id)

        const managerKey = `${manager.id}:${filing.period}`
        company.managerValues.set(managerKey, (company.managerValues.get(managerKey) || 0) + holding.value)
      }
    }
  }

  const companies = []
  for (const company of companyMap.values()) {
    const values = periods.map((period) => company.valuesByPeriod.get(period) || 0)
    const holders = periods.map((period) => company.managersByPeriod.get(period)?.size || 0)
    const maxValue = Math.max(...values)
    const minPositiveValue = Math.min(...values.filter((value) => value > 0))
    const latestValue = values.at(-1) || 0
    const latestHolders = holders.at(-1) || 0
    let eventCount = 0
    let maxAbsQoqDelta = 0
    let averageAbsQoqPct = 0
    let pctCount = 0
    const events = []

    for (let index = 1; index < periods.length; index += 1) {
      const previous = values[index - 1]
      const current = values[index]
      const delta = current - previous
      const absDelta = Math.abs(delta)
      const pct = percentChange(current, previous)
      maxAbsQoqDelta = Math.max(maxAbsQoqDelta, absDelta)

      if (pct !== null && Number.isFinite(pct)) {
        averageAbsQoqPct += Math.abs(pct)
        pctCount += 1
      }

      const holderDelta = holders[index] - holders[index - 1]
      if ((previous === 0 && current >= 250_000_000) || absDelta >= 1_000_000_000 || Math.abs(holderDelta) >= 3) {
        eventCount += 1
        events.push({
          period: periods[index],
          delta: dollars(delta),
          percentChange: pct,
          holderDelta,
          value: dollars(current),
        })
      }
    }

    if (maxValue < 750_000_000) {
      continue
    }

    const valueRangeRatio = minPositiveValue > 0 ? maxValue / minPositiveValue : maxValue > 0 ? 99 : 0
    const volatilityScore =
      Math.log10(maxValue + 1) *
      (1 + Math.log10(maxAbsQoqDelta + 1) / 10) *
      (1 + eventCount / 6) *
      (1 + Math.min(valueRangeRatio, 12) / 18)
    const managerBreakdown = [...managerById.values()]
      .map((manager) => {
        const managerValues = periods.map(
          (period) => company.managerValues.get(`${manager.id}:${period}`) || 0,
        )
        const managerMaxValue = Math.max(...managerValues)
        const managerLatestValue = managerValues.at(-1) || 0
        const managerFirstValue = managerValues[0] || 0

        return {
          ...manager,
          latestValue: dollars(managerLatestValue),
          maxValue: dollars(managerMaxValue),
          totalChange: dollars(managerLatestValue - managerFirstValue),
          series: periods.map((period, index) => ({
            period,
            value: dollars(managerValues[index]),
            share: values[index] > 0 ? managerValues[index] / values[index] : 0,
          })),
        }
      })
      .filter((manager) => manager.maxValue > 0)
      .sort((a, b) => {
        const latestDiff = b.latestValue - a.latestValue
        if (latestDiff !== 0) {
          return latestDiff
        }

        return b.maxValue - a.maxValue
      })

    companies.push({
      cusip: company.cusip,
      issuer: company.issuer,
      title: company.title,
      latestValue: dollars(latestValue),
      latestHolders,
      maxValue: dollars(maxValue),
      minPositiveValue: dollars(Number.isFinite(minPositiveValue) ? minPositiveValue : 0),
      maxAbsQoqDelta: dollars(maxAbsQoqDelta),
      averageAbsQoqPct: pctCount ? averageAbsQoqPct / pctCount : 0,
      eventCount,
      volatilityScore,
      series: periods.map((period, index) => ({
        period,
        value: dollars(values[index]),
        holders: holders[index],
      })),
      managerBreakdown,
      notableEvents: events
        .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
        .slice(0, 4),
    })
  }

  return companies.sort((a, b) => b.volatilityScore - a.volatilityScore).slice(0, 120)
}

function buildRecentMoves(managerFilings, period) {
  const previousByManager = new Map()
  const currentByManager = new Map()
  const allPeriods = [...new Set(managerFilings.flatMap((manager) => manager.filings.map((filing) => filing.period)))].sort()
  const periodIndex = allPeriods.indexOf(period)
  const previousPeriod = allPeriods[periodIndex - 1]

  if (!previousPeriod) {
    return []
  }

  for (const manager of managerFilings) {
    const previous = manager.filings.find((filing) => filing.period === previousPeriod)
    const current = manager.filings.find((filing) => filing.period === period)
    if (!previous || !current) {
      continue
    }

    previousByManager.set(manager.id, new Map(previous.holdings.map((holding) => [holding.cusip, holding])))
    currentByManager.set(manager.id, new Map(current.holdings.map((holding) => [holding.cusip, holding])))
  }

  const moveMap = new Map()
  for (const manager of managerFilings) {
    const previous = previousByManager.get(manager.id)
    const current = currentByManager.get(manager.id)
    if (!previous || !current) {
      continue
    }

    const keys = new Set([...previous.keys(), ...current.keys()])
    for (const key of keys) {
      const previousHolding = previous.get(key)
      const currentHolding = current.get(key)
      const currentValue = currentHolding?.value || 0
      const previousValue = previousHolding?.value || 0
      const delta = currentValue - previousValue
      if (delta === 0) {
        continue
      }

      if (!moveMap.has(key)) {
        const reference = currentHolding || previousHolding
        moveMap.set(key, {
          cusip: key,
          issuer: reference.issuer,
          title: reference.title,
          previousValue: 0,
          currentValue: 0,
          netChange: 0,
          grossChange: 0,
          buyerCount: 0,
          sellerCount: 0,
          holderDelta: 0,
          managers: [],
        })
      }

      const move = moveMap.get(key)
      move.previousValue += previousValue
      move.currentValue += currentValue
      move.netChange += delta
      move.grossChange += Math.abs(delta)

      if (delta > 0) {
        move.buyerCount += 1
      } else {
        move.sellerCount += 1
      }

      if (previousValue === 0 && currentValue > 0) {
        move.holderDelta += 1
      }

      if (previousValue > 0 && currentValue === 0) {
        move.holderDelta -= 1
      }

      move.managers.push({
        id: manager.id,
        name: manager.name,
        delta: dollars(delta),
        previousValue: dollars(previousValue),
        currentValue: dollars(currentValue),
      })
    }
  }

  return [...moveMap.values()]
    .filter((move) => move.grossChange >= 500_000_000)
    .map((move) => ({
      ...move,
      previousValue: dollars(move.previousValue),
      currentValue: dollars(move.currentValue),
      netChange: dollars(move.netChange),
      grossChange: dollars(move.grossChange),
      qoqPercentChange: percentChange(move.currentValue, move.previousValue),
      managers: move.managers
        .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
        .slice(0, 6),
    }))
    .sort((a, b) => Math.abs(b.netChange) - Math.abs(a.netChange))
    .slice(0, 80)
}

async function main() {
  ensureDirectory(path.dirname(OUTPUT_PATH))

  const fetched = []
  for (const manager of MANAGERS) {
    process.stdout.write(`Fetching ${manager.name}... `)
    const filings = await fetchManagerFilings(manager)
    console.log(`${filings.length} filings, ${filings[0]?.period || 'n/a'} to ${filings.at(-1)?.period || 'n/a'}`)
    fetched.push({ ...manager, filings })
  }

  const allPeriods = [...new Set(fetched.flatMap((manager) => manager.filings.map((filing) => filing.period)))]
    .filter(Boolean)
    .sort()
    .slice(-12)

  const managerFilings = fetched.map((manager) => ({
    ...manager,
    filings: manager.filings.filter((filing) => allPeriods.includes(filing.period)),
  }))
  managerFilings.forEach((manager) => {
    manager.series = buildManagerSeries(manager, manager.filings, allPeriods)
  })

  const coverageByPeriod = allPeriods.map((period) => ({
    period,
    managers: managerFilings.filter((manager) => manager.filings.some((filing) => filing.period === period)).length,
  }))
  const latestComparisonPeriod = [...coverageByPeriod]
    .reverse()
    .find((item) => item.managers >= Math.min(12, MANAGERS.length))?.period || allPeriods.at(-1)

  const output = {
    generatedAt: new Date().toISOString(),
    source: {
      name: 'SEC EDGAR 13F-HR XML information tables',
      browseUrl: 'https://www.sec.gov/cgi-bin/browse-edgar',
      requestUserAgent: USER_AGENT,
      valueUnit: 'USD as reported in XML value fields',
      optionsExcluded: true,
      note: 'Holdings are aggregated by CUSIP inside each manager filing. 13F does not include short positions, non-US ordinary shares outside the 13F list, or intra-quarter trades.',
    },
    universe: {
      managerCount: MANAGERS.length,
      periods: allPeriods,
      startPeriod: allPeriods[0],
      endPeriod: allPeriods.at(-1),
      latestComparisonPeriod,
      coverageByPeriod,
    },
    managers: managerFilings.map((manager) => manager.series),
    aggregateSeries: buildAggregateSeries(managerFilings, allPeriods),
    volatileHoldings: buildCompanyStats(managerFilings, allPeriods),
    recentMoves: buildRecentMoves(managerFilings, latestComparisonPeriod),
  }

  fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(output, null, 2)}\n`)
  console.log(`Wrote ${path.relative(process.cwd(), OUTPUT_PATH)}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
