# Time Crimes Excel - Binance OHLC Analytics Tool

A production-ready, Vercel-optimized analytics tool for analyzing large Binance OHLC crypto datasets with automatic timezone conversion from UTC to Toronto time.

## 🎯 Features

### Core Features
- **No Authentication Required** - Simple single-page tool
- **Large File Support** - Handles 28-30 MB CSV/XLSX files efficiently
- **Automatic Timezone Conversion** - UTC to Toronto time with DST handling
- **Advanced Filtering** - Filter by year, day of week, date range, and time range
- **Noise Filtering** - Configurable decimal threshold to ignore low-volatility candles
- **Configurable Intervals** - Analyze 15, 30, 45, 60, 120, or 240-minute time slots
- **Time-Based Statistics** - Aggregation and analysis with dominance calculations
- **Visual Results** - Summary cards, top 5 trade windows, and color-coded tables
- **Vercel-Ready** - Optimized for Vercel serverless deployment

### 🚀 Advanced Features

#### 📊 Pattern Analysis
- **Intra-Day Pattern Detection** - Identifies time slot relationships within the same trading day
- **SAME Direction Patterns** - Finds slots that tend to move together (both UP or both DOWN)
- **OPPOSITE Direction Patterns** - Finds slots that tend to invert (one UP, other DOWN)
- **Confidence Scoring** - Statistical confidence percentages (60-100%)
- **Minimum Sample Size** - Requires ≥30 days for reliable patterns
- **Sortable & Filterable Table** - Interactive UI to explore patterns

#### 🎯 Today Mode (Daily Trading Playbook)
- **Real-Time Analysis** - Analyzes today's completed candles
- **Morning Bias Detection** - Identifies overall morning trend (UP/DOWN/NEUTRAL)
- **Future Slot Projections** - Predicts remaining time slots based on historical patterns
- **Bias Indicators** - Color-coded LONG/SHORT/AVOID signals
- **Confidence Tiers** - STRONG (≥65%), WEAK (55-65%), or filtered out (<55%)
- **Pattern Reasoning** - Shows which earlier slot triggered each projection
- **Risk Disclaimer** - Clear warnings that patterns are tendencies, not guarantees

## 📁 Repository Structure

