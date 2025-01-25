const dotenv = require("dotenv");
const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");

const app = express();
const port = process.env.PORT || 8000; // Allow Heroku to set port
dotenv.config();

// Middleware
app.use(
  cors({
    origin: "*", // Allow all origins
    methods: ["GET", "POST"], // Allow specific methods
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "50mb" })); // Need to enable JSON parsing with increased limit for base64
app.use(express.urlencoded({ extended: true, limit: "50mb" })); // Also increase urlencoded limit
// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Make sure to set this environment variable
});

// Health check endpoint for Heroku
app.get("/", (req, res) => {
  res.send("Server is running");
});

// Chat endpoint
app.post("/api/chat", async (req, res) => {
  try {
    const { message, messageHistory, user_profile } = req.body;

    console.log("message", message);
    console.log("messageHistory", messageHistory);
    console.log("user_profile", user_profile);

    const completion = await openai.chat.completions.create({
      messages: [
        {
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
Here is the user's message history: ${messageHistory} - this is the history of the conversation between the user and the assistant, if its empty then just ignore it else use it to give better response
`,
        },
      ],
      model: "gpt-3.5-turbo-0125",
    });

    console.log("completion", completion);
    console.log(completion.choices[0].message.content);
    res.json({
      response: completion.choices[0].message.content,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

app.post("/api/generate-health-report", async (req, res) => {
  console.log("Request received");
  const { message, profile } = req.body;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: `You are a professional nutritionist and trainer, you are going to generate a health report for me,
          i shall give you my diet and exercise details along with my profile information. You are going to analyze my diet, exercise and profile to give me a personalized health report.
          Be as accurate as possible. If exercise details are included then include exercise analysis in your report.
          If diet details are included then include diet analysis in your report.

          Please make sure data is as accurate as possible this a paying customer,

          DONT INCLUDE ANYTHING ELSE FROM THE USER EXCEPT THE DIET, EXERCISE & MEDICAL HISTORY DETAILS

          Now give me the health report in json format, start with { and end with } also dont include any backticks in your response.
          Example of a health report:
          Calculate and analyze BMI based on height and weight from profile - ${profile}
          {
            "profile_analysis": {
              "bmi": "35.2",
              "status": "underweight",
              "recommended_calories": "2000",
              "recommended_macros": {
                "protein": "100",
                "carbs": "100", 
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
          }`,
        },
      ],
    });

    res.json({
      response: JSON.parse(response.choices[0].message.content),
    });
  } catch (error) {
    console.error("Error generating health report:", error);
    res.status(500).json({ error: "Failed to generate health report" });
  }
});

app.post("/api/food-info", async (req, res) => {
  console.log("Request received");
  const { image } = req.body;

  if (!image) {
    console.log("No image data provided");
    return res.status(400).json({ error: "No image data provided" });
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `
              you are a proffessional nutritionist and a trainer and you are going to help me with my diet,  
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
                
              }

              `,
            },
            {
              type: "image_url",
              image_url: {
                url: image,
                detail: "high",
              },
            },
          ],
        },
      ],
      max_tokens: 500,
    });

    console.log("Analysis complete");

    // Set appropriate headers
    res.setHeader("Content-Type", "application/json");
    res
      .status(200)
      .json({ result: JSON.parse(response.choices[0].message.content) });
  } catch (error) {
    console.error("Error analyzing image:", error);
    res.status(500).json({
      error: "Failed to analyze image",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Start server
app.listen(port, "0.0.0.0", () => {
  console.log(`Server running on port ${port}`);
});
