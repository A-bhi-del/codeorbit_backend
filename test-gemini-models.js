import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const listGeminiModels = async () => {
  const apiKey = process.env.GEMINI_API_KEY;
  
  console.log('Fetching available Gemini models...\n');
  
  try {
    const response = await axios.get(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );
    
    console.log('Available models:');
    response.data.models.forEach(model => {
      console.log(`- ${model.name}`);
      console.log(`  Display Name: ${model.displayName}`);
      console.log(`  Supported Methods: ${model.supportedGenerationMethods.join(', ')}`);
      console.log('');
    });
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
};

listGeminiModels();
