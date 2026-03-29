import puppeteer from "puppeteer";

const testGFG = async (username) => {
  console.log(`\n=== Testing GFG with Tab Click for: ${username} ===\n`);
  
  const browser = await puppeteer.launch({ 
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

  try {
    const url = `https://auth.geeksforgeeks.org/user/${username}`;
    console.log(`Opening: ${url}`);
    
    await page.goto(url, {
      waitUntil: "networkidle0",
      timeout: 30000
    });

    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('\n=== Looking for Coding Score tab ===');
    
    // Try to find and click "Coding Score" tab
    try {
      // Wait for the tab to be visible
      await page.waitForSelector('button, a, [role="tab"]', { timeout: 5000 });
      
      // Try multiple selectors for the Coding Score tab
      const clicked = await page.evaluate(() => {
        // Look for elements containing "Coding Score"
        const allElements = Array.from(document.querySelectorAll('button, a, [role="tab"], div[class*="tab"]'));
        
        for (const elem of allElements) {
          const text = elem.innerText || elem.textContent || '';
          if (text.includes('Coding Score') || text.includes('coding score')) {
            console.log('Found Coding Score tab:', text);
            elem.click();
            return true;
          }
        }
        return false;
      });
      
      if (clicked) {
        console.log('✓ Clicked on Coding Score tab');
        await new Promise(resolve => setTimeout(resolve, 3000));
      } else {
        console.log('✗ Could not find Coding Score tab');
      }
    } catch (e) {
      console.log('Error clicking tab:', e.message);
    }

    // Take screenshot after clicking
    await page.screenshot({ path: 'gfg-coding-score.png', fullPage: true });
    console.log('Screenshot saved as gfg-coding-score.png');

    // Extract data
    const data = await page.evaluate(() => {
      const bodyText = document.body.innerText;
      
      let score = 0;
      let problemsSolved = 0;
      let instituteRank = 0;
      
      // Look for Institute Rank
      const instituteMatch = bodyText.match(/Institute\s+Rank[:\s]*(\d+)/i);
      if (instituteMatch) {
        instituteRank = parseInt(instituteMatch[1]);
      }
      
      // Look for Coding Score
      const scoreMatch = bodyText.match(/Coding\s+Score[:\s]*(\d+)/i);
      if (scoreMatch) {
        score = parseInt(scoreMatch[1]);
      }
      
      // Look for Problems Solved
      const problemsPatterns = [
        /Total\s+Problems?\s+Solved[:\s]*(\d+)/i,
        /Problems?\s+Solved[:\s]*(\d+)/i,
        /(\d+)\s+Problems?\s+Solved/i,
        /No\.\s+of\s+Problems?\s+Solved[:\s]*(\d+)/i
      ];
      
      for (const pattern of problemsPatterns) {
        const match = bodyText.match(pattern);
        if (match) {
          const num = parseInt(match[1]);
          if (num > 0 && num < 5000) {
            problemsSolved = num;
            break;
          }
        }
      }
      
      return {
        score,
        problemsSolved,
        instituteRank,
        pagePreview: bodyText.substring(0, 1500)
      };
    });

    console.log('\n=== Extracted Data ===');
    console.log(JSON.stringify(data, null, 2));
    
    console.log('\n=== Page Preview ===');
    console.log(data.pagePreview);

    console.log('\nKeeping browser open for 20 seconds...');
    await new Promise(resolve => setTimeout(resolve, 20000));

    await browser.close();
  } catch (err) {
    console.error('Error:', err.message);
    await browser.close();
  }
};

const username = process.argv[2] || 'guptaabhisuyez';
testGFG(username);
