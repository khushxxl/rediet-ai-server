const OpenAI = require("openai");
const config = require("../config/config");

class OpenAIService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: config.openaiApiKey,
    });
  }

  async createChatCompletion(messages, model = "gpt-3.5-turbo-0125") {
    const completion = await this.openai.chat.completions.create({
      messages,
      model,
    });
    return completion.choices[0].message.content;
  }

  async analyzeImage(messages) {
    const response = await this.openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      max_tokens: 2000,
    });
    return response.choices[0].message.content;
  }
}

module.exports = new OpenAIService();
