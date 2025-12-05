
import { GoogleGenAI, Type, Chat, Modality } from "@google/genai";
import type { Recipe, RecipeFormData, DietPlan, RecipeIdea } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const recipeSchema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING, description: 'The creative and appealing name of the recipe.' },
        description: { type: Type.STRING, description: 'A short, enticing description of the dish.' },
        mealType: { type: Type.STRING, description: 'The category of the meal, e.g., Breakfast, Lunch, Dinner.' },
        cookingTime: { type: Type.STRING, description: 'Estimated total cooking time (e.g., "45 minutes").' },
        servings: { type: Type.STRING, description: 'Number of people the recipe serves (e.g., "4 servings").' },
        difficulty: { type: Type.STRING, description: 'The difficulty level, must be one of: Easy, Medium, or Hard.' },
        ingredients: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'A list of all ingredients with quantities (e.g., "2 cups of flour").'
        },
        instructions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'A list of step-by-step instructions for preparing the dish.'
        },
        instructionTimers: {
            type: Type.ARRAY,
            items: { type: Type.NUMBER },
            description: 'An array of estimated cooking times in MINUTES for each instruction step, corresponding to the instructions array. For example, if an instruction takes 10 minutes, the value should be 10. If a step is very quick (e.g. "garnish and serve"), the value should be 0.'
        },
        nutrition: {
            type: Type.OBJECT,
            properties: {
                calories: { type: Type.STRING, description: 'Estimated calories per serving.' },
                protein: { type: Type.STRING, description: 'Estimated protein in grams per serving.' },
                carbs: { type: Type.STRING, description: 'Estimated carbohydrates in grams per serving.' },
                fat: { type: Type.STRING, description: 'Estimated fat in grams per serving.' }
            },
            required: ['calories', 'protein', 'carbs', 'fat']
        },
        estimatedCost: { type: Type.STRING, description: 'Estimated cost to make this dish in Indian Rupees (₹). Give a range like "₹200 - ₹300".' },
        tips: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'A list of helpful tips, variations, or serving suggestions.'
        },
        storageTips: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'A list of helpful tips for storing leftover ingredients or the final dish to maintain freshness.'
        },
    },
    required: ['title', 'description', 'mealType', 'cookingTime', 'servings', 'difficulty', 'ingredients', 'instructions', 'instructionTimers', 'nutrition', 'estimatedCost', 'tips', 'storageTips']
};

