import puppeteer from "puppeteer";

export const getGFGData = async (username) => {
  const browser = await puppeteer.launch({ 
    headless: "new",
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled'
    ]
  });
  
  const page = await browser.newPage();

  // Set a realistic user agent
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  try {
    const url = `https://auth.geeksforgeeks.org/user/${username}`;
    console.log(`Fetching GFG profile: ${url}`);
    
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 30000
    });

    // Wait for content to load
    await new Promise(resolve => setTimeout(resolve, 5000));

    const data = await page.evaluate(() => {
      let score = 0;
      let problemsSolved = 0;
      let instituteRank = 0;

      // Get all text content
      const bodyText = document.body.innerText;
      
      // Strategy 1: Look for "Coding Score" followed by a number
      const codingScoreMatch = bodyText.match(/Coding\s+Score[:\s]*(\d+)/i);
      if (codingScoreMatch) {
        score = parseInt(codingScoreMatch[1]);
      }
      
      // Strategy 2: Look for "Institute Rank" (sometimes shows score nearby)
      const instituteMatch = bodyText.match(/Institute\s+Rank[:\s]*(\d+)/i);
      if (instituteMatch) {
        instituteRank = parseInt(instituteMatch[1]);
      }
      
      // Strategy 3: Look for "Problems Solved" or "Total Problems Solved"
      const problemsMatch1 = bodyText.match(/(\d+)\s+Problems?\s+Solved/i);
      const problemsMatch2 = bodyText.match(/Problems?\s+Solved[:\s]*(\d+)/i);
      const problemsMatch3 = bodyText.match(/Total\s+Problems?\s+Solved[:\s]*(\d+)/i);
      
      if (problemsMatch1) problemsSolved = parseInt(problemsMatch1[1]);
      else if (problemsMatch2) problemsSolved = parseInt(problemsMatch2[1]);
      else if (problemsMatch3) problemsSolved = parseInt(problemsMatch3[1]);
      
      // Strategy 4: Look in specific sections
      const profileSections = document.querySelectorAll('[class*="profile"], [class*="score"], [class*="stat"]');
      profileSections.forEach(section => {
        const text = section.innerText || '';
        
        if (!score && text.includes('Coding Score')) {
          const match = text.match(/(\d+)/);
          if (match) {
            const num = parseInt(match[1]);
            if (num > 0 && num < 10000) score = num;
          }
        }
        
        if (!problemsSolved && text.includes('Problems Solved')) {
          const match = text.match(/(\d+)/);
          if (match) {
            const num = parseInt(match[1]);
            if (num > 0 && num < 5000) problemsSolved = num;
          }
        }
      });

      return {
        score,
        problemsSolved,
        instituteRank,
        debugText: bodyText.substring(0, 1000)
      };
    });

    await browser.close();

    console.log(`GFG data for ${username}:`, {
      score: data.score,
      problemsSolved: data.problemsSolved,
      instituteRank: data.instituteRank
    });

    // Validate the data
    const finalScore = (data.score > 0 && data.score < 10000) ? data.score : 0;
    const finalProblems = (data.problemsSolved > 0 && data.problemsSolved < 5000) ? data.problemsSolved : 0;

    return {
      username,
      score: finalScore,
      problemsSolved: finalProblems,
      codingScore: finalScore,
      lastFetched: new Date()
    };
  } catch (err) {
    await browser.close();
    console.error("GFG scraping error:", err.message);
    throw new Error(`GFG fetch failed: ${err.message}`);
  }
};
