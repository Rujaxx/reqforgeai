const { GoogleGenAI, HarmCategory, HarmBlockThreshold,   createUserContent,
  createPartFromUri, } = require('@google/genai');
const path = require('path');
require('dotenv').config();

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

if (!GOOGLE_API_KEY) {
    console.error("Error: GOOGLE_API_KEY is not set in environment variables. Please set it in your .env file.");
    process.exit(1); // Exit if API key is not found
}

const ai = new GoogleGenAI({ apiKey: GOOGLE_API_KEY });

// Using the latest recommended model for vision tasks as of July 2025.
// Always verify the latest model names from Google's official documentation.
const MODEL_NAME = "gemini-2.5-flash";

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
async function analyzeScreenshot(imagePath) {
    let uploadedFile = null; // To store the uploaded file object for deletion
    let analysisResult = { analysis: null, uploadedFileName: null };

    try {
        // 1. Upload the local image file to Gemini's temporary storage
        uploadedFile = await uploadImageFile(imagePath);
        analysisResult.uploadedFileName = uploadedFile.name; // Store the name for return value


        // 3. Craft the prompt for structured JSON output
        const prompt = `Analyze this user interface screenshot in detail. Identify and list all distinct UI elements (e.g., buttons, text fields, checkboxes, radio buttons, dropdowns, labels, images, icons, navigation bars, tables, cards, sections, headers, footers). 
        For each identified element, provide:
        - "type": A descriptive category (e.g., "button", "text_input", "checkbox", "image", "heading", "paragraph", "card").
        - "label" or "content": The visible text or a brief description of the element's content (if it's a text-based element or an image description).
        - "purpose": Infer the probable function or purpose of the element within the UI.
        - "position_description": A brief description of its relative position on the screen (e.g., "top left", "center", "bottom right of form").
        
        Also, provide:
        - "overallPurpose": A concise overall summary of the screen's main purpose and context.
        - "layoutDescription": A general description of the screen's layout (e.g., "Standard form layout with two columns", "Grid of product cards with a search bar").
        - "extractedTextBlocks": An array of important text blocks found on the screen, each with "text" and "context" (e.g., "main title", "error message", "instructional text").
        
        Return the entire analysis as a JSON object with the following schema:
        {
          "screenId": "string", // A unique ID for this screen analysis (e.g., auto-generated UUID)
          "overallPurpose": "string", 
          "layoutDescription": "string",
          "detectedElements": [
            {
              "type": "string",
              "label": "string", // or "content"
              "purpose": "string",
              "position_description": "string"
            }
          ],
          "extractedTextBlocks": [
            {
              "text": "string",
              "context": "string"
            }
          ]
        }
        Ensure the output is valid JSON, enclosed in a single JSON object.`;

        // Define the response schema for structured output
        const responseJsonSchema = {
    type: "object",
    properties: {
        screenId: { type: "string" },
        overallPurpose: { type: "string" },
        layoutDescription: { type: "string" },
        detectedElements: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    type: { type: "string" },
                    label: { type: "string" },
                    purpose: { type: "string" },
                    position_description: { type: "string" }
                },
                required: ["type", "label", "purpose", "position_description"]
            }
        },
        extractedTextBlocks: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    text: { type: "string" },
                    context: { type: "string" }
                },
                required: ["text", "context"]
            }
        }
    },
    required: [
        "screenId",
        "overallPurpose",
        "layoutDescription",
        "detectedElements",
        "extractedTextBlocks"
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
        console.log(`[Gemini Service] Gemini response received for screenshot analysis${result}`);

        // 4. Parse and return the structured result
        let output = null;
        try {
        output = JSON.parse(result.candidates[0].content.parts[0].text); // Assuming the first part contains the JSON output
        } catch (e) {
            console.error("[Gemini Service] Error parsing Gemini response as JSON:", e);
        throw new Error("Failed to parse Gemini response as JSON");
        }
        return output;

    } catch (error) {
        console.error(`[Gemini Service] Error in analyzeScreenshot (${MODEL_NAME}):`, error);
        throw new Error(`Failed to analyze screenshot with Gemini: ${error.message}`);
    }
}



module.exports = {
    analyzeScreenshot,
    deleteUploadedFile // Expose for explicit deletion if needed outside analysis
};