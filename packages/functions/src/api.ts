import { Handler, APIGatewayEvent } from "aws-lambda";
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
        if (method === "GET") return await seeder();
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
    console.error("Error in handler:", error);
    return {
      statusCode: 500,
      body: "Internal Server Error",
    };
  }
};

const batchRequests = async (requests, batchSize) => {
  for (let i = 0; i < requests.length; i += batchSize) {
    const batch = requests.slice(i, i + batchSize);
    await Promise.all(
      batch.map((req) =>
        req().catch((error) => {
          console.error("Error in batch request:", error);
        })
      )
    ); // Executes each batch in parallel
  }
};

async function seeder() {
  try {
    console.log("Ingesting acadplans", acadPlans.length);

    const slicedAcadPlans200 = acadPlans.slice(0, 200);

    const requests = slicedAcadPlans200.map((acadPlan) => async () => {
      try {
        const { fullDescription, acadPlanCode, ...rest } = acadPlan;
        const vector = await generateEmbeddingOpenAI(fullDescription);

        return client.put({
          vector,
          metadata: {
            type: "acadPlan",
            id: acadPlanCode,
            fullDescription,
            ...rest,
          },
        });
      } catch (error) {
        console.error(`Error processing acadPlanCode ${acadPlanCode}:`, error);
        throw error; // Optionally propagate this if you want to stop on error
      }
    });

    await batchRequests(requests, 50);

    return {
      statusCode: 200,
      body: "done",
    };
  } catch (error) {
    console.error("Error in seeder:", error);
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
        statusCode: 400,
        body: "Bad Request - Missing query string parameters.",
      };
    }
    const { prompt, degreeType, acadPlanType } = queryParams;

    if (!prompt || !degreeType || !acadPlanType) {
      return {
        statusCode: 400,
        body: "Bad Request - Missing required parameters in the query string.",
      };
    }

    const vector = await generateEmbeddingOpenAI(prompt);

    console.log("Vector", vector.length);

    const ret = await client.query({
      vector,
      count: 5,
      threshold: 0.7,
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
    console.error("Error in Similarity_Search:", error);
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
    console.error("Error getting academic plan description:", error);
    throw error;
  }
}

async function generateEmbeddingOpenAI(text: string) {
  try {
    const embeddingResponse = await openAi.embeddings.create({
      model: "text-embedding-ada-002",
      input: text,
      encoding_format: "float",
    });

    return embeddingResponse.data[0].embedding;
  } catch (error) {
    console.error("Error generating embedding:", error);
    throw error;
  }
}

async function getReasoning(acadPlanDescription = "", userQuery = "") {
  try {
    const acadPlanReasoningPrompt = `
		### Role ###
		Academic Advisor and Educational Consultant

		### Scenario: ###
		You are an academic advisor at Arizona State University. Your task is to explain why the provided academic plan is the best fit for the user's query. Clearly outline the reasoning, focusing on how the plan aligns with the user's goals, strengths, and career aspirations. Address any potential concerns and justify why this plan suits their academic and professional trajectory within 100-150 words.
		
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
    console.error(`Error getting reasoning`, error);
    throw error;
  }
}
