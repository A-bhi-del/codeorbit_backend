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
      
      // Pattern 1: Institute Rank
      const instituteMatch = bodyText.match(/Institute\s+Rank[:\s]*(\d+)/i);
      if (instituteMatch) {
        instituteRank = parseInt(instituteMatch[1]);
      }
      
      // Pattern 2: Coding Score (not the tab name, the actual score)
      const scorePatterns = [
        /Coding\s+Score[:\s]*(\d+)/i,
        /Score[:\s]*(\d+)/i,
        /Institute\s+Rank[:\s]*\d+[^\d]*(\d+)/i // Score often appears after Institute Rank
      ];
      
      for (const pattern of scorePatterns) {
        const match = bodyText.match(pattern);
        if (match) {
          const num = parseInt(match[1]);
          // Coding scores are typically between 1-10000
          if (num > 0 && num < 10000 && num !== 544) {
            score = num;
            break;
          }
        }
      }
      
      // Pattern 3: Problems Solved
      const problemsPatterns = [
        /Total\s+Problems?\s+Solved[:\s]*(\d+)/i,
        /Problems?\s+Solved[:\s]*(\d+)/i,
        /(\d+)\s+Problems?\s+Solved/i,
        /No\.\s+of\s+Problems?\s+Solved[:\s]*(\d+)/i,
        /Solved[:\s]*(\d+)\s+Problems?/i
      ];
      
      for (const pattern of problemsPatterns) {
        const match = bodyText.match(pattern);
        if (match) {
          const num = parseInt(match[1]);
          if (num > 0 && num < 5000 && num !== score) {
            problemsSolved = num;
            break;
          }
        }
      }
      
      // If still no data, look in all text nodes for number patterns
      if (!score && !problemsSolved) {
        const allText = document.body.innerText;
        const lines = allText.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          
          // Look for "Coding Score" followed by a number in next few lines
          if (line.includes('Coding Score') && i + 1 < lines.length) {
            const nextLine = lines[i + 1].trim();
            const numMatch = nextLine.match(/^(\d+)$/);
            if (numMatch) {
              const num = parseInt(numMatch[1]);
              if (num > 0 && num < 10000) {
                score = num;
              }
            }
          }
          
          // Look for "Problems Solved" followed by a number
          if (line.includes('Problems Solved') && i + 1 < lines.length) {
            const nextLine = lines[i + 1].trim();
            const numMatch = nextLine.match(/^(\d+)$/);
            if (numMatch) {
              const num = parseInt(numMatch[1]);
              if (num > 0 && num < 5000) {
                problemsSolved = num;
              }
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

    console.log(`GFG data for ${username}:`, {
      score: data.score,
      problemsSolved: data.problemsSolved,
      instituteRank: data.instituteRank
    });

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
