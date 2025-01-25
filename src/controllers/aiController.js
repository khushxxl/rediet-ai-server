const openaiService = require("../services/openaiService");
const { Deepgram, createClient } = require("@deepgram/sdk");

class AIController {
  async createDietReportUsingAudio(req, res) {
    try {
      const { audio } = req.body;

      console.log("Audio Received");
      const deepgram = createClient(process.env.DEEPGRAM_API_KEY);

      // Decode base64 audio to buffer and convert to WAV
      const audioBuffer = Buffer.from(audio, "base64");

      // Get audio transcription from Deepgram
      const { result, error } = await deepgram.listen.prerecorded.transcribeUrl(
        {
          buffer: audioBuffer,
          mimetype: "audio/wav",
        },
        {
          model: "nova-2",
          language: "en",
        }
      );

      if (error) {
        throw new Error("Failed to transcribe audio: " + error.message);
      }

      const transcribedText =
        result.results?.channels[0]?.alternatives[0]?.transcript;
      console.log("Transcribed Text-> ", transcribedText);

      // Send transcribed text to OpenAI for diet report analysis
      const messages = [
        {
          role: "system",
          content:
            "You are a professional nutritionist analyzing a patient's diet description.",
        },
        {
          role: "user",
          content: `
       
        
        You are a professional nutritionist and trainer, you are going to generate a health report for me,
        i shall give you my diet and exercise details along with my profile information. You are going to analyze my diet, exercise and profile to give me a personalized health report.
        Be as accurate as possible. If exercise details are included then include exercise analysis in your report.
        If diet details are included then include diet analysis in your report. 

        Give your response in pure json format, start with { and end with }, avoid - json backticks  in your response, i dont need that



{
  "report": {
    "macros": {
      "recommended": {
        "calories": "2000",
        "protein": "150",
        "carbs": "200", 
        "fats": "100"
      }
    },
    "summary": {
      "health_score": "Summarize opinion about user's message and profile -  and give score out of 10",
      "strength": "Summary of user's strengths from message and profile",
      "areas_of_improvement": "Key areas that need focus based on goals and current habits"
    },
    "detailed_analysis": {
      "parameters": {
        "diet_score": "Analyze diet vs recommended calories/macros, give score out of 10",
        "exercise_score": "Analyze exercise routine for goal alignment, give score out of 10", 
        "sleep_score": "Analyze sleep patterns, give score out of 10",
        "overall_lifestyle_score": "Overall score considering profile goals and habits"
      },
      "insights": {
        "diet_insights": "Detailed insights about diet patterns, nutritional balance vs recommended",
        "exercise_insights": "Exercise analysis considering fitness goals and current level",
        "sleep_insights": "Sleep pattern analysis and impact on goals",
        "recommendations": "Specific recommendations based on profile and analysis"
      },
      "personalized_recommendations": {
        "diet_changes": "Dietary changes aligned with calorie/macro targets",
        "exercise_modifications": "Exercise adjustments for optimal goal achievement",
        "stress_management": "Stress management techniques considering lifestyle",
        "sleep_improvement": "Sleep optimization recommendations"
      }
    }
  }
        }`,
        },
      ];

      const response = await openaiService.createChatCompletion(messages);
      res.json({ response: JSON.parse(response) });
    } catch (error) {
      throw error;
    }
  }
  async chat(req, res) {
    try {
      const { message, messageHistory, user_profile } = req.body;

      const prompt = {
        role: "user",
        content: `You are an expert nutritionist and certified personal trainer. Provide evidence-based nutrition and fitness advice tailored to the user's needs and timing.

If asked about food choices, consider:
- Time of day and meal timing
- Nutritional value and macronutrients
- Portion control and calorie content
- Healthier alternatives when needed

Here is the user's profile: ${user_profile} - this is the profile of the user, if its empty then just ignore it else use it to give better response
if user asks about their personal info refer this - ${user_profile}
dont recommend them any apps/tools/products/etc, just give them advice
Don't claim to be a doctor or a medical professional, or are a nutritionist and trainer, you'r name is "Rediet AI", act as a nutritionist and trainer, but dont claim to be a nutritionist and trainer
For example, if someone asks about late-night snacks, recommend low-calorie, nutrient-dense options that won't disrupt sleep.
if they ask for recipes, sugges minimum 5 recipes
Only provide advice related to nutrition, diet, exercise and general wellness. For other topics, clarify that you can only assist with health and fitness matters.
Here is the user's question: ${message}   
Here is the user's message history: ${messageHistory} - this is the history of the conversation between the user and the assistant, if its empty then just ignore it else use it to give better response`,
      };

      const response = await openaiService.createChatCompletion([prompt]);
      res.json({ response });
    } catch (error) {
      throw error;
    }
  }

