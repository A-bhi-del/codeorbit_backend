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
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  try {
    const url = `https://auth.geeksforgeeks.org/user/${username}`;
    console.log(`Fetching GFG profile: ${url}`);
    
    await page.goto(url, {
      waitUntil: "networkidle0",
      timeout: 30000
    });

    // Wait for initial load
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Try to click on Coding Score tab
    try {
      const clicked = await page.evaluate(() => {
        const allElements = Array.from(document.querySelectorAll('button, a, [role="tab"], div'));
        for (const elem of allElements) {
          const text = (elem.innerText || elem.textContent || '').trim();
          if (text === 'Coding Score' || text === 'coding score') {
            elem.click();
            return true;
          }
        }
        return false;
      });
      
      if (clicked) {
        console.log('Clicked Coding Score tab, waiting for content...');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    } catch (e) {
      console.log('Could not click tab:', e.message);
    }

    const data = await page.evaluate(() => {
      const bodyText = document.body.innerText;
      
      let score = 0;
      let problemsSolved = 0;
      let instituteRank = 0;
      
      // Split text into lines for better parsing
      const lines = bodyText.split('\n').map(line => line.trim());
      
      // Look for "Problems Solved" followed by a number
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Pattern 1: "Problems Solved" on one line, number on next line
        if (line === 'Problems Solved' && i + 1 < lines.length) {
          const nextLine = lines[i + 1];
          const numMatch = nextLine.match(/^(\d+)$/);
          if (numMatch) {
            problemsSolved = parseInt(numMatch[1]);
            console.log(`Found Problems Solved: ${problemsSolved}`);
          }
        }
        
        // Pattern 2: "Coding Score" on one line, number on next line
        if (line === 'Coding Score' && i + 1 < lines.length) {
          const nextLine = lines[i + 1];
          const numMatch = nextLine.match(/^(\d+)$/);
          if (numMatch) {
            score = parseInt(numMatch[1]);
            console.log(`Found Coding Score: ${score}`);
          }
        }
        
        // Pattern 3: "Institute Rank" on one line, number on next line
        if (line === 'Institute Rank' && i + 1 < lines.length) {
          const nextLine = lines[i + 1];
          const numMatch = nextLine.match(/^(\d+)$/);
          if (numMatch) {
            instituteRank = parseInt(numMatch[1]);
            console.log(`Found Institute Rank: ${instituteRank}`);
          }
        }
      }
      
      // Fallback: Try regex patterns if line-by-line didn't work
      if (!problemsSolved) {
        const problemsPatterns = [
          /Problems?\s+Solved[:\s]*(\d+)/i,
          /(\d+)\s+Problems?\s+Solved/i,
          /Total\s+Problems?\s+Solved[:\s]*(\d+)/i,
        ];
        
        for (const pattern of problemsPatterns) {
          const match = bodyText.match(pattern);
          if (match) {
            const num = parseInt(match[1]);
            if (num > 0 && num < 5000) {
              problemsSolved = num;
              console.log(`Found Problems Solved (regex): ${problemsSolved}`);
              break;
            }
          }
        }
      }
      
      if (!score) {
        const scorePatterns = [
          /Coding\s+Score[:\s]*(\d+)/i,
        ];
        
        for (const pattern of scorePatterns) {
          const match = bodyText.match(pattern);
          if (match) {
            const num = parseInt(match[1]);
            if (num > 0 && num < 10000) {
              score = num;
              console.log(`Found Coding Score (regex): ${score}`);
              break;
            }
          }
        }
      }
      
      return {
        score,
        problemsSolved,
        instituteRank
      };
    });

    await browser.close();

    console.log(`✅ GFG data successfully fetched for ${username}:`, {
      score: data.score,
      problemsSolved: data.problemsSolved,
      instituteRank: data.instituteRank
    });

    if (data.problemsSolved === 0) {
      console.warn(`⚠️ WARNING: Problems Solved is 0 for ${username}. This might indicate scraping failed.`);
    }

    return {
      username,
      score: data.score,
      problemsSolved: data.problemsSolved,
      codingScore: data.score,
      lastFetched: new Date()
    };
  } catch (err) {
    await browser.close();
    console.error("GFG scraping error:", err.message);
    throw new Error(`GFG fetch failed: ${err.message}`);
  }
};
