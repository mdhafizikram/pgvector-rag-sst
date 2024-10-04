import { OpenAI } from "openai";
import { Resource } from "sst";

export const openAi = new OpenAI({ apiKey: Resource.OpenAiApiKey.value });

export async function generateEmbeddingOpenAI(text: string) {
  try {
    const embeddingResponse = await openAi.embeddings.create({
      model: "text-embedding-3-large",
      input: text,
      encoding_format: "float",
      dimensions: 1536,
    });

    return embeddingResponse.data[0].embedding;
  } catch (error) {
    console.log("Error generating embedding:", error);
    throw error;
  }
}

export async function validateUserQuery(validationPrompt: string) {
  try {
    return await openAi.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Evaluate the user query for validity based on the conditions provided and return the result in JSON format.",
        },
        { role: "user", content: validationPrompt },
      ],
      max_tokens: 100,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "validationResult",
          description: "The validation result for the user query.",
          schema: {
            type: "object",
            properties: {
              isValid: {
                type: "boolean",
                description:
                  "Indicates whether the user query is valid (true) or invalid (false).",
              },
            },
            additionalProperties: false,
            required: ["isValid"],
          },
          strict: true,
        },
      },
    });
  } catch (error) {
    console.log(`Error validating user query`, error);
    throw error;
  }
}

export async function generateReasoningOpenAI(
  acadPlanDescription: string,
  userQuery: string
) {
  try {
    const acadPlanReasoningPrompt = `
      ### Instructions ###
      - Analyze the academic interest of the student through the provided User Query and understand what the student is emphasizing.
      - Analyze the provided Academic Plan Description and gather the benefits, outcomes and value it offers.
      - Ruminate from a student point of view and compose a solid justification/reasoning to opt the particular academic plan within 100-150 words.

      ### Tone ###
      Formal and Highly Persuasive
          
          ### Academic Plan Description: ###
          ${acadPlanDescription}

          ### User Query: ###
          ${userQuery}
          `;

    const reasoning = await openAi.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Please provide reasoning for the academic plan in a valid JSON format.",
        },
        { role: "user", content: acadPlanReasoningPrompt },
      ],
      max_tokens: 200,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "reasoning",
          description:
            "The reasoning for the academic plan based on the user query.",
          schema: {
            type: "object",
            properties: {
              reasoning: {
                type: "string",
              },
            },
            additionalProperties: false,
            required: ["reasoning"],
          },
          strict: true,
        },
      },
    });

    const content = reasoning.choices[0].message.content;
    if (content === null) {
      throw new Error("Received null content from OpenAI response");
    }
    const reasoningResponse = JSON.parse(content);

    return reasoningResponse;
  } catch (error) {
    console.log(`Error getting reasoning`, error);
    throw error;
  }
}