```
/root
  /source              # Data files directory (NOT uploaded via UI)
    solana.csv         # Sample Binance OHLC data
    README.md          # Data format documentation
  /src
    /components        # React components
      SettingsPanel.tsx
      FilterControls.tsx
      DateRangeFilter.tsx
      ResultsDisplay.tsx
      PatternRelationshipTable.tsx   # NEW: Pattern analysis display
      TodayPlaybook.tsx              # NEW: Today mode display
    /pages            # Next.js pages
      index.tsx       # Main page
      _app.tsx        # App wrapper
      _document.tsx   # HTML document
      /api
        analyze.ts    # Vercel serverless function
        files.ts      # File listing API
        preview.ts    # File preview API
    /utils            # Utility functions
      timezone.ts     # Timezone conversion (UTC ↔ Toronto)
      parser.ts       # CSV/XLSX parsing
      aggregator.ts   # Data aggregation logic
      patternAnalysis.ts   # NEW: Pattern detection logic
      todayMode.ts         # NEW: Daily playbook logic
      datePresets.ts       # Date range presets
    /styles
      globals.css     # Global styles with Tailwind
  package.json
  tsconfig.json
  next.config.js
  tailwind.config.js
  README.md
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd time-crimes-excel
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Add your data files**
   - Place your CSV or XLSX files in the `/source` directory
   - Files must follow the Binance OHLC format (see [Data Format](#data-format))

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   - Navigate to [http://localhost:3000](http://localhost:3000)
   - Enter your filename (e.g., `solana.csv`)
   - Configure filters and click "Generate Analysis"

## 📊 Data Format

Files in the `/source` directory must follow this exact format:

| Column    | Column Name | Description            | Example               |
|-----------|-------------|------------------------|------------------------|
| A         | Open time   | Timestamp (UTC)        | 2020-08-11 06:00:00   |
| B         | Open        | Opening price          | 2.85                  |
| C         | High        | Highest price          | 3.47                  |
| D         | Low         | Lowest price           | 2.85                  |
| E         | Close       | Closing price          | 3.1655                |
| F         | Volume      | Volume (optional)      | 123456                |

### Example CSV

```csv
Open time,Open,High,Low,Close,Volume
2020-08-11 06:00:00,2.85,3.47,2.85,3.1655,123456
2020-08-11 06:15:00,3.1655,3.3564,3.1358,3.136,145678
2020-08-11 06:30:00,3.136,3.136,2.9054,2.9665,167890
```

### Supported File Formats

- CSV files (`.csv`)
- Excel files (`.xlsx`)

### Important Notes

- Timestamps **MUST** be in UTC
- Header row **MUST** exist
- Column order **MUST** match the format above
- Files are read directly from `/source` (NOT uploaded via UI)

## 🛠️ How It Works

### 1. Settings Panel

- **Source File Name**: Enter the filename from `/source` directory
- **Decimal Noise Filter**: Set threshold percentage (default: 0.02%)
  - Candles with price change below this threshold are ignored
- **Timezone Info**: Displays conversion from UTC to Toronto time

### 2. Filter Controls

- **Year**: Filter data by specific year (or all years)
- **Day of Week**: Multi-select checkboxes for each day
- **Time Range**: Set Toronto time window (default: 06:00 - 23:45)

### 3. Candle Classification

Each candle is classified as:
- **UP**: Close > Open (and above noise threshold)
- **DOWN**: Close < Open (and above noise threshold)
- **IGNORED**: Price change below noise threshold

### 4. Time Slot Aggregation

- Data is aggregated into 15-minute time slots
- For each slot, counts UP, DOWN, and IGNORED candles
- Calculates **dominance percentage**: `max(UP, DOWN) / (UP + DOWN) × 100`
- Determines **bias**: UP, DOWN, or NEUTRAL

### 5. Results Display

- **Summary Cards**: Total UP, DOWN, and IGNORED candles
- **Top 5 Trade Windows**: Highest dominance time slots
- **Full Time Slot Table**: All time slots with color coding
  - Green rows: ≥60% UP dominance
  - Red rows: ≥60% DOWN dominance

## 🚀 Advanced Features Guide

### 📊 Pattern Analysis

Pattern Analysis detects intra-day relationships between time slots to identify recurring patterns in market behavior.

#### How It Works

1. **Day Signature Creation**
   - For each trading day, the system creates a "signature" mapping each 15-minute slot to its direction (UP/DOWN/NEUTRAL)
   - Example: `{ "09:30": UP, "10:00": DOWN, "14:45": UP, ... }`

2. **Pairwise Pattern Detection**
   - Compares every pair of time slots across all days
   - Calculates how often they move in the SAME or OPPOSITE direction
   - Only stores patterns with ≥60% confidence and ≥30 sample days

3. **Pattern Types**
   - **SAME Direction**: Slots tend to move together (both UP or both DOWN)
     - Example: "09:30 → 15:00 SAME 68%" means when 09:30 is green, 15:00 is also green 68% of the time
   - **OPPOSITE Direction**: Slots tend to invert (one UP, other DOWN)
     - Example: "10:15 → 14:45 OPPOSITE 63%" means when 10:15 is green, 14:45 is red 63% of the time

#### How to Use Pattern Analysis

1. **Enable Pattern Analysis**
   - Toggle "Pattern Analysis" switch in the Advanced Features section
   - Run analysis (may take longer for large datasets)

2. **Interpret Results**
   - **SAME patterns** suggest continuation/correlation:
     - Use for confirming trends
     - If early slot shows strength, expect related slots to follow
   - **OPPOSITE patterns** suggest mean reversion:
     - Use for hedge opportunities
     - If early slot moves one way, expect related slots to reverse

3. **Filter & Sort**
   - Filter by relationship type (SAME/OPPOSITE)
   - Adjust minimum confidence threshold
   - Sort by confidence or sample size
   - Focus on high-confidence patterns (≥70%)

#### Example Use Cases

- **Trend Following**: If 09:30-09:45 is strongly UP and you have a SAME pattern to 15:00-15:15, consider LONG positions during that afternoon slot
- **Mean Reversion**: If 10:00-10:15 is strongly UP and you have an OPPOSITE pattern to 14:00-14:15, consider SHORT positions during that afternoon slot
- **Risk Management**: Patterns with low sample sizes (<50 days) should be treated with caution

### 🎯 Today Mode (Daily Trading Playbook)

Today Mode analyzes what's happened so far today and projects the remaining time slots based on historical patterns.

#### How It Works

1. **Analyze Completed Candles**
   - Identifies all 15-minute slots that have already closed today
   - Classifies each as UP, DOWN, or NEUTRAL
   - Calculates overall morning bias

2. **Pattern Matching**
   - For each completed slot with a clear direction (UP/DOWN)
   - Finds all pattern relationships involving that slot
   - Projects expected direction for future slots

3. **Confidence Scoring**
   - **STRONG Bias** (≥65% confidence): High-probability setups
   - **WEAK Bias** (55-65% confidence): Lower-probability setups
   - **No Signal** (<55%): Filtered out, too unreliable

4. **Bias Classification**
   - **LONG**: Expected UP movement (green)
   - **SHORT**: Expected DOWN movement (red)
   - **AVOID**: No clear pattern (gray)

#### How to Use Today Mode

1. **Enable Today Mode**
   - Toggle "Today Mode" switch in the Advanced Features section
   - Best used during trading hours
   - Requires pattern analysis data (auto-calculated if needed)

2. **Check Morning Bias**
   - View overall morning trend
   - UP bias suggests bullish day
   - DOWN bias suggests bearish day
   - NEUTRAL suggests mixed/choppy conditions

3. **Review Completed Candles**
   - See which time slots have already closed
   - Identify which ones had significant moves
   - Understand today's market behavior so far

4. **Follow Projections**
   - **Strong Bias Signals** (≥65%): Primary trade opportunities
     - High confidence, backed by strong patterns
     - Use for main trading decisions
   - **Weak Bias Signals** (55-65%): Secondary opportunities
     - Lower confidence, use with caution
     - Consider as supporting evidence only

5. **Read the Reasoning**
   - Each projection shows which earlier slot triggered it
   - Example: "Follows 09:30 UP pattern (SAME, 68%)"
   - Helps understand the pattern logic

#### Trading Workflow Example

**Scenario**: It's 11:00 AM, and you want to plan your afternoon trades

1. Enable Today Mode and run analysis
2. Check morning bias: **UP (75% confidence)**
3. Review completed candles:
   - 09:30-09:45: UP (+2.3%)
   - 10:00-10:15: UP (+1.8%)
   - 10:30-10:45: DOWN (-0.5%)
4. View projections:
   - **15:00-15:15: STRONG LONG (72% confidence)**
     - Reason: "Follows 09:30 UP pattern (SAME, 72%)"
     - Action: Consider LONG position
   - **14:00-14:15: WEAK SHORT (58% confidence)**
     - Reason: "Follows 10:00 UP pattern (OPPOSITE, 58%)"
     - Action: Use as supporting evidence only

5. Make trading decisions based on:
   - Pattern signals (from playbook)
   - Your own analysis (price action, indicators)
   - Risk management rules
   - Market conditions

#### Important Disclaimers

⚠️ **Critical Warnings**:
- Patterns are **statistical tendencies**, NOT guarantees
- Past performance does NOT guarantee future results
- Use as a **timing filter**, NOT a standalone signal
- Always combine with:
  - Your own technical analysis
  - Fundamental analysis
  - Risk management
  - Position sizing
  - Stop losses
- Never trade based solely on pattern signals
- Market conditions can change rapidly
- Patterns may break during:
  - Major news events
  - Low liquidity periods
  - Unusual market conditions
  - Regime changes

#### Best Practices

1. **Combine Multiple Signals**
   - Don't rely on patterns alone
   - Use with your existing strategy
   - Confirm with price action

2. **Focus on High Confidence**
   - Prioritize ≥70% confidence patterns
   - Be skeptical of 55-65% signals
   - Ignore <55%

3. **Consider Sample Size**
   - Prefer patterns with ≥50 days
   - Be cautious with minimum (30 days)
   - More data = more reliable

4. **Monitor Performance**
   - Track pattern accuracy over time
   - Patterns may degrade
   - Adjust strategy as needed

5. **Risk Management First**
   - Always use stop losses
   - Position size appropriately
   - Don't over-leverage
   - Protect capital

## 🌐 Deploying to Vercel

### Option 1: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```