  async generateHealthReport(req, res) {
    try {
      const { message, profile } = req.body;
      const prompt = {
        role: "user",
        content: `You are a professional nutritionist and trainer, you are going to generate a health report for me,
i shall give you my diet and exercise details along with my profile information. You are going to analyze my diet, exercise and profile to give me a personalized health report.
Be as accurate as possible. If exercise details are included then include exercise analysis in your report.
If diet details are included then include diet analysis in your report.

{
  "report": {
    "macros": {
      "recommended": {
        "calories": "2000",
        "protein": "150",
        "carbs": "200", 
        "fats": "100"
      }
    },
    "summary": {
      "health_score": "Summarize opinion about user's message and profile - ${message}, ${profile} and give score out of 10",
      "strength": "Summary of user's strengths from message and profile",
      "areas_of_improvement": "Key areas that need focus based on goals and current habits"
    },
    "detailed_analysis": {
      "parameters": {
        "diet_score": "Analyze diet vs recommended calories/macros, give score out of 10",
        "exercise_score": "Analyze exercise routine for goal alignment, give score out of 10", 
        "sleep_score": "Analyze sleep patterns, give score out of 10",
        "overall_lifestyle_score": "Overall score considering profile goals and habits"
      },
      "insights": {
        "diet_insights": "Detailed insights about diet patterns, nutritional balance vs recommended",
        "exercise_insights": "Exercise analysis considering fitness goals and current level",
        "sleep_insights": "Sleep pattern analysis and impact on goals",
        "recommendations": "Specific recommendations based on profile and analysis"
      },
      "personalized_recommendations": {
        "diet_changes": "Dietary changes aligned with calorie/macro targets",
        "exercise_modifications": "Exercise adjustments for optimal goal achievement",
        "stress_management": "Stress management techniques considering lifestyle",
        "sleep_improvement": "Sleep optimization recommendations"
      }
    }
  }
}`,
      };

      const response = await openaiService.createChatCompletion(
        [prompt],
        "gpt-4o-mini"
      );
      res.json({ response: JSON.parse(response) });
    } catch (error) {
      throw error;
    }
  }

  async analyzeFoodImage(req, res) {
    try {
      const { image } = req.body;
      if (!image) {
        return res.status(400).json({ error: "No image data provided" });
      }

      const messages = [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `you are a proffessional nutritionist and a trainer and you are going to help me with my diet,  
an image is attached to this message, you are going to analyze the image and give me the food info,
be as accurate as possible,

i need the image in pure json format,

avoid - json backticks  in your response, i dont need that start & end with { }
here is an example response:
{
  "food_name": "Grilled Chicken Salad",
  "ingredients": [
    "Tomato",
    "Lettuce", 
    "Cherry Tomatoes",
    "Cucumber",
    "Olive Oil Dressing"
  ],
  "macros": {
    "calories": 320,
    "protein": 35,
    "carbs": 12,
    "fat": 18,
    "fiber": 5
  },
  "health_score":{
    "score": 8.5,
    "comments": "This is a healthy food"
  }
}`,
            },
            { type: "image_url", image_url: { url: image, detail: "high" } },
          ],
        },
      ];

      const result = await openaiService.analyzeImage(messages);
      res.json({ result: JSON.parse(result) });
    } catch (error) {
      throw error;
    }
  }

  async getMacros(req, res) {
    try {
      const { userAnswers } = req.body;
      console.log("User Answers-> ", userAnswers);

      // Calculate age from birthDate

      const messages = [
        {
          role: "user",
          content: `As a professional nutritionist, calculate the recommended daily macros based on these parameters:
          ${userAnswers}


        Provide the response in pure JSON format with the following structure:
        {
        "daily_macros": {
            "calories": 0,
            "protein": 0,
            "carbs": 0,
            "fats": 0,
            "fiber": 0
        },
        
        }`,
        },
      ];

      const result = await openaiService.createChatCompletion(messages);
      console.log("Result-> ", result);
      res.json({ result: JSON.parse(result) });
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new AIController();
