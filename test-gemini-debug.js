import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const debugGeminiAPI = async () => {
  const apiKey = process.env.GEMINI_API_KEY;
  
  console.log('Debugging Gemini API access...\n');
  console.log('API Key length:', apiKey?.length);
  console.log('API Key prefix:', apiKey?.substring(0, 15) + '...');
  console.log('');
  
  // Test 1: List models (this should work if API is enabled)
  console.log('Test 1: Listing available models...');
  try {
    const response = await axios.get(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );
    console.log('✓ Can list models - API key is valid and API is enabled');
    console.log(`Found ${response.data.models.length} models`);
  } catch (error) {
    console.error('✗ Cannot list models');
    console.error('Status:', error.response?.status);
    console.error('Error:', error.response?.data?.error?.message || error.message);
    console.log('\nThis means either:');
    console.log('1. The API key is invalid');
    console.log('2. The Generative Language API is not enabled');
    console.log('3. Your project has restrictions');
    console.log('\nPlease visit: https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com');
    return;
  }
  
  console.log('\n---\n');
  
  // Test 2: Simple generation
  console.log('Test 2: Testing content generation...');
  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        contents: [{
          parts: [{
            text: "Reply with just the word 'success'"
          }]
        }]
      },
      {
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
    
    console.log('✓ Content generation works!');
    console.log('Response:', response.data.candidates[0].content.parts[0].text);
    console.log('\n✓✓✓ Gemini API is fully functional! ✓✓✓');
  } catch (error) {
    console.error('✗ Content generation failed');
    console.error('Status:', error.response?.status);
    console.error('Error:', error.response?.data?.error?.message || error.message);
  }
};

debugGeminiAPI();
