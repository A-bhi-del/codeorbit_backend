import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const testDifferentModels = async () => {
  const apiKey = process.env.GEMINI_API_KEY;
  
  const modelsToTry = [
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-flash-latest',
    'gemini-pro-latest'
  ];
  
  console.log('Testing different Gemini models for content generation...\n');
  
  for (const model of modelsToTry) {
    console.log(`Testing: ${model}`);
    try {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          contents: [{
            parts: [{
              text: "Say hello"
            }]
          }]
        },
        {
          headers: {
            "Content-Type": "application/json"
          },
          timeout: 10000
        }
      );
      
      console.log(`✓ ${model} WORKS!`);
      console.log(`Response: ${response.data.candidates[0].content.parts[0].text}\n`);
    } catch (error) {
      console.log(`✗ ${model} failed: ${error.response?.data?.error?.message || error.message}\n`);
    }
  }
};

testDifferentModels();