4. **Add data files**
   - After deployment, add your CSV/XLSX files to the `/source` directory
   - You can do this via Git commits or Vercel's file upload feature

### Option 2: Deploy via GitHub

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Select your GitHub repository
   - Vercel will auto-detect Next.js and configure build settings

3. **Add data files**
   - Commit your data files to the `/source` directory
   - Push to GitHub
   - Vercel will automatically redeploy

### Important Vercel Configuration

The project includes optimized settings for Vercel:

- **API Route Timeout**: Configured for large file processing
- **Body Size Limit**: Set to 10MB for requests/responses
- **Serverless Functions**: Optimized for CSV/XLSX parsing

## 🔧 Configuration

### Noise Threshold

The noise filter ignores candles with minimal price movement:

```
if (|close - open| / open) < threshold:
    IGNORE candle
```

Default: `0.02` (2%)

### Time Range

Default: `06:00` to `23:45` (Toronto time)

You can adjust this in the UI to focus on specific trading hours.

### Timezone

Fixed: **UTC** → **America/Toronto**

Automatically handles Daylight Saving Time (DST) transitions.

## 📈 Example Usage

1. **Add your data file**
   ```bash
   cp ~/Downloads/binance-solana-15m.csv source/solana.csv
   ```

2. **Start the app**
   ```bash
   npm run dev
   ```

