// OpenAI configuration helper
// This file helps ensure that OpenAI client gets the API key from the right environment variable

export const getOpenAIKey = () => {
  // Try to get the key from either OPENAI_API_KEY or OPEN_AI_KEY
  const openAIKey = process.env.OPENAI_API_KEY || process.env.OPEN_AI_KEY;
  
  if (!openAIKey) {
    console.warn('OpenAI API key not found in environment variables. AI features may not work correctly.');
  }
  
  return openAIKey;
};

// Export a configured OpenAI instance if needed
export const getOpenAIConfig = () => {
  return {
    apiKey: getOpenAIKey(),
  };
}; 