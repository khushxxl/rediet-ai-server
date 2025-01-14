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
    const { message } = req.body;

    console.log("message", message);

    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "user",
          content: `you are a proffessional nutritionist and a trainer and you are going to help me with my diet, 
          i shall ask you any question any time, you gotta resolve my query with ref to my time eg: if i am asking you if i can eat a cupcake in night, you should say 
          thats not right and inform me with diet foods that have a low calorie and can rmeove my hunger - ${message}, if the message is not relevant to diet or health or exercise, you should say i am not sure about that, i am a nutritionist and trainer and i can help you with diet and health related queries`,
        },
      ],
      model: "gpt-4o-mini",
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
