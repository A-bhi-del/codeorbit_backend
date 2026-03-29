import puppeteer from "puppeteer";

const testCodeChef = async (username) => {
  console.log(`\n=== Testing CodeChef with Puppeteer for: ${username} ===\n`);
  
  const browser = await puppeteer.launch({ 
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();

  try {
    const url = `https://www.codechef.com/users/${username}`;
    console.log(`Opening: ${url}`);
    
    await page.goto(url, {
      waitUntil: "networkidle0",
      timeout: 30000
    });

    await new Promise(resolve => setTimeout(resolve, 5000));

    // Take screenshot
    await page.screenshot({ path: 'codechef-profile.png', fullPage: true });
    console.log('Screenshot saved as codechef-profile.png');

    // Get page text
    const pageText = await page.evaluate(() => document.body.innerText);
    console.log('\n=== Page Text (first 2000 chars) ===');
    console.log(pageText.substring(0, 2000));

    // Look for specific data
    const data = await page.evaluate(() => {
      const text = document.body.innerText;
      
      // Look for various patterns
      const ratingMatch = text.match(/Rating[:\s]*(\d+)/i);
      const problemsMatch = text.match(/(\d+)[:\s]*Problems?\s*Solved/i);
      const problemsMatch2 = text.match(/Problems?\s*Solved[:\s]*(\d+)/i);
      const totalMatch = text.match(/Total[:\s]*(\d+)/i);
      
      // Look for sections
      const sections = [];
      document.querySelectorAll('section, .section, [class*="section"]').forEach(section => {
        const sectionText = section.innerText;
        if (sectionText.includes('Problem') || sectionText.includes('Rating') || sectionText.includes('Contest')) {
          sections.push(sectionText.substring(0, 200));
        }
      });
      
      return {
        ratingMatch: ratingMatch ? ratingMatch[1] : null,
        problemsMatch: problemsMatch ? problemsMatch[1] : null,
        problemsMatch2: problemsMatch2 ? problemsMatch2[1] : null,
        totalMatch: totalMatch ? totalMatch[1] : null,
        sections: sections
      };
    });

    console.log('\n=== Extracted Data ===');
    console.log(JSON.stringify(data, null, 2));

    console.log('\nKeeping browser open for 20 seconds...');
    await new Promise(resolve => setTimeout(resolve, 20000));

    await browser.close();
  } catch (err) {
    console.error('Error:', err.message);
    await browser.close();
  }
};

const username = process.argv[2] || 'goc_53';
testCodeChef(username);