export const generateRecipe = async (formData: RecipeFormData): Promise<Recipe> => {
    const { ingredients, cuisine, diet, difficulty, language, mood, servings, mealType, chefPersona } = formData;

    const systemInstruction = `You are a world-class chef. Adopt the persona of: ${chefPersona}. 
    Your tone, tip suggestions, and description should reflect this persona. 
    However, the core recipe instructions must remain clear and easy to follow.
    You must provide the estimated cost in Indian Rupees (₹).
    Ensure the output is a JSON object conforming to the schema.`;

    const prompt = `
        User's Criteria:
        - Main Ingredients/Leftovers: ${ingredients}
        - Cuisine Style: ${cuisine === 'Any' ? 'Be creative' : cuisine}
        - Type of Meal: ${mealType === 'All Meal Types' ? 'Be creative' : mealType}
        - Dietary Preference: ${diet === 'None' ? 'No specific diet' : diet}
        - Desired Difficulty: ${difficulty === 'Any' ? 'Any level is fine' : difficulty}
        - Number of servings required: ${servings || '2'}. scale ingredients to this.
        - User's Mood: ${mood === 'Any' ? 'Not specified' : mood}
        - Language for Recipe: ${language}
        
        Generate a complete recipe.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-lite',
            contents: prompt,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: 'application/json',
                responseSchema: recipeSchema,
                temperature: 0.8,
            }
        });
        
        const jsonText = response.text.trim();
        const recipeData = JSON.parse(jsonText);
        
        recipeData.language = language;

        return recipeData as Recipe;

    } catch (error) {
        console.error("Error generating recipe:", error);
        throw new Error("Could not generate recipe. The AI may be busy.");
    }
};

export const generateRecipeImage = async (title: string, description: string): Promise<string> => {
    const conciseDescription = description.split('.').slice(0, 2).join('.') + '.';
    const prompt = `A delicious, photorealistic, professional food photograph of "${title}". ${conciseDescription} The image should be vibrant, appetizing, and well-lit, styled for a top food blog. Focus on the final plated dish.`;

    try {
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
              numberOfImages: 1,
              outputMimeType: 'image/jpeg',
              aspectRatio: '16:9',
            },
        });
        
        if (!response.generatedImages || response.generatedImages.length === 0) {
            throw new Error("The AI did not generate an image.");
        }
        
        return `data:image/jpeg;base64,${response.generatedImages[0].image.imageBytes}`;
    } catch(error) {
        console.error("Error generating image:", error);
        throw new Error("Could not create an image for this recipe."); 
    }
};

export const getIngredientsFromImage = async (imageBase64: string, mimeType: string): Promise<string> => {
    try {
        const imagePart = {
            inlineData: { mimeType, data: imageBase64 },
        };
        const textPart = {
            text: "Identify the food ingredients in this image. List them as a concise, comma-separated string."
        };
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: { parts: [imagePart, textPart] },
        });

        return response.text.trim();
    } catch (error) {
        console.error("Error identifying ingredients:", error);
        throw new Error("Could not identify ingredients.");
    }
};

export const transcribeAudio = async (audioBase64: string, mimeType: string = 'audio/wav'): Promise<string> => {
    try {
        const audioPart = {
            inlineData: { mimeType, data: audioBase64 },
        };
        const textPart = {
            text: "Transcribe the following audio accurately. Just return the text."
        };
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [audioPart, textPart] },
        });

        return response.text.trim();
    } catch (error) {
        console.error("Error transcribing audio:", error);
        throw new Error("Could not transcribe audio.");
    }
};

const formatRecipeForChat = (recipe: Recipe): string => {
    return JSON.stringify(recipe, null, 2);
};

export const startRecipeAssistantChat = (recipe: Recipe): Chat => {
    const recipeContext = formatRecipeForChat(recipe);
    const systemInstruction = `You are Chef, a helpful, friendly AI cooking assistant. 
    Your context is the following recipe:
    ${recipeContext}
    
    You can answer questions about the recipe, suggest substitutions, calculate calories for specific portions, and provide a weekly meal plan if asked.
    You have access to Google Search to find real-time prices or availability if asked about where to buy things.
    Prices should be discussed in Indian Rupees (₹) unless asked otherwise.
    
    Formatting:
    - Use clear paragraphs.
    - Use bullet points for lists.
    - Be concise but helpful.
    `;
    
    const chat = ai.chats.create({
        model: 'gemini-3-pro-preview',
        config: {
            systemInstruction: systemInstruction,
            tools: [{googleSearch: {}}],
        }
    });

    return chat;
};

export const extractCoreIngredients = async (ingredients: string[]): Promise<string[]> => {
    const prompt = `Extract ONLY the core ingredient name from: ${JSON.stringify(ingredients)}. Remove quantities/preparations. Return JSON array of strings.`;
    const schema = { type: Type.ARRAY, items: { type: Type.STRING } };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-lite',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: schema,
                temperature: 0.1,
            }
        });
        return JSON.parse(response.text.trim());
    } catch (error) {
        return ingredients; // Fallback
    }
};

export const findNearbyStores = async (latitude: number, longitude: number): Promise<{ title: string; uri: string }[]> => {
    const prompt = "Find the best grocery stores or supermarkets near this location in India.";
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                tools: [{ googleMaps: {} }],
                toolConfig: { retrievalConfig: { latLng: { latitude, longitude } } }
            }
        });
        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        const stores: { title: string; uri: string }[] = [];
        if (chunks) {
            chunks.forEach(chunk => {
                if (chunk.maps?.uri && chunk.maps?.title) {
                    stores.push({ title: chunk.maps.title, uri: chunk.maps.uri });
                }
            });
        }
        return stores;
    } catch (error) {
        console.error("Error finding stores:", error);
        return [];
    }
};

export const generateSpeech = async (text: string): Promise<ArrayBuffer> => {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
        },
    });
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio data");
    
    const binaryString = atob(base64Audio);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
    return bytes.buffer;
};

export const convertPCMToAudioBuffer = (audioContext: AudioContext, buffer: ArrayBuffer, sampleRate: number = 24000): AudioBuffer => {
    const int16Array = new Int16Array(buffer);
    const frameCount = int16Array.length;
    const audioBuffer = audioContext.createBuffer(1, frameCount, sampleRate);
    const channelData = audioBuffer.getChannelData(0);
    for (let i = 0; i < frameCount; i++) channelData[i] = int16Array[i] / 32768.0;
    return audioBuffer;
};

export const generateDietPlan = async (goal: string, preferences: string): Promise<DietPlan> => {
    const systemInstruction = `You are a certified nutritionist and diet coach. 
    Create a detailed 7-day meal plan based on the user's health goal and preferences.
    Include specific meal names, calorie estimates, and brief details for Breakfast, Lunch, Dinner, and Snack.
    Ensure the response is strictly valid JSON according to the schema.`;
    
    const prompt = `Goal: ${goal}. Preferences/Diet: ${preferences}. Create a weekly plan.`;
    
    const mealSchema = {
        type: Type.OBJECT,
        properties: {
            name: { type: Type.STRING },
            calories: { type: Type.STRING },
            details: { type: Type.STRING },
        },
        required: ['name', 'calories', 'details']
    };

    const schema = {
        type: Type.OBJECT,
        properties: {
            goal: { type: Type.STRING },
            introduction: { type: Type.STRING },
            weeklyPlan: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        day: { type: Type.STRING },
                        meals: {
                            type: Type.OBJECT,
                            properties: {
                                breakfast: mealSchema,
                                lunch: mealSchema,
                                dinner: mealSchema,
                                snack: mealSchema
                            },
                            required: ['breakfast', 'lunch', 'dinner', 'snack']
                        }
                    },
                    required: ['day', 'meals']
                }
            }
        },
        required: ['goal', 'introduction', 'weeklyPlan']
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-lite',
            contents: prompt,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: 'application/json',
                responseSchema: schema,
                temperature: 0.7,
            }
        });

        return JSON.parse(response.text.trim()) as DietPlan;
    } catch (error) {
        console.error("Error generating diet plan:", error);
        throw new Error("Could not generate diet plan.");
    }
};

export const generateSmartSuggestions = async (ingredients: string): Promise<RecipeIdea[]> => {
    const systemInstruction = `You are a creative chef specializing in "leftover" cooking.
    Suggest 3 creative recipe ideas based on the ingredients provided.
    Identify which ingredients from the list are used, and what key ingredients might be missing (common pantry staples are fine).
    Ensure the response is strictly valid JSON.`;
    
    const prompt = `I have these ingredients: ${ingredients}. Suggest 3 recipes.`;

    const schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                usedIngredients: { type: Type.ARRAY, items: { type: Type.STRING } },
                missingIngredients: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ['title', 'description', 'usedIngredients', 'missingIngredients']
        }
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-lite',
            contents: prompt,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: 'application/json',
                responseSchema: schema,
                temperature: 0.8,
            }
        });

        return JSON.parse(response.text.trim()) as RecipeIdea[];
    } catch (error) {
        console.error("Error generating suggestions:", error);
        throw new Error("Could not generate suggestions.");
    }
};
