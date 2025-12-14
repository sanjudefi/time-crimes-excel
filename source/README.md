# Source Data Files

This folder contains the Binance OHLC data files that will be analyzed.

## Required Format

Files must follow this exact format:

| Column | Column Name | Description     | Example               |
| ------ | ----------- | --------------- | --------------------- |
| A      | Open time   | Timestamp (UTC) | 2020-08-11 06:00:00   |
| B      | Open        | Open price      | 2.85                  |
| C      | High        | High price      | 3.47                  |
| D      | Low         | Low price       | 2.85                  |
| E      | Close       | Close price     | 3.1655                |
| F      | Volume      | Volume (opt)    | 123456                |

## Supported Formats

- CSV files (.csv)
- Excel files (.xlsx)

## Important Notes

- Timestamps MUST be in UTC
- Header row MUST exist
- Column order MUST match the format above
- Files are read directly from this folder (NOT uploaded via UI)

## Example Files

- `solana.csv` - Sample Solana data (demonstration purposes)
- Add your own large datasets (28-30MB) here

## How to Add Files

1. Download your Binance OHLC data
2. Ensure it matches the format above
3. Copy the file to this `/source` folder
4. Use the filename in the web interface (e.g., "solana.csv")
