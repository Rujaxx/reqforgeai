const { GoogleGenAI, HarmCategory, HarmBlockThreshold, createUserContent,
    createPartFromUri } = require('@google/genai');
const path = require('path');
const ProjectModel = require('../models/project.model');
const { CloudClient, Collection } = require("chromadb")
const { GoogleGeminiEmbeddingFunction } = require("@chroma-core/google-gemini");


const client = new CloudClient(
    {
        apiKey: process.env.CHROMA_API_KEY || "YOUR_API_KEY",
        tenant: process.env.CHROMA_TENANT || "94f97a44-3ca4-4a1c-a6e1-6b13595224c5",
        database: process.env.CHROMA_DATABASE || "new",
    }
);


const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
if (!GOOGLE_API_KEY) {
    console.error("Error: GOOGLE_API_KEY is not set in environment variables. Please set it in your .env file.");
    process.exit(1); // Exit if API key is not found
}


const embedder = new GoogleGeminiEmbeddingFunction({
  apiKey: GOOGLE_API_KEY, // Or set GEMINI_API_KEY env var
  modelName: 'text-embedding-004', // Optional, defaults to latest model
  taskType: 'SEMANTIC_SIMILARITY', // Optional
});

const ai = new GoogleGenAI({ apiKey: GOOGLE_API_KEY });

// Using the latest recommended model for vision tasks as of July 2025.
// Always verify the latest model names from Google's official documentation.
const MODEL_NAME = "gemini-2.5-flash";


/**
 * Generates a Gemini embedding for the given text.
 * @param {string} text - The input text to embed.
 * @param {string} taskType - The task type for the embedding model.
 * @returns {Promise<number[]>} - Embedding vector.
 */
async function generateGeminiEmbedding(text, taskType = "SEMANTIC_SIMILARITY") {
    try {
        const response = await ai.models.embedContent({
            model: "models/text-embedding-004",
            contents: text,
            config: {
                taskType: taskType,
            }
        });

        return response.embeddings.values();
    } catch (error) {
        console.error("[Gemini Embedding] Failed to generate embedding:", error);
        throw new Error("Embedding generation failed.");
    }
}

/**
 * Uploads a local image file to the Gemini File API and returns its File object.
 * This is the recommended approach for image inputs, especially for larger files.
 * Files uploaded here are temporary (48-hour lifecycle).
 *
 * @param {string} filePath - The path to the image file on the local server.
 * @returns {Promise<import('@google/genai').File>} - A promise that resolves to the uploaded File object from Gemini.
 */
async function uploadImageFile(filePath) {
    // Infer MIME type from file extension. Can be overridden in config if needed.
    const mimeType = path.extname(filePath).toLowerCase() === '.png' ? 'image/png' : 'image/jpeg';

    try {
        const uploadedFile = await ai.files.upload({
            file: filePath, // Direct file path is supported in Node.js
            config: {
                mimeType: mimeType
            }
        });
        console.log(`[Gemini Service] File uploaded to Gemini File API: ${uploadedFile.name} (URI: ${uploadedFile.uri})`);
        return {
            name: uploadedFile.name, // e.g., 'files/your-file-id'
            uri: uploadedFile.uri, // e.g., 'gs://your-bucket/files/
            mimeType: uploadedFile.mimeType // e.g., 'image/png' or 'image/jpeg'
        };
    } catch (error) {
        console.error("[Gemini Service] Error uploading file to Gemini File API:", error);
        throw new Error(`Failed to upload image file to Gemini: ${error.message}`);
    }
}

/**
 * Deletes a file from the Gemini File API.
 * This is important for cleaning up temporary storage and managing API usage.
 *
 * @param {string} fileName - The 'name' property of the File object (e.g., 'files/your-file-id').
 */
