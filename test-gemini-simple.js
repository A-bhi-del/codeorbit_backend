import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const testGeminiAPI = async () => {
  const apiKey = process.env.GEMINI_API_KEY;
  
  console.log('Testing Gemini API with a simple request...\n');
  console.log('API Key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'NOT FOUND');
  console.log('');
  
  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        contents: [{
          parts: [{
            text: "Say hello in JSON format with a 'message' field"
          }]
        }]
      },
      {
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
    
    console.log('✓ Success! API is working.');
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('✗ Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
  }
};

testGeminiAPI();