3. **Configure analysis**
   - Filename: `solana.csv`
   - Noise threshold: `0.02`
   - Year: `2024`
   - Days: Monday-Friday (uncheck Saturday/Sunday)
   - Time: `09:00` - `16:00`

4. **Click "Generate Analysis"**

5. **View results**
   - See total UP/DOWN/IGNORED candles
   - Identify top 5 high-probability time windows
   - Review full time slot table with color coding

## 🧪 Testing

### Test with Sample Data

The repository includes a sample `solana.csv` file for testing:

```bash
npm run dev
```

Then in the UI:
- Filename: `solana.csv`
- Click "Generate Analysis"

### Add Your Own Data

1. Download Binance OHLC data
2. Ensure it matches the required format
3. Copy to `/source` directory
4. Use the filename in the UI

## 🐛 Troubleshooting

### "File not found" error

- Ensure the file exists in `/source` directory
- Check the filename exactly matches (case-sensitive)
- Verify the file is not in a subdirectory

### "No valid data" error

- Check that your CSV/XLSX has a header row
- Verify column names match the expected format
- Ensure timestamps are in the correct format

### Analysis takes too long

- For very large files (>50MB), consider:
  - Splitting the file by year
  - Using year filter to process smaller chunks
  - Increasing Vercel function timeout (Pro plan)

### Timezone conversion issues

- Verify timestamps in source file are UTC
- Check that timestamps are in `YYYY-MM-DD HH:MM:SS` format
- DST transitions are handled automatically

## 📚 Technical Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Data Parsing**: PapaParse (CSV), XLSX (Excel)
- **Timezone**: date-fns-tz
- **Deployment**: Vercel Serverless Functions

## 🤝 Contributing

This is a production-ready tool. For improvements:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - feel free to use and modify for your needs.

## 💡 Tips

- **Performance**: For best performance, filter by year when analyzing multi-year datasets
- **Accuracy**: Lower noise threshold = more candles analyzed, higher threshold = more selective
- **Trading**: Use the top 5 windows to identify high-probability trading times
- **Backtesting**: Export results and validate against your trading strategy

## 🔗 Links

- [Next.js Documentation](https://nextjs.org/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

**Built for Vercel** | **Production-Ready** | **No Auth Required** | **Simple & Powerful**
