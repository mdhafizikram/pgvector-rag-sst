import { Handler } from "aws-lambda/handler.js";
import { APIGatewayEvent } from "aws-lambda/trigger/api-gateway-proxy.js";
import { OpenAI } from "openai";
import { VectorClient, Resource } from "sst";
const client = VectorClient("dplAPVectorDB");
const openAi = new OpenAI({ apiKey: Resource.OpenAiApiKey.value });
import acadPlans from "./acadplans/mappedAcadPlans.json";
import { convert } from "html-to-text";

export const handler: Handler = async (_event) => {
  try {
    console.log("Event", _event);

    const { requestContext, queryStringParameters } = _event;
    const { path, method } = requestContext.http;

    switch (path) {
      case "/seeder":
        if (method === "GET") return await seeder(queryStringParameters);
        break;
      case "/similarity-search":
        if (method === "GET") return await Similarity_Search(_event);
        break;
      case "/reasoning":
        if (method === "GET") {
          const { acadPlanCode, prompt } = queryStringParameters || {};
          if (!acadPlanCode || !prompt) {
            return {
              statusCode: 400,
              body: "Bad Request - Missing required parameters in the query string.",
            };
          }

          const acadPlanFullDescription = await getAcadPlanDescription(
            acadPlanCode
          );
          const reasoning = await getReasoning(
            convert(acadPlanFullDescription),
            prompt
          );

          return {
            statusCode: 200,
            body: JSON.stringify(reasoning, null, 2),
          };
        }
        break;
      case "/delete-vectors":
        if (method === "DELETE") {
          await client.remove({
            include: { type: "acadPlan" },
          });

          return {
            statusCode: 200,
            body: "Removed all vectors",
          };
        }
        break;
      default:
        return {
          statusCode: 404,
          body: "Not Found",
        };
    }
  } catch (error) {
    console.log("Error in handler:", error);
    return {
      statusCode: 500,
      body: "Internal Server Error",
    };
  }
};

const batchRequests = async (
  requests: Array<() => Promise<any>>,
  batchSize: number
) => {
  for (let i = 0; i < requests.length; i += batchSize) {
    const batch = requests.slice(i, i + batchSize);
    await Promise.all(
      batch.map((req) =>
        req().catch((error) => {
          console.log("Error in batch request:", error);
        })
      )
    ); // Executes each batch in parallel
  }
};

async function seeder({ start, end }: { start: number; end: number }) {
  try {
    if (!start || !end) {
      return {
        statusCode: 400,
        body: "Bad Request - Missing required parameters in the query string.",
      };
    }

    const slicedAcadPlans = acadPlans.slice(start, end);

    console.log("Ingesting acadplans", start, end, slicedAcadPlans.length);

    const requests = slicedAcadPlans.map((acadPlan) => async () => {
      const {
        fullDescription = "",
        careerOpportunities = "",
        globalExperienceText = "",
        acadPlanCode,
        ...rest
      } = acadPlan;

      if (fullDescription || careerOpportunities || globalExperienceText) {
        const combinedDescription = `fullDescription:${fullDescription} | careerOpportunities:${careerOpportunities} | globalExperienceText:${globalExperienceText}`;

        try {
          const vector = await generateEmbeddingOpenAI(combinedDescription);

          return client.put({
            vector,
            metadata: {
              type: "acadPlan",
              id: acadPlanCode,
              fullDescription,
              careerOpportunities,
              globalExperienceText,
              ...rest,
            },
          });
        } catch (error) {
          console.log(`Error processing acadPlanCode ${acadPlanCode}:`, error);
          throw error;
        }
      }
    });

    await batchRequests(requests, 50);

    return {
      statusCode: 200,
      body: "done",
    };
  } catch (error) {
    console.log("Error in seeder:", error);
    return {
      statusCode: 500,
      body: "Internal Server Error",
    };
  }
}

async function Similarity_Search(event: APIGatewayEvent) {
  try {
    console.log("Similarity_Search-event", event);
    const queryParams = event.queryStringParameters;

    if (!queryParams) {
      return {
        statusCode: 200,
        body: "Bad Request - Missing query string parameters.",
      };
    }
    const { prompt, degreeType, acadPlanType, count = "10" } = queryParams;

    if (!prompt || !degreeType || !acadPlanType) {
      return {
        statusCode: 400,
        body: "Bad Request - Missing required parameters in the query string.",
      };
    }
    const isPromptValid = await promptValidation(prompt);

    if (!isPromptValid) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Invalid prompt - does not meet the required criteria.",
        }),
      };
    }

    const vector = await generateEmbeddingOpenAI(prompt);

    const ret = await client.query({
      vector,
      count: parseInt(count),
      include: {
        type: "acadPlan",
        degreeType,
        acadPlanType,
      },
    });

    return {
      statusCode: 200,
      body: JSON.stringify(ret, null, 2),
    };
  } catch (error) {
    console.log("Error in Similarity_Search:", error);
    return {
      statusCode: 500,
      body: "Internal Server Error",
    };
  }
}

async function getAcadPlanDescription(acadPlanCode: string) {
  try {
    const url = `https://api.myasuplat-dpl.asu.edu/api/codeset/acad-plan/${acadPlanCode}?include=fullDescription`;

    const response = await fetch(url);
    const data = await response.json();

    return data.fullDescription;
  } catch (error) {
    console.log("Error getting academic plan description:", error);
    throw error;
  }
}

async function generateEmbeddingOpenAI(text: string) {
  try {
    const embeddingResponse = await openAi.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
      encoding_format: "float",
      dimensions: 512,
    });

    return embeddingResponse.data[0].embedding;
  } catch (error) {
    console.log("Error generating embedding:", error);
    throw error;
  }
}

async function promptValidation(userQuery = "") {
  try {
    const validationPrompt = `
       ### Role ###
        AI Validator responsible for checking if the user query meets content guidelines.
  
        ### Instructions ###
        - The User Query should be focused on the student's interest to take up course. 
        - The User Query should be  as per student's perspective . Possible query's student might ask. 
        - If User Query is fetching for  a course , the course field mentioned  should be related to student academic point or degree 
        - The User Query must not contain destructive content (e.g., harmful, violent, illegal, offensive, etc.).
        - The User Query should not be a lame or non-sensible question.
        - The User Query might  include  just a perticular field name or qualification or a  short description about user's interest . 
        - If the User Query meets these conditions, return "true".
        - If the User Query violates any of the conditions, return "false".
        
      ### User Query: ###
      ${userQuery}
    `;

    const validationResult = await openAi.chat.completions.create({
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

    const content = validationResult.choices[0].message.content;
    if (content === null) {
      throw new Error("Received null content from OpenAI response");
    }
    const validationResponse = JSON.parse(content);

    return validationResponse.isValid;
  } catch (error) {
    console.log(`Error validating prompt:`, error);
    throw error;
  }
}

async function getReasoning(acadPlanDescription = "", userQuery = "") {
  try {
    const acadPlanReasoningPrompt = `
		### Role ###
		Academic Advisor and Educational Consultant responsible for lead/prospect conversion.

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
