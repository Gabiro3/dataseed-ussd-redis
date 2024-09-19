// index.js

const express = require('express');
const bodyParser = require('body-parser');
const AfricasTalking = require('africastalking');

// Initialize Africa's Talking
const africastalking = AfricasTalking({
    apiKey: 'atsk_29f49851fb21f1c3d8a299998e06a2352465cbbd61831469769dec6b3885591301974bfe',
    username: 'GABIRO ARNAUD',
});

// Express app
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
const sessions = {};

// USSD route
app.post('/ussd', (req, res) => {
    let { sessionId, serviceCode, phoneNumber, text } = req.body;
    let response = '';

    // Initialize session if it doesn't exist
    if (!sessions[sessionId]) {
        sessions[sessionId] = { stage: 0, phoneNumber };
    }

    let session = sessions[sessionId];
    let userResponse = text.trim();

    // USSD navigation logic
    switch (session.stage) {
        case 0:
            response = `CON Welcome to the Farmer Survey
1. Start Survey
2. Exit`;
            session.stage = 1;
            break;

        case 1:
            if (userResponse === '1') {
                response = `CON Enter your total farm area (in hectares or acres):`;
                session.stage = 2;
            } else if (userResponse === '2') {
                response = `END Thank you for using the Farmer Survey.`;
                delete sessions[sessionId];
            } else {
                response = `CON Invalid input. Please select:
1. Start Survey
2. Exit`;
            }
            break;

        case 2:
            session.totalFarmArea = userResponse;
            response = `CON What are your primary crops?
1. Corn
2. Wheat
3. Rice
4. Soybeans
5. Other`;
            session.stage = 3;
            break;

        case 3:
            const crops = {
                '1': 'Corn',
                '2': 'Wheat',
                '3': 'Rice',
                '4': 'Soybeans',
                '5': 'Other',
            };
            session.primaryCrops = crops[userResponse] || 'Other';
            response = `CON Where do you get your seeds?
1. Local market
2. Seed distributors
3. Government programs
4. Saved from previous harvest
5. Other`;
            session.stage = 4;
            break;

        case 4:
            const seedSources = {
                '1': 'Local market',
                '2': 'Seed distributors',
                '3': 'Government programs',
                '4': 'Saved from previous harvest',
                '5': 'Other',
            };
            session.seedSource = seedSources[userResponse] || 'Other';
            response = `CON Where do you get your pest treatment chemicals?
1. Local agro-dealers
2. Cooperatives
3. Government-supplied
4. Other`;
            session.stage = 5;
            break;

        case 5:
            const pestSources = {
                '1': 'Local agro-dealers',
                '2': 'Cooperatives',
                '3': 'Government-supplied',
                '4': 'Other',
            };
            session.pestTreatmentSource = pestSources[userResponse] || 'Other';
            response = `CON When do you typically harvest your crops? (e.g., Month or Season)`;
            session.stage = 6;
            break;

        case 6:
            session.harvestPeriod = userResponse;
            response = `CON Where do you sell your crops after harvest?
1. Local market
2. Distributors
3. Exporters
4. Processing companies
5. Other`;
            session.stage = 7;
            break;

        case 7:
            const sellingOptions = {
                '1': 'Local market',
                '2': 'Distributors',
                '3': 'Exporters',
                '4': 'Processing companies',
                '5': 'Other',
            };
            session.sellingMarkets = sellingOptions[userResponse] || 'Other';
            response = `CON What percentage of your harvested crops do you sell? (Enter number between 0 and 100)`;
            session.stage = 8;
            break;

        case 8:
            session.cropsSoldPercentage = userResponse;
            response = `CON Where do you sell or dispose of by-products (husks, etc.)?
1. Local market
2. Animal feed producers
3. Waste management services
4. Other`;
            session.stage = 9;
            break;

        case 9:
            const byProductOptions = {
                '1': 'Local market',
                '2': 'Animal feed producers',
                '3': 'Waste management services',
                '4': 'Other',
            };
            session.byProductsDestination = byProductOptions[userResponse] || 'Other';
            response = `CON Where do you get raw materials for growing your crops? (e.g., fertilizers)`;
            session.stage = 10;
            break;

        case 10:
            session.rawMaterialsSource = userResponse;
            response = `CON Which distributors do you work with? (Enter names separated by commas)`;
            session.stage = 11;
            break;

        case 11:
            session.distributors = userResponse.split(',').map(s => s.trim());
            response = `CON What is the average capital required to plant and harvest your crops? (in local currency)`;
            session.stage = 12;
            break;

        case 12:
            session.capitalRequired = userResponse;
            response = `CON What climate control initiatives do you have in place?
1. Irrigation
2. Shade nets
3. Rainwater harvesting
4. Windbreaks
5. Other`;
            session.stage = 13;
            break;

        case 13:
            const climateOptions = {
                '1': 'Irrigation',
                '2': 'Shade nets',
                '3': 'Rainwater harvesting',
                '4': 'Windbreaks',
                '5': 'Other',
            };
            session.climateControlInitiatives = [climateOptions[userResponse] || 'Other'];
            response = `CON How do you manage risk between projected and actual harvest?
1. Insurance
2. Buffer crops
3. Crop rotation
4. Weather monitoring
5. Other`;
            session.stage = 14;
            break;

        case 14:
            const riskOptions = {
                '1': 'Insurance',
                '2': 'Buffer crops',
                '3': 'Crop rotation',
                '4': 'Weather monitoring',
                '5': 'Other',
            };
            session.riskManagement = [riskOptions[userResponse] || 'Other'];
            response = `CON What factors most influence your harvest?
1. Weather
2. Soil quality
3. Seed quality
4. Pests
5. Labor
6. Other`;
            session.stage = 15;
            break;

        case 15:
            const factorOptions = {
                '1': 'Weather',
                '2': 'Soil quality',
                '3': 'Seed quality',
                '4': 'Pests',
                '5': 'Labor',
                '6': 'Other',
            };
            session.factorsAffectingHarvest = [factorOptions[userResponse] || 'Other'];
            response = `CON Where is your farm located? (Enter address or coordinates)`;
            session.stage = 16;
            break;

        case 16:
            session.farmLocation = userResponse;
            // Save the session data to the database
            saveFarmerData(session)
                .then(() => {
                    // Respond to the user
                    response = `END Thank you for completing the survey.`;
                    // Clean up the session
                    delete sessions[sessionId];
                    res.set('Content-Type', 'text/plain');
                    res.send(response);
                })
                .catch((error) => {
                    console.error('Error saving data:', error);
                    response = `END Sorry, an error occurred while saving your data.`;
                    res.set('Content-Type', 'text/plain');
                    res.send(response);
                });
            return; // Exit the function to prevent sending response twice

        default:
            response = `END Thank you for using the Farmer Survey.`;
            delete sessions[sessionId];
            break;
    }

    // Send the response back to the user
    res.set('Content-Type', 'text/plain');
    res.send(response);
});

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function saveFarmerData(session) {
    await prisma.farmer.create({
        data: {
            phoneNumber: session.phoneNumber,
            totalFarmArea: parseFloat(session.totalFarmArea),
            primaryCrops: [session.primaryCrops],
            seedSource: session.seedSource,
            pestTreatmentSource: session.pestTreatmentSource,
            harvestPeriod: session.harvestPeriod,
            sellingMarkets: session.sellingMarkets,
            cropsSoldPercentage: parseFloat(session.cropsSoldPercentage),
            byProductsDestination: session.byProductsDestination,
            rawMaterialsSource: session.rawMaterialsSource,
            distributors: session.distributors,
            capitalRequired: parseFloat(session.capitalRequired),
            climateControlInitiatives: session.climateControlInitiatives,
            riskManagement: session.riskManagement,
            factorsAffectingHarvest: session.factorsAffectingHarvest,
            farmLocation: session.farmLocation,
        },
    });
}
