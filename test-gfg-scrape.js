import puppeteer from "puppeteer";

const testGFGScraping = async (username) => {
  console.log(`\n=== Testing GFG Scraping for: ${username} ===\n`);
  
  const browser = await puppeteer.launch({ 
    headless: false, // Show browser for debugging
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();

  try {
    const url = `https://auth.geeksforgeeks.org/user/${username}`;
    console.log(`Opening: ${url}`);
    
    await page.goto(url, {
      waitUntil: "networkidle0",
      timeout: 30000
    });

    // Wait for page to fully load
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Take screenshot
    await page.screenshot({ path: 'gfg-profile.png' });
    console.log('Screenshot saved as gfg-profile.png');

    // Get all text content
    const pageText = await page.evaluate(() => document.body.innerText);
    console.log('\n=== Page Text (first 1000 chars) ===');
    console.log(pageText.substring(0, 1000));

    // Try to find specific data
    const data = await page.evaluate(() => {
      const text = document.body.innerText;
      
      // Look for patterns
      const scoreMatch = text.match(/Coding Score[:\s]*(\d+)/i);
      const problemsMatch = text.match(/(\d+)[:\s]*Problems?\s*Solved/i);
      const instituteMatch = text.match(/Institute Rank[:\s]*(\d+)/i);
      
      return {
        fullText: text.substring(0, 500),
        scoreMatch: scoreMatch ? scoreMatch[1] : null,
        problemsMatch: problemsMatch ? problemsMatch[1] : null,
        instituteMatch: instituteMatch ? instituteMatch[1] : null
      };
    });

    console.log('\n=== Extracted Data ===');
    console.log(JSON.stringify(data, null, 2));

    console.log('\nPress Ctrl+C to close browser...');
    await new Promise(resolve => setTimeout(resolve, 30000)); // Keep browser open for 30 seconds

    await browser.close();
  } catch (err) {
    console.error('Error:', err.message);
    await browser.close();
  }
};

const username = process.argv[2] || 'guptaabhisuyez';
testGFGScraping(username);
