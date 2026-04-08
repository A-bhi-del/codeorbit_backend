import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const testGeminiV1 = async () => {
  const apiKey = process.env.GEMINI_API_KEY;
  
  console.log('Testing Gemini API with v1 endpoint...\n');
  
  try {
    // Try v1 endpoint
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
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
        }
      }
    );
    
    console.log('✓ v1 endpoint works!');
    console.log('Response:', response.data.candidates[0].content.parts[0].text);
  } catch (error) {
    console.error('✗ v1 Error:', error.response?.status, error.response?.data?.error?.message || error.message);
  }
  
  console.log('\n---\n');
  
  try {
    // Try v1beta endpoint
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
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
        }
      }
    );
    
    console.log('✓ v1beta endpoint works!');
    console.log('Response:', response.data.candidates[0].content.parts[0].text);
  } catch (error) {
    console.error('✗ v1beta Error:', error.response?.status, error.response?.data?.error?.message || error.message);
  }
};

testGeminiV1();
