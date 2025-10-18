/**
 * Live Data Fetch Script (fetch_live_data.js)
 * * This script is intended to run via GitHub Actions. It fetches live market data
 * using the provided API key and saves the processed data into marketdata.json.
 * * IMPORTANT: This uses 'node-fetch' which must be installed via 'npm install node-fetch'.
 */
const fetch = require('node-fetch');
const fs = require('fs');

// --- Configuration ---
// The API Key is passed via GitHub Secrets (STOCK_MARKET_API environment variable)
const API_KEY = process.env.STOCK_MARKET_API;

// API Endpoint (Using /stock as confirmed)
const BASE_API_URL = "https://stock.indianapi.in/stock"; 

// List of stock names to query (as the API uses 'name' parameter)
// NOTE: These names must exactly match what the API expects for best results.
const STOCK_NAMES = [
    { name: 'Tata Consultancy Services', symbol: 'TCS' },
    { name: 'Reliance Industries', symbol: 'RELIANCE' },
    { name: 'Infosys', symbol: 'INFY' },
    { name: 'HDFC Bank', symbol: 'HDFC' },
    { name: 'ICICI Bank', symbol: 'ICICIBANK' }
]; 

// --- Core Logic ---

// Helper function to create mock holdings
const generateMockHoldings = (symbol) => {
    const rand = Math.floor(Math.random() * 5);
    if (rand === 0) return 0;
    return rand * 10; 
};

async function fetchAndProcessData() {
    console.log("Starting to fetch live stock data...");

    if (!API_KEY) {
        console.error("FATAL ERROR: STOCK_MARKET_API environment variable is not set. Please check GitHub Secrets.");
        process.exit(1);
    }
    
    const processedStocks = [];

    // Looping through each stock name to fetch data individually (API requirement)
    for (const stock of STOCK_NAMES) {
        // 1. Construct URL with 'name' parameter
        const url = `${BASE_API_URL}?name=${encodeURIComponent(stock.name)}`;

        // 2. Send API Key inside HTTP Headers
        const requestOptions = {
            method: 'GET',
            headers: {
                'X-API-KEY': API_KEY, 
                'Content-Type': 'application/json'
            }
        };

        try {
            console.log(`Attempting to fetch data for: ${stock.name} (${stock.symbol})`);
            const response = await fetch(url, requestOptions); 

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`- Error for ${stock.name}: Status ${response.status} (${response.statusText})`);
                console.error(`- Server Response: ${errorText}`);
                continue; // Skip to the next stock if current one fails
            }

            const data = await response.json();
            
            // --- Data Processing (Assuming the API returns the stock object directly) ---
            if (data && typeof data === 'object' && !Array.isArray(data)) {
                // Ensure to replace placeholder keys with the ACTUAL keys from your API response
                const currentPrice = data.lastPrice || 0;
                const changeValue = data.change || 0; 
                
                processedStocks.push({
                    name: stock.name,                                            
                    symbol: stock.symbol,                                          
                    indices: data.instrumentType || 'Equity',                       
                    currentPrice: parseFloat(currentPrice).toFixed(2),
                    todayChange: parseFloat(changeValue).toFixed(2),
                    // Re-calculating percentage change
                    changePercent: ((changeValue / (currentPrice - changeValue)) * 100).toFixed(2), 
                    holdings: generateMockHoldings(stock.symbol)
                });
            } else {
                console.error(`- Data structure for ${stock.name} was unexpected.`);
            }

        } catch (error) {
            console.error(`An error occurred while fetching ${stock.name}: ${error.message}`);
        }
    }
    
    // --- Final Step: Write to File ---
    if (processedStocks.length > 0) {
        fs.writeFileSync('marketdata.json', JSON.stringify(processedStocks, null, 2));
        console.log(`\n✅ Successfully fetched and saved ${processedStocks.length} stocks to marketdata.json.`);
    } else {
        console.error("\n❌ No stock data was successfully fetched. marketdata.json was not updated.");
        process.exit(1);
    }
}

fetchAndProcessData();
