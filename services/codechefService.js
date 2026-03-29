import puppeteer from "puppeteer";

export const getCodeChefData = async (username) => {
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
    const url = `https://www.codechef.com/users/${username}`;
    console.log(`Fetching CodeChef profile: ${url}`);
    
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 30000
    });

    // Wait for content
    await new Promise(resolve => setTimeout(resolve, 5000));

    const data = await page.evaluate(() => {
      const bodyText = document.body.innerText;
      
      let rating = 0;
      let highestRating = 0;
      let stars = '0★';
      let problemsSolved = 0;
      
      // Look for "Total Problems Solved: XX"
      const totalProblemsMatch = bodyText.match(/Total\s+Problems?\s+Solved[:\s]*(\d+)/i);
      if (totalProblemsMatch) {
        problemsSolved = parseInt(totalProblemsMatch[1]);
      }
      
      // Look for current rating - more specific pattern
      // Pattern: "1439 (-16)" or just "1439" followed by rating context
      const currentRatingMatch = bodyText.match(/(\d{3,4})\s*\([+-]\d+\)/);
      if (currentRatingMatch) {
        rating = parseInt(currentRatingMatch[1]);
      }
      
      // Look for highest rating
      const highestMatch = bodyText.match(/Highest\s+Rating[:\s]*(\d+)/i);
      if (highestMatch) {
        highestRating = parseInt(highestMatch[1]);
      } else {
        highestRating = rating; // Default to current if not found
      }
      
      // Look for stars - pattern like "2★abhi_12547839"
      const starsMatch = bodyText.match(/(\d+)★/);
      if (starsMatch) {
        stars = starsMatch[1] + '★';
      }
      
      // Alternative: Look for "CodeChef Rating" section
      if (!rating) {
        const ratingSection = bodyText.match(/(\d{3,4})\s*\(Div\s+\d+\)/i);
        if (ratingSection) {
          rating = parseInt(ratingSection[1]);
        }
      }
      
      return {
        rating,
        highestRating,
        stars,
        problemsSolved
      };
    });

    await browser.close();

    console.log(`CodeChef data for ${username}:`, {
      rating: data.rating,
      highestRating: data.highestRating,
      stars: data.stars,
      problemsSolved: data.problemsSolved
    });

    return {
      username,
      rating: data.rating,
      highestRating: data.highestRating,
      stars: data.stars,
      globalRank: 0,
      countryRank: 0,
      problemsSolved: data.problemsSolved,
      lastFetched: new Date()
    };
  } catch (err) {
    await browser.close();
    console.error("CodeChef error:", err.message);
    throw new Error(`CodeChef fetch failed: ${err.message}`);
  }
};
