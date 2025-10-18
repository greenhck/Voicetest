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

// NOTE: Please replace this placeholder with the actual API endpoint URL 
// provided by indianapi.in for fetching stock data.
const BASE_API_URL = "https://api.indianapi.in/v1/latest-quotes"; 

// List of sample symbols to query from the API
const SAMPLE_SYMBOLS = ['TCS', 'RELIANCE', 'INFY', 'HDFC', 'ICICIBANK']; 

// --- Core Logic ---

// Helper function to create mock holdings for demonstration (since real holdings come from Local Storage/Firestore)
const generateMockHoldings = (symbol) => {
    // Generate a random holding count for a better demonstration of the UI
    const rand = Math.floor(Math.random() * 5);
    if (rand === 0) return 0;
    return rand * 10; 
};

async function fetchAndProcessData() {
    console.log("Starting to fetch live stock data...");

    if (!API_KEY) {
        console.error("FATAL ERROR: STOCK_MARKET_API environment variable is not set.");
        process.exit(1);
    }

    // FIX FOR 400 ERROR: Construct the URL with the API key as a query parameter.
    // NOTE: If indianapi.in requires the key in an 'Authorization' header, this part will need to be changed.
    const url = `${BASE_API_URL}?apiKey=${API_KEY}&symbols=${SAMPLE_SYMBOLS.join(',')}`;

    try {
        console.log(`Attempting to fetch data from: ${url}`);
        const response = await fetch(url);

        // Check for common HTTP error status codes (4xx and 5xx)
        if (!response.ok) {
            // Read and log the response body to understand WHY the server sent 400
            const errorText = await response.text();
            console.error(`An error occurred during API fetch. Status: ${response.status} (${response.statusText})`);
            console.error(`Server Response Body (Reason for 400): ${errorText}`);
            throw new Error(`API fetch failed with status: ${response.status}`);
        }

        const data = await response.json();
        
        // --- Data Processing (Adjust based on actual API response structure) ---
        // Assuming 'data' is an array of stock objects from the API
        const processedStocks = data.map(stock => {
            // Replace these placeholder keys with the actual keys from your indianapi.in response
            const currentPrice = stock.lastPrice || 0;
            const changeValue = stock.change || 0; 
            
            return {
                name: stock.symbol,                                             // e.g., "TCS"
                indices: stock.instrumentType || 'Equity',                       // e.g., "NSE"
                currentPrice: parseFloat(currentPrice).toFixed(2),
                todayChange: parseFloat(changeValue).toFixed(2),
                changePercent: ((changeValue / (currentPrice - changeValue)) * 100).toFixed(2), // Simple calculation
                holdings: generateMockHoldings(stock.symbol)
            };
        });

        // Write the processed data to the marketdata.json file
        fs.writeFileSync('marketdata.json', JSON.stringify(processedStocks, null, 2));
        console.log(`Successfully fetched and saved ${processedStocks.length} stocks to marketdata.json.`);

    } catch (error) {
        console.error(`An error occurred during data processing: ${error.message}`);
        // Ensure the process exits with an error code if the fetch fails
        process.exit(1);
    }
}

fetchAndProcessData();
