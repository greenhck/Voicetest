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

// FIX ATTEMPT: Using the '/stock' endpoint based on the API list provided by you.
const BASE_API_URL = "https://stock.indianapi.in/stock"; 

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
        console.error("FATAL ERROR: STOCK_MARKET_API environment variable is not set. Please check GitHub Secrets.");
        process.exit(1);
    }
    
    // 1. Send Symbols as Query Parameter (Example: .../stock?symbols=TCS,RELIANCE)
    const url = `${BASE_API_URL}?symbols=${SAMPLE_SYMBOLS.join(',')}`;

    // 2. Send API Key inside HTTP Headers (ApiKeyAuth standard)
    const requestOptions = {
        method: 'GET',
        headers: {
            // Using X-API-KEY header as previously determined
            'X-API-KEY': API_KEY, 
            'Content-Type': 'application/json'
        }
    };


    try {
        console.log(`Attempting to fetch data from: ${url}`);
        const response = await fetch(url, requestOptions); 

        // Check for common HTTP error status codes (4xx and 5xx)
        if (!response.ok) {
            // Read and log the response body to understand WHY the server failed
            const errorText = await response.text();
            console.error(`An error occurred during API fetch. Status: ${response.status} (${response.statusText})`);
            console.error(`Server Response Body (Reason for Error): ${errorText}`);
            
            // Debugging hint for 403 status
            if (response.status === 403) {
                console.error("DEBUG HINT: 403 status often means the API Key is rejected or expired.");
            }

            throw new Error(`API fetch failed with status: ${response.status}`);
        }

        const data = await response.json();
        
        // --- Data Processing (Adjust the keys below based on the ACTUAL successful API response) ---
        // Assuming 'data' is an array of stock objects from the API
        const processedStocks = data.map(stock => {
            // Placeholder keys are used here; adjust these based on the ACTUAL keys in the successful API response
            const currentPrice = stock.lastPrice || 0;
            const changeValue = stock.change || 0; 
            
            return {
                name: stock.symbol,                                             
                indices: stock.instrumentType || 'Equity',                       
                currentPrice: parseFloat(currentPrice).toFixed(2),
                todayChange: parseFloat(changeValue).toFixed(2),
                // Re-calculating percentage change
                changePercent: ((changeValue / (currentPrice - changeValue)) * 100).toFixed(2), 
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