async function deleteUploadedFile(fileName) {
    if (!fileName) {
        console.warn("[Gemini Service] Attempted to delete null or undefined file name from Gemini File API.");
        return;
    }
    try {
        await ai.files.delete({ name: fileName });
        console.log(`[Gemini Service] File deleted from Gemini File API: ${fileName}`);
    } catch (error) {
        // Log the error but don't re-throw, as this is a cleanup step.
        // File might have already expired or been deleted.
        console.error(`[Gemini Service] Error deleting file ${fileName} from Gemini File API:`, error);
    }
}

/**
 * Analyzes a screenshot using Gemini Flash 2.5 Vision API.
 * It leverages the Gemini File API for efficient image input and requests JSON output.
 *
 * @param {string} imagePath - The path to the screenshot image file on the local server.
 * @returns {Promise<{analysis: object, uploadedFileName: string|null}>} - A promise that resolves
 * to an object containing the parsed JSON analysis (or raw text fallback) and the name of the
 * uploaded file in Gemini's API (for subsequent deletion).
 */
async function analyzeScreenshot(imagePath, projectId) {
    let uploadedFile = null; // To store the uploaded file object for deletion
    let analysisResult = { analysis: null, uploadedFileName: null };
    const project = await ProjectModel.findById(projectId);
    if (!project) {
        throw new Error(`Project with ID ${projectId} not found.`);
    }
    const collection = await client.getOrCreateCollection({
        name: "project-screens",
        embeddingFunction: embedder,
    });

    const previousScreens = await collection.query({
        queryTexts: [`screenName`], /// Adjust this to match your actual query needs
        where: {
            projectId: projectId.toString(),
        },
        includes: ["documents"],
        nResults: 2,
    });

    const previousContext = previousScreens.documents.flat().join("\n\n");

    try {
        // 1. Upload the local image file to Gemini's temporary storage
        uploadedFile = await uploadImageFile(imagePath);
        analysisResult.uploadedFileName = uploadedFile.name; // Store the name for return value


        // 3. Craft the prompt for structured JSON output
        const prompt = `You are an expert Business Analyst and UI/UX specialist. Analyze the provided UI screenshot and generate comprehensive requirements documentation.
        Previous Screens Context: ${previousContext}
        **CONTEXT:**
        - This is a new requirements documentation project :${project.name}
        - Description: ${project.description}
        - Focus on being thorough and systematic
        - Use professional business analysis terminology
        - Make reasonable assumptions based on common UI patterns

        **ANALYSIS INSTRUCTIONS:**

        1. **Screen Identification:**
        - Identify the screen type (login, dashboard, form, list view, etc.)
        - Determine the primary purpose and user goals
        - Note the overall layout and information architecture

        2. **UI Element Analysis:**
        For each visible UI element, identify:
        - Element type (button, input field, dropdown, table, etc.)
        - Visual properties (size, color, position, styling)
        - Apparent functionality and behavior
        - Data requirements and sources
        - Validation needs
        - Error handling requirements

        3. **User Interaction Patterns:**
        - Primary user workflows
        - Navigation patterns
        - Form submission processes
        - Data manipulation capabilities

        4. **Technical Requirements:**
        - Responsive design considerations
        - Accessibility requirements
        - Performance expectations
        - Integration points

        **OUTPUT FORMAT:**
        Structure your response as a JSON object with these sections:

        {
        "screenOverview": {
            "screenName": "Descriptive name",
            "screenType": "Category",
            "primaryPurpose": "Main function",
            "userRole": "Who uses this screen"
        },
        "requirementsMatrix": [
            {
            "uiElement": "Element name/description",
            "elementType": "Type (button, input, etc.)",
            "behavior": "Expected behavior",
            "dataSource": "Data source/origin",
            "validationRules": "Validation requirements",
            "errorHandling": "Error handling approach",
            "businessRules": "Business logic constraints",
            "notes": "Additional notes"
            }
        ],
        "functionalRequirements": [
            "List of key functional requirements"
        ],
        "nonFunctionalRequirements": [
            "Performance, accessibility, etc."
        ],
        "businessRules": [
            "Important business logic and constraints"
        ],
        "assumptionsMade": [
            "List all assumptions for user review"
        ]
        }

        **IMPORTANT:** Be specific and detailed. If you're unsure about functionality, state your assumptions clearly for user review and correction.`;

        // Define the response schema for structured output
        const responseJsonSchema = {
            type: "object",
            properties: {
                screenOverview: {
                    type: "object",
                    properties: {
                        screenName: { type: "string" },
                        screenType: { type: "string" },
                        primaryPurpose: { type: "string" },
                        userRole: { type: "string" },
                        relationshipToPreviousScreens: { type: "string" }
                    },
                    required: ["screenName", "screenType", "primaryPurpose", "userRole"]
                },
                requirementsMatrix: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            uiElement: { type: "string" },
                            elementType: { type: "string" },
                            behavior: { type: "string" },
                            dataSource: { type: "string" },
                            validationRules: { type: "string" },
                            errorHandling: { type: "string" },
                            businessRules: { type: "string" },
                            notes: { type: "string" }
                        },
                        required: ["uiElement", "elementType", "behavior", "dataSource", "validationRules", "errorHandling", "businessRules", "notes"]
                    }
                },
                functionalRequirements: {
                    type: "array",
                    items: { type: "string" }
                },
                nonFunctionalRequirements: {
                    type: "array",
                    items: { type: "string" }
                },
                businessRules: {
                    type: "array",
                    items: { type: "string" }
                },
                assumptionsMade: {
                    type: "array",
                    items: { type: "string" }
                },
            },
            required: [
                "screenOverview",
                "requirementsMatrix",
                "functionalRequirements",
                "nonFunctionalRequirements",
                "businessRules",
                "assumptionsMade"
            ]
        };


        // 4. Send the request to Gemini
        const result = await ai.models.generateContent({
            model: MODEL_NAME, // Use the vision model for image analysis
            contents: createUserContent([
                createPartFromUri(uploadedFile.uri, uploadedFile.mimeType),
                prompt
            ]),
            config: {
                responseMimeType: "application/json", // Crucial for structured output
                responseJsonSchema: responseJsonSchema, // Use the defined schema for structured output
                temperature: 0.2, // Lower temperature for more factual/deterministic output
                topK: 40,
                topP: 0.95
            },
            safetySettings: [
                { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            ],
        });
        console.log(`[Gemini Service] Gemini response received for screenshot analysis`);

        // 4. Parse and return the structured result
        let output = null;
        try {
            output = JSON.parse(result.candidates[0].content.parts[0].text); // Assuming the first part contains the JSON output
        } catch (e) {
            console.error("[Gemini Service] Error parsing Gemini response as JSON:", e);
            throw new Error("Failed to parse Gemini response as JSON");
        }
        const flatText = flattenAnalysisForEmbedding(output);
        await collection.add({
            ids: [`analysis-${projectId}-${Date.now()}`],
            documents: [flatText],
            metadatas: [{
                projectId: projectId.toString(),
            }],
        });
        return output;

    } catch (error) {
        console.error(`[Gemini Service] Error in analyzeScreenshot (${MODEL_NAME}):`, error);
        throw new Error(`Failed to analyze screenshot with Gemini: ${error.message}`);
    }
}



function flattenAnalysisForEmbedding(analysisJson) {
    const { screenOverview, functionalRequirements } = analysisJson;
    let text = `Screen: ${screenOverview.screenName} (${screenOverview.screenType})\n`;
    text += `Purpose: ${screenOverview.primaryPurpose}\n\n`;

    text += `Functional Requirements:\n${functionalRequirements.join("\n")}\n`;

    return text;
}


module.exports = {
    analyzeScreenshot,
    deleteUploadedFile, // Expose for explicit deletion if needed outside analysis
    generateGeminiEmbedding,

};