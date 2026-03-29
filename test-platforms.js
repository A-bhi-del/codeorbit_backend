import { getCodeChefData } from "./services/codechefService.js";
import { getGFGData } from "./services/gfgService.js";

// Test CodeChef
async function testCodeChef() {
  console.log("\n=== Testing CodeChef ===");
  const testUsername = process.argv[2] || "test_user";
  
  try {
    console.log(`Fetching data for CodeChef user: ${testUsername}`);
    const data = await getCodeChefData(testUsername);
    console.log("✓ CodeChef Success:", JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("✗ CodeChef Error:", error.message);
  }
}

// Test GFG
async function testGFG() {
  console.log("\n=== Testing GFG ===");
  const testUsername = process.argv[3] || "test_user";
  
  try {
    console.log(`Fetching data for GFG user: ${testUsername}`);
    const data = await getGFGData(testUsername);
    console.log("✓ GFG Success:", JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("✗ GFG Error:", error.message);
  }
}

// Run tests
(async () => {
  await testCodeChef();
  await testGFG();
  process.exit(0);
})();
