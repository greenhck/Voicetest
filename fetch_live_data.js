/**
 * Live Data Fetch Script (fetch_live_data.js)
 * * Uses a two-step fetch process to bypass NSE's security and fetch live Nifty 50 data.
 */
const fetch = require('node-fetch');
const fs = require('fs');

// --- Configuration ---
// Endpoint for Nifty 50 index
const NSE_API_URL = "https://www.nseindia.com/api/equity-stockIndices?index=NIFTY%2050"; 
// Initial endpoint to fetch cookies
const NSE_BASE_URL = "https://www.nseindia.com"; 

// --- Core Logic ---

// Helper function to create mock holdings
const generateMockHoldings = (symbol) => {
    const rand = Math.floor(Math.random() * 5);
    if (rand === 0) return 0;
    return rand * 10; 
};

async function fetchAndProcessData() {
    console.log("Starting two-step fetch process for NIFTY 50 data...");

    // 1. Initial Fetch to get Cookies (Essential for NSE)
    console.log("Step 1: Fetching initial session cookies...");
    let cookies = '';
    
    try {
        const initialResponse = await fetch(NSE_BASE_URL, {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9',
            }
        });
        
        // FIX: Use .raw() to retrieve all 'set-cookie' headers reliably
        const cookieHeaders = initialResponse.headers.raw()['set-cookie'];
        
        if (cookieHeaders && cookieHeaders.length > 0) {
            // Join all cookie headers and filter for necessary ones
            const allCookies = cookieHeaders.join('; ');
            
            cookies = allCookies.split(';').filter(cookie => 
                cookie.trim().startsWith('JSESSIONID') || cookie.trim().startsWith('bm_sv')
            ).join('; ');
        }
        
        if (!cookies) {
            console.error("Could not retrieve necessary cookies. Aborting.");
            process.exit(1);
        }
        console.log("Successfully retrieved necessary cookies.");
        
    } catch (error) {
        console.error(`Error in Step 1 (Cookie Fetch): ${error.message}`);
        process.exit(1);
    }
    
    // 2. Data Fetch using the Retrieved Cookies and required Headers
    console.log("Step 2: Fetching actual data using cookies...");
    
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
            console.error(`An error occurred during final NSE fetch. Status: ${response.status} (${response.statusText})`);
            throw new Error(`NSE fetch failed with status: ${response.status}`);
        }

        const data = await response.json();
        
        // --- Data Processing ---
        const stockData = data.data.filter(item => item.identifier && item.symbol);
        
        const processedStocks = stockData.map(stock => {
            
            return {
                name: stock.meta?.companyName || stock.symbol, 
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
