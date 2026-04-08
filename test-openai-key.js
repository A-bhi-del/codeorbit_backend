import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const testOpenAIKey = async () => {
  console.log('\n=== Testing OpenAI API Key ===\n');
  
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    console.error('✗ OPENAI_API_KEY not found in environment variables');
    return;
  }
  
  console.log(`API Key found: ${apiKey.substring(0, 20)}...${apiKey.substring(apiKey.length - 10)}`);
  console.log(`Key length: ${apiKey.length} characters`);
  
  try {
    console.log('\nTesting API key with a simple request...\n');
    
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "user",
            content: "Say 'API key is working!'"
          }
        ],
        max_tokens: 10
      },
      {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        }
      }
    );
    
    console.log('✓ API Key is VALID!');
    console.log('Response:', response.data.choices[0].message.content);
    
  } catch (error) {
    console.error('✗ API Key is INVALID');
    console.error('Error:', error.response?.status, error.response?.statusText);
    console.error('Details:', error.response?.data);
  }
};

testOpenAIKey();
