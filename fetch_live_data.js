/**
 * Live Data Fetch Script (fetch_live_data.js)
 * * Attempts a two-step fetch from NSE (for all Nifty 50 stocks).
 * * CRUCIAL: If the NSE fetch fails due to security, it falls back to generating
 * realistic simulated data to ensure the workflow never breaks.
 */
const fetch = require('node-fetch');
const fs = require('fs');

// --- Configuration ---
const NSE_API_URL = "https://www.nseindia.com/api/equity-stockIndices?index=NIFTY%2050"; 
const NSE_BASE_URL = "https://www.nseindia.com"; 

// A list of symbols to use for the simulation fallback if the NSE fetch fails
const FALLBACK_SYMBOLS = ['RELIANCE', 'TCS', 'INFY', 'HDFC', 'ICICIBANK', 'HINDUNILVR', 'BAJFINANCE', 'LT', 'KOTAKBANK', 'BHARTIARTL'];

// --- Helper Functions ---

const generateMockHoldings = (symbol) => {
    const rand = Math.floor(Math.random() * 5);
    if (rand === 0) return 0;
    return rand * 10; 
};

/**
 * Generates high-quality, simulated stock data for fallback.
 * @returns {Array} Array of simulated stock objects.
 */
function generateSimulatedData() {
    console.log("⚠️ Fallback activated: Generating simulated market data...");
    const simulatedData = FALLBACK_SYMBOLS.map(symbol => {
        // Generate realistic random prices and changes
        const basePrice = (Math.random() * 2000) + 500;
        const changePercent = (Math.random() * 5) - 2.5; // +/- 2.5%
        const todayChange = basePrice * (changePercent / 100);

        return {
            name: `${symbol} Co. Ltd.`,
            symbol: symbol,
            indices: 'SIMULATED / NIFTY 50',
            currentPrice: (basePrice + todayChange).toFixed(2),
            todayChange: todayChange.toFixed(2),
            changePercent: changePercent.toFixed(2),
            holdings: generateMockHoldings(symbol)
        };
    });
    return simulatedData;
}

// --- Core Logic ---

async function fetchAndProcessData() {
    console.log("Starting two-step fetch process for NIFTY 50 data...");

    let processedStocks = [];
    let cookies = '';
    let fetchSuccessful = false;
    
    // --- Step 1: Initial Fetch to get Cookies ---
    try {
        const initialResponse = await fetch(NSE_BASE_URL, {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9',
            }
        });
        
        const cookieHeaders = initialResponse.headers.raw()['set-cookie'];
        
        if (cookieHeaders && cookieHeaders.length > 0) {
            const allCookies = cookieHeaders.join('; ');
            cookies = allCookies.split(';').filter(cookie => 
                cookie.trim().startsWith('JSESSIONID') || cookie.trim().startsWith('bm_sv')
            ).join('; ');
        }
        
    } catch (error) {
        console.error(`Warning: Step 1 (Cookie Fetch) failed: ${error.message}`);
    }
    
    // --- Step 2: Data Fetch using the Retrieved Cookies ---
    if (cookies) {
        console.log("Step 2: Cookies retrieved. Attempting final data fetch...");
        
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
                'Cookie': cookies 
            }
        };

        try {
            const response = await fetch(NSE_API_URL, requestOptions);

            if (response.ok) {
                const data = await response.json();
                
                // Process only if data structure is correct (to avoid previous errors)
                if (data.data && Array.isArray(data.data)) {
                    processedStocks = data.data.filter(item => item.identifier && item.symbol).map(stock => ({
                        name: stock.meta?.companyName || stock.symbol, 
                        symbol: stock.symbol,                                          
                        indices: 'NIFTY 50',                       
                        currentPrice: parseFloat(stock.lastPrice).toFixed(2),
                        todayChange: parseFloat(stock.change).toFixed(2),
                        changePercent: parseFloat(stock.pChange).toFixed(2), 
                        holdings: generateMockHoldings(stock.symbol)
                    }));
                    fetchSuccessful = processedStocks.length > 0;
                    if (!fetchSuccessful) {
                        console.log("Warning: Fetch succeeded but no stock data was returned by the API.");
                    }
                }
            } else {
                console.error(`Warning: Final NSE fetch failed with status: ${response.status}. Falling back.`);
            }

        } catch (error) {
            console.error(`Warning: Error during final fetch: ${error.message}. Falling back.`);
        }
    } else {
        console.error("Warning: Cookies could not be retrieved in Step 1. Falling back.");
    }
    
    // --- Final Step: Write to File ---
    if (!fetchSuccessful) {
        processedStocks = generateSimulatedData();
    }

    fs.writeFileSync('marketdata.json', JSON.stringify(processedStocks, null, 2));
    const status = fetchSuccessful ? "Successfully fetched and saved" : "Saved simulated";
    console.log(`\n✅ Process Complete: ${status} ${processedStocks.length} stocks to marketdata.json.`);
}

fetchAndProcessData();
