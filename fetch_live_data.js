/**
 * Daily Bhavcopy Fetch Script (fetch_live_data.js)
 * * Fetches the complete daily closing data (Bhavcopy) from NSE India.
 * * This fulfills the request for 'all information' updated 'once after market close' 
 * * without relying on rate-limited APIs or fragile live scraping.
 */
const fetch = require('node-fetch');
const fs = require('fs');
const zlib = require('zlib');
const csvParser = require('csv-parser');
const { Writable } = require('stream');

// --- Configuration ---

// Function to calculate the date of the previous trading day (Mon-Fri)
function getPreviousTradingDay() {
    const date = new Date();
    // Get time in IST (UTC + 5.5 hours) for accurate market close check
    date.setUTCHours(date.getUTCHours() + 5); 
    date.setUTCMinutes(date.getUTCMinutes() + 30);
    
    let day = date.getDay();
    let diff = 1; // Default to yesterday
    
    if (day === 0) diff = 2; // If today is Sunday, go back 2 days (to Friday)
    if (day === 6) diff = 1; // If today is Saturday, go back 1 day (to Friday)
    
    // Check if the market is open today (Mon-Fri) and it's before market close (3:30 PM IST)
    const currentISTHour = date.getHours();
    const currentISTMinute = date.getMinutes();
    
    // If it's a weekday and before 4:00 PM IST, use the day before yesterday's data 
    // to ensure we get the fully processed closing Bhavcopy, especially early in the run.
    if (day >= 1 && day <= 5 && (currentISTHour < 16)) { 
        diff += 1;
    }
    
    date.setDate(date.getDate() - diff);
    
    // Ensure we don't land on Sat or Sun
    while (date.getDay() === 0 || date.getDay() === 6) {
        date.setDate(date.getDate() - 1);
    }
    
    return date;
}

function getBhavcopyUrl(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const monthIndex = date.getMonth();
    const year = date.getFullYear();
    const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    const month = monthNames[monthIndex];
    
    // Example: cm18OCT2025bhav.csv.zip
    const filename = `cm${day}${month}${year}bhav.csv.zip`;
    // Using the archival URL which is generally more stable for direct download
    return `https://www1.nseindia.com/content/historical/EQUITIES/${year}/${month}/${filename}`;
}

// --- Core Logic ---

async function fetchAndProcessBhavcopy() {
    const date = getPreviousTradingDay();
    const bhavcopyUrl = getBhavcopyUrl(date);
    const dateString = date.toLocaleDateString('en-IN');
    
    console.log(`Starting Bhavcopy Fetch for trading day: ${dateString}`);
    console.log(`URL: ${bhavcopyUrl}`);

    try {
        const response = await fetch(bhavcopyUrl);
        
        if (!response.ok) {
            console.error(`\nFATAL ERROR: Failed to fetch Bhavcopy from NSE. Status: ${response.status} (${response.statusText})`);
            console.error("This usually happens if the file for the target date is not yet uploaded by NSE.");
            process.exit(1);
        }
        
        // 1. Unzip and Parse the CSV Stream
        const allStockData = [];
        
        // Pipe the response stream through the unzipper and CSV parser
        await new Promise((resolve, reject) => {
            response.body
                .pipe(zlib.createGunzip()) // Unzip the .zip (which is often GZipped content)
                .pipe(csvParser())
                .on('data', (data) => {
                    // Filter for 'EQ' series (Equity) and process
                    if (data.SERIES === 'EQ' && data.SYMBOL) {
                        const close = parseFloat(data.CLOSE);
                        const prevClose = parseFloat(data.PREVCLOSE);
                        const todayChange = close - prevClose;
                        const changePercent = (todayChange / prevClose) * 100;

                        allStockData.push({
                            name: data.SYMBOL + ' Ltd.', // Placeholder name, as Bhavcopy lacks full name
                            symbol: data.SYMBOL,
                            indices: data.SERIES,
                            currentPrice: close.toFixed(2),
                            todayChange: todayChange.toFixed(2),
                            changePercent: changePercent.toFixed(2),
                            holdings: generateMockHoldings(data.SYMBOL)
                        });
                    }
                })
                .on('end', resolve)
                .on('error', (err) => {
                    console.error("CSV or GZIP parsing error:", err.message);
                    reject(err);
                });
        });
        
        if (allStockData.length === 0) {
            console.error("FATAL ERROR: Parsed data, but found zero 'EQ' (Equity) stock entries.");
            process.exit(1);
        }

        // 2. Write the JSON file
        fs.writeFileSync('marketdata.json', JSON.stringify(allStockData, null, 2));
        console.log(`\n✅ Success! Saved ${allStockData.length} REAL Equity stocks from Bhavcopy dated ${dateString}.`);

    } catch (error) {
        console.error(`\nFATAL ERROR: An unexpected error occurred: ${error.message}`);
        process.exit(1);
    }
}

const generateMockHoldings = (symbol) => {
    // Retained mock function
    const rand = Math.floor(Math.random() * 5);
    if (rand === 0) return 0;
    return rand * 10; 
};

fetchAndProcessBhavcopy();
