import { fetchLeetCodeSolvedProblems } from "./services/leetcode.service.js";
import { fetchCodeforcesSolvedProblems } from "./services/codeforces.service.js";

const testProblemsAPI = async () => {
  console.log('\n=== Testing LeetCode Problems API ===\n');
  
  try {
    const leetcodeUsername = 'Abhi_4352'; // Correct username with capital A
    console.log(`Fetching LeetCode problems for: ${leetcodeUsername}`);
    const leetcodeProblems = await fetchLeetCodeSolvedProblems(leetcodeUsername);
    console.log(`✓ LeetCode: Found ${leetcodeProblems.length} problems`);
    if (leetcodeProblems.length > 0) {
      console.log('\nFirst problem with details:');
      const firstProblem = leetcodeProblems[0];
      console.log(`  Title: ${firstProblem.title}`);
      console.log(`  Difficulty: ${firstProblem.difficulty || 'N/A'}`);
      console.log(`  Tags: ${firstProblem.tags?.join(', ') || 'N/A'}`);
      console.log(`  Description: ${firstProblem.description ? firstProblem.description.substring(0, 200) + '...' : 'N/A'}`);
      console.log(`  Link: ${firstProblem.link}`);
    } else {
      console.log('No problems found');
    }
  } catch (error) {
    console.error('✗ LeetCode Error:', error.message);
  }

  console.log('\n=== Testing Codeforces Problems API ===\n');
  
  try {
    const codeforcesHandle = 'tourist';
    console.log(`Fetching Codeforces problems for: ${codeforcesHandle}`);
    const codeforcesProblems = await fetchCodeforcesSolvedProblems(codeforcesHandle);
    console.log(`✓ Codeforces: Found ${codeforcesProblems.length} problems`);
    if (codeforcesProblems.length > 0) {
      console.log('\nFirst problem with details:');
      const firstProblem = codeforcesProblems[0];
      console.log(`  Title: ${firstProblem.title}`);
      console.log(`  Rating: ${firstProblem.rating}`);
      console.log(`  Tags: ${firstProblem.tags.join(', ')}`);
      console.log(`  Description: ${firstProblem.description || 'Not available (Codeforces blocks scraping)'}`);
      console.log(`  Link: ${firstProblem.link}`);
    }
  } catch (error) {
    console.error('✗ Codeforces Error:', error.message);
  }
};

testProblemsAPI();
