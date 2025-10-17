// This script simulates the conversion logic needed in a Node.js environment (like GitHub Actions)
// to transform a daily CSV (Bhavcopy) into the simple JSON format required by the frontend.

// Mock CSV Input (Simulating a line from a typical NSE Bhavcopy file)
const mockCsvData = `
SYMBOL,SERIES,OPEN,HIGH,LOW,CLOSE,LAST,PREVCLOSE,TOTTRDQTY,TOTTRDVAL,TIMESTAMP,TOTALTRADES,ISIN
RELIANCE,EQ,2800.00,2855.00,2790.00,2850.50,2850.00,2800.00,5000000,14252500000.00,16-OCT-2024,150000,INE002A01018
TCS,EQ,3700.00,3755.00,3700.00,3750.00,3750.00,3700.00,3000000,11250000000.00,16-OCT-2024,100000,INE467B01029
HDFCBANK,EQ,1490.00,1505.00,1485.00,1500.25,1500.00,1490.00,8000000,12000000000.00,16-OCT-2024,200000,INE040A01037
NIFTYFUT,FUT,22900.00,23100.00,22850.00,23050.00,23050.00,22950.00,10000,2305000000.00,16-OCT-2024,5000,NIFTY24OCTFUT
`;

/**
 * Converts CSV content (string) into a key-value JSON object of {SYMBOL: CLOSE_PRICE}.
 * @param {string} csvString The raw CSV content.
 * @returns {string} The JSON string output.
 */
function csvToJson(csvString) {
    const lines = csvString.trim().split('\n').filter(line => line.trim() !== '');
    if (lines.length < 2) {
        return "{}";
    }

    const headers = lines[0].split(',');
    const dataMap = {};

    // Find the indices of relevant columns
    const symbolIndex = headers.indexOf('SYMBOL');
    const closeIndex = headers.indexOf('CLOSE');

    if (symbolIndex === -1 || closeIndex === -1) {
        console.error("CSV headers 'SYMBOL' or 'CLOSE' not found.");
        return "{}";
    }

    // Process data rows (skipping header)
    for (let i = 1; i < lines.length; i++) {
        const columns = lines[i].split(',');

        const symbol = columns[symbolIndex] ? columns[symbolIndex].trim() : null;
        const closePrice = columns[closeIndex] ? parseFloat(columns[closeIndex].trim()) : null;

        if (symbol && !isNaN(closePrice)) {
            dataMap[symbol] = closePrice;
        }
    }

    // Output the final JSON object to standard output
    return JSON.stringify(dataMap, null, 2);
}

// In a real GitHub action, you would read the CSV file from disk.
// For this simulation, we use the mock data.
const jsonOutput = csvToJson(mockCsvData);
console.log(jsonOutput);

// The output of this script is piped directly into the data/daily_data.json file
// as shown in the GitHub Actions workflow.
