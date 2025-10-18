/**
 * Live Data Fetch Script (fetch_live_data.js)
 * Fetches Nifty 50 stock data directly from an NSE public JSON endpoint (no API key needed).
 * Saves the processed data into marketdata.json.
 */
const fetch = require('node-fetch');
const fs = require('fs');

// --- Configuration ---
// Using NSE India's public endpoint for Nifty 50 index
const NSE_API_URL = "https://www.nseindia.com/api/equity-stockIndices?index=NIFTY%2050"; 

// --- Core Logic ---

// Helper function to create mock holdings
const generateMockHoldings = (symbol) => {
    // Generate a random holding count for a better demonstration of the UI
    const rand = Math.floor(Math.random() * 5);
    if (rand === 0) return 0;
    return rand * 10; 
};

async function fetchAndProcessData() {
    console.log("Starting to fetch live NIFTY 50 stock data from NSE...");

    // FIX: Added required headers to bypass NSE security checks
    const requestOptions = {
        method: 'GET',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Accept': '*/*', // Added Accept header
            'Referer': 'https://www.nseindia.com/market-data/live-equity-stock-watch', // Crucial Referer header
            'Host': 'www.nseindia.com' // Crucial Host header
        }
    };

    try {
        const response = await fetch(NSE_API_URL, requestOptions);

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`An error occurred during NSE fetch. Status: ${response.status} (${response.statusText})`);
            console.error(`Server Response Body: ${errorText.substring(0, 100)}... (truncated)`); // Truncate HTML for clean log
            throw new Error(`NSE fetch failed with status: ${response.status}`);
        }

        const data = await response.json();
        
        // --- Data Processing ---
        const stockData = data.data.filter(item => item.identifier && item.symbol);
        
        const processedStocks = stockData.map(stock => {
            
            return {
                name: stock.meta.companyName,
                symbol: stock.symbol,                                          
                indices: 'NIFTY 50',                       
                currentPrice: parseFloat(stock.lastPrice).toFixed(2),
                todayChange: parseFloat(stock.change).toFixed(2),
                changePercent: parseFloat(stock.pChange).toFixed(2), 
                holdings: generateMockHoldings(stock.symbol)
            };
        });

        fs.writeFileSync('marketdata.json', JSON.stringify(processedStocks, null, 2));
        console.log(`\n✅ Successfully fetched and saved ${processedStocks.length} stocks to marketdata.json.`);

    } catch (error) {
        console.error(`An error occurred during data processing: ${error.message}`);
        process.exit(1);
    }
}

fetchAndProcessData();
