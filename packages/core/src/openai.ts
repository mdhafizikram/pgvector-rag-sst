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

export async function queryExpansion(userQuery: string) {
  const expansionPrompt = `
    You are an expert in query expansion, specifically focused on academic course recommendations.

    Given a student query, your goal is to enhance it by understanding the underlying intent, even if the query is vague or lacks specific terminology. Follow these steps:
    1. Analyze the query to infer the student’s interest in a field of study or career path.
    2. Identify synonyms, alternate phrasings, or related terms that might represent the same academic goals. For example, if a student says "joker," expand it to "stand-up comedy," "theater," or "performance arts."
    3. Expand concise keywords into more descriptive phrases, considering relevant academic disciplines or professions.
    4. Ensure that all expansions align with the context of academic plans the student might be interested in.
    5. If there are unclear terms or acronyms, leave them unchanged to avoid incorrect assumptions.
    6. Only return the expanded query and avoid adding any additional information.

    The goal is to create a more comprehensive query that maximizes the chances of retrieving relevant academic plans from the database.

    ### Student Query: ###
    ${userQuery}
`;

  try {
    const expansionResponse = await openAi.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Expand the student query to improve its clarity and relevance for academic course recommendations.",
        },
        { role: "user", content: expansionPrompt },
      ],
      max_tokens: 100,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "expansion",
          description:
            "The expanded query for academic course recommendations.",
          schema: {
            type: "object",
            properties: {
              expandedQuery: {
                type: "string",
              },
            },
            additionalProperties: false,
            required: ["expandedQuery"],
          },
          strict: true,
        },
      },
    });

    const content = expansionResponse.choices[0].message.content;

    if (content === null) {
      throw new Error("Received null content from OpenAI response");
    }

    const parsedContent = JSON.parse(content);

    if (!parsedContent.expandedQuery) {
      throw new Error("Expanded query not found in the response");
    }

    return parsedContent.expandedQuery;
  } catch (error) {
    console.log(`Error expanding query`, error);
    throw error;
  }
}
