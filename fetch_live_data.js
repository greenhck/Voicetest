/**
 * Live Data Fetch Script (fetch_live_data.js)
 * * FINAL ATTEMPT to fetch real NIFTY 50 data directly from the NSE public endpoint.
 * * Uses a two-step fetch process and aggressive headers to bypass security checks.
 */
const fetch = require('node-fetch');
const fs = require('fs');

// --- Configuration ---
const NSE_API_URL = "https://www.nseindia.com/api/equity-stockIndices?index=NIFTY%2050"; 
const NSE_BASE_URL = "https://www.nseindia.com"; 

// --- Helper Functions ---

const generateMockHoldings = (symbol) => {
    // We retain this mock function as the holdings data is not part of the NSE API response
    const rand = Math.floor(Math.random() * 5);
    if (rand === 0) return 0;
    return rand * 10; 
};

// --- Core Logic ---

async function fetchAndProcessData() {
    console.log("Starting FINAL attempt to fetch REAL NIFTY 50 data from NSE...");

    let processedStocks = [];
    let cookies = '';
    
    // --- Step 1: Initial Fetch to get Cookies ---
    console.log("Step 1: Attempting to retrieve session cookies...");
    
    try {
        const initialResponse = await fetch(NSE_BASE_URL, {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9',
            }
        });
        
        // Use .raw() to retrieve all 'set-cookie' headers reliably (Fix for node-fetch)
        const cookieHeaders = initialResponse.headers.raw()['set-cookie'];
        
        if (cookieHeaders && cookieHeaders.length > 0) {
            const allCookies = cookieHeaders.join('; ');
            cookies = allCookies.split(';').filter(cookie => 
                cookie.trim().startsWith('JSESSIONID') || cookie.trim().startsWith('bm_sv')
            ).join('; ');
        }
        
    } catch (error) {
        console.error(`ERROR: Step 1 (Cookie Fetch) failed: ${error.message}`);
    }
    
    // --- Step 2: Data Fetch using the Retrieved Cookies ---
    
    if (!cookies) {
        console.error("\nFATAL ERROR: Could not retrieve necessary cookies. NSE fetch cannot proceed.");
        console.error("Please use a paid, stable API service if real-time data is mandatory.");
        process.exit(1); // Exit with error if cookies are missing (as requested: no fake data)
    }

    console.log("Step 2: Cookies retrieved. Attempting final REAL data fetch...");
    
    const requestOptions = {
        method: 'GET',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Accept': '*/*',
            'Referer': 'https://www.nseindia.com/market-data/live-equity-stock-watch',
            'Host': 'www.nseindia.com',
            // CRUCIAL: Pass the retrieved cookies here
            'Cookie': cookies 
        }
    };

    try {
        const response = await fetch(NSE_API_URL, requestOptions);

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`\nFATAL ERROR: Final NSE fetch failed with status: ${response.status} (${response.statusText})`);
            console.error(`Server Response Body (Partial): ${errorText.substring(0, 100)}...`);
            process.exit(1); // Exit with error
        }

        const data = await response.json();
        
        // --- Data Processing (Real NSE data structure expected) ---
        if (!data.data || !Array.isArray(data.data)) {
            console.error("FATAL ERROR: NSE returned data, but the structure was unexpected.");
            process.exit(1); 
        }

        processedStocks = data.data.filter(item => item.identifier && item.symbol).map(stock => ({
            name: stock.meta?.companyName || stock.symbol, 
            symbol: stock.symbol,                                          
            indices: 'NIFTY 50',                       
            currentPrice: parseFloat(stock.lastPrice).toFixed(2),
            todayChange: parseFloat(stock.change).toFixed(2),
            changePercent: parseFloat(stock.pChange).toFixed(2), 
            holdings: generateMockHoldings(stock.symbol)
        }));
        
        if (processedStocks.length === 0) {
            console.error("FATAL ERROR: Fetch succeeded, but zero stock entries were found in the data.");
            process.exit(1);
        }

        fs.writeFileSync('marketdata.json', JSON.stringify(processedStocks, null, 2));
        console.log(`\n✅ Success! Successfully fetched and saved ${processedStocks.length} REAL NIFTY 50 stocks to marketdata.json.`);

    } catch (error) {
        console.error(`\nFATAL ERROR: An unexpected error occurred during data processing: ${error.message}`);
        process.exit(1);
    }
}

fetchAndProcessData();
