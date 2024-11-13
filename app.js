// index.js
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const AfricasTalking = require("africastalking");

// Initialize Africa's Talking
const africastalking = AfricasTalking({
  apiKey: process.env.AT_API,
  username: "sandbox",
});

// Express app
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
const sessions = {};

function extractInput(userResponse) {
  const inputs = userResponse.split("*");
  return inputs.length > 0 ? inputs[inputs.length - 1].trim() : null;
}

// USSD route
app.post("/ussd", (req, res) => {
  let { sessionId, serviceCode, phoneNumber, text } = req.body;
  let response = "";

  // Initialize session if it doesn't exist
  if (!sessions[sessionId]) {
    sessions[sessionId] = { stage: 0, phoneNumber };
  }

  let session = sessions[sessionId];
  let userResponse = (text || "").trim("*");

  // USSD navigation logic
  switch (session.stage) {
    case 0:
      response = `CON Welcome to the Dataseed Survey
1. Start Survey
2. Exit`;
      session.stage = 1;
      break;

    case 1:
      if (userResponse === "1") {
        response = `CON Enter your National ID number:`;
        session.stage = 2;
      } else if (userResponse === "2") {
        response = `END Thank you for using the Farmer Survey.`;
        delete sessions[sessionId];
      } else {
        response = `CON Invalid input. Please select:
                   1. Start Survey
                   2. Exit`;
      }
      break;

    case 2:
      session.nationalID = extractInput(userResponse);
      response = `CON Enter the capital required for planting and harvesting (in local currency):`;
      session.stage = 3;
      break;

    case 3:
      session.capitalRequired = extractInput(userResponse);
      response = `CON Where do you get your pest treatment products?
1. Local agro-dealers
2. Cooperatives
3. Government-supplied
4. Other`;
      session.stage = 4;
      break;

    case 4:
      const pestSources = {
        1: "Local agro-dealers",
        2: "Cooperatives",
        3: "Government-supplied",
        4: "Other",
      };
      session.pestTreatmentSource =
        pestSources[extractInput(userResponse)] || "Other";
      response = `CON Where do you sell your crops?
1. Local market
2. Distributors
3. Exporters
4. Processing companies`;
      session.stage = 5;
      break;

    case 5:
      const sellingOptions = {
        1: "Local market",
        2: "Distributors",
        3: "Exporters",
        4: "Processing companies",
      };
      session.sellingMarkets =
        sellingOptions[extractInput(userResponse)] || "Other";
      response = `CON Enter the total area of your farm (in hectares or acres):`;
      session.stage = 6;
      break;

    case 6:
      session.totalFarmArea = extractInput(userResponse);
      response = `CON Enter your farm's location (address or coordinates):`;
      session.stage = 7;
      break;

    case 7:
      session.farmLocation = extractInput(userResponse);
      response = `CON What percentage of your yield do you sell to the market? (Enter number between 0 and 100)`;
      session.stage = 8;
      break;

    case 8:
      session.yieldSoldPercentage = extractInput(userResponse);

      // Save the session data to the database
      saveFarmerData(session)
        .then(() => {
          // Respond to the user
          response = `END Thank you for completing the survey.`;
          // Clean up the session
          delete sessions[sessionId];
          res.set("Content-Type", "text/plain");
          res.send(response);
        })
        .catch((error) => {
          console.error("Error saving data:", error);
          response = `END Sorry, an error occurred while saving your data.`;
          res.set("Content-Type", "text/plain");
          res.send(response);
        });
      return; // Exit the function to prevent sending response twice

    default:
      response = `END Thank you for using the Dataseed.`;
      delete sessions[sessionId];
      break;
  }

  // Send the response back to the user
  res.set("Content-Type", "text/plain");
  res.send(response);
});

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function saveFarmerData(session) {
  await prisma.farmer.create({
    data: {
      phoneNumber: session.phoneNumber,
      nationalID: session.nationalID,
      totalFarmArea: parseFloat(session.totalFarmArea),
      capitalRequired: parseFloat(session.capitalRequired),
      pestTreatmentSource: session.pestTreatmentSource,
      sellingMarkets: session.sellingMarkets,
      farmLocation: session.farmLocation,
      yieldSoldPercentage: parseFloat(session.yieldSoldPercentage),
    },
  });
}

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
