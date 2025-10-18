// This file is designed to run in a controlled server environment, like GitHub Actions,
// NOT in the client's browser (index.html).
// It uses environment variables (like STOCK_MARKET_API) which are stored as GitHub Secrets.

const fs = require('fs'); // Node.js File System module (required for GitHub Action environment)
const fetch = require('node-fetch'); // Assuming a Node.js environment where fetch is available or polyfilled

// The API key is securely accessed from the environment variables set by the GitHub Secret.
const API_KEY = process.env.STOCK_MARKET_API;
const API_ENDPOINT = 'https://api.indianapi.in/v1/live_market_data'; // Placeholder endpoint

/**
 * Fetches data from the stock API, processes it, and saves it to marketdata.json.
 */
async function fetchAndSaveMarketData() {
    if (!API_KEY) {
        console.error("Error: STOCK_MARKET_API secret not found. Cannot fetch live data.");
        return;
    }

    try {
        console.log("Fetching live stock data...");
        
        // 1. Fetch data from the external API
        const response = await fetch(`${API_ENDPOINT}?key=${API_KEY}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`API fetch failed with status: ${response.status}`);
        }

        const rawData = await response.json();
        
        // 2. Process and calculate data (e.g., calculate change, holdings, filter relevant stocks)
        // NOTE: This part needs to be customized based on the exact API response structure.
        const processedData = rawData.stocks.map(stock => ({
            id: stock.symbol.toLowerCase().replace(/[^a-z0-9]/g, '_'),
            name: stock.company_name,
            index: stock.exchange,
            price: stock.ltp,
            change: stock.change_amount,
            percent: stock.change_percent,
            holdings: 0 // Placeholder: Holdings would ideally come from another user-specific database
        }));

        console.log(`Successfully processed ${processedData.length} stock entries.`);

        // 3. Save the processed data to marketdata.json
        fs.writeFileSync(
            './marketdata.json', 
            JSON.stringify(processedData, null, 4) // Pretty print JSON
        );
        
        console.log("Data successfully written to marketdata.json. Ready for GitHub Pages deployment.");

    } catch (error) {
        console.error("An error occurred during data processing:", error.message);
    }
}

// Execute the function
fetchAndSaveMarketData();

// When this script runs successfully in GitHub Actions at 3:30 PM, 
// it will create/update 'marketdata.json'.
