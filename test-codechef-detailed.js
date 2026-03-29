import axios from "axios";
import * as cheerio from "cheerio";

const testCodeChef = async (username) => {
  console.log(`\n=== Testing CodeChef for: ${username} ===\n`);
  
  try {
    const profileUrl = `https://www.codechef.com/users/${username}`;
    console.log(`Fetching: ${profileUrl}`);
    
    const response = await axios.get(profileUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);
    
    console.log('\n=== Looking for Problems Solved ===');
    
    // Method 1: Look for "problems solved" text
    $('*').each((i, elem) => {
      const text = $(elem).text().toLowerCase();
      if (text.includes('problem') && text.includes('solved')) {
        console.log(`Found element with "problems solved":`);
        console.log(`  Text: ${$(elem).text().trim().substring(0, 100)}`);
        console.log(`  HTML: ${$.html(elem).substring(0, 200)}`);
      }
    });
    
    // Method 2: Look for sections with numbers
    console.log('\n=== Looking for Rating Section ===');
    const ratingSection = $('.rating-data-section');
    if (ratingSection.length > 0) {
      console.log('Rating section found:');
      console.log(ratingSection.text().substring(0, 500));
    }
    
    // Method 3: Look for all h3 and h5 tags
    console.log('\n=== All H3 and H5 tags ===');
    $('h3, h5').each((i, elem) => {
      const text = $(elem).text().trim();
      if (text) {
        console.log(`${$(elem).prop('tagName')}: ${text.substring(0, 100)}`);
      }
    });
    
    // Method 4: Look for specific classes
    console.log('\n=== Looking for specific patterns ===');
    const patterns = [
      '.rating-number',
      '.rating-header',
      '[class*="problem"]',
      '[class*="solved"]',
      'section h3',
      'section h5'
    ];
    
    patterns.forEach(pattern => {
      const elements = $(pattern);
      if (elements.length > 0) {
        console.log(`\nPattern "${pattern}" found ${elements.length} elements:`);
        elements.slice(0, 3).each((i, elem) => {
          console.log(`  ${$(elem).text().trim().substring(0, 100)}`);
        });
      }
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  }
};

const username = process.argv[2] || 'goc_53';
testCodeChef(username);
