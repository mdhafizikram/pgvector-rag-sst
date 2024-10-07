import { APIGatewayEvent } from "aws-lambda/trigger/api-gateway-proxy.js";
import { generateEmbeddingOpenAI, queryExpansion } from "./openai";
import { queryVectors } from "./vector-client";

export async function Similarity_Search(event: APIGatewayEvent) {
  try {
    console.log("Similarity_Search-event", event);
    const queryParams = event.queryStringParameters;

    if (!queryParams) {
      return {
        statusCode: 200,
        body: "Bad Request - Missing query string parameters.",
      };
    }
    const {
      prompt,
      degreeType = null,
      acadPlanType = null,
      count = "10",
    } = queryParams;

    if (!prompt) {
      return {
        statusCode: 400,
        body: "Bad Request - Missing required parameters in the query string.",
      };
    }
    // const isPromptValid = await promptValidation(prompt);

    // if (!isPromptValid) {
    //   return {
    //     statusCode: 200,
    //     body: JSON.stringify(
    //       {
    //         results: [],
    //       },
    //       null,
    //       2
    //     ),
    //   };
    // }

    // Query expansion
    const expandedQuery = await queryExpansion(prompt);

    if (!expandedQuery) {
      return {
        statusCode: 200,
        body: JSON.stringify(
          {
            results: [],
          },
          null,
          2
        ),
      };
    }

    const includeParams = {
      type: "acadPlan",
    };

    if (degreeType) includeParams.degreeType = degreeType;
    if (acadPlanType) includeParams.acadPlanType = acadPlanType;

    const vector = await generateEmbeddingOpenAI(expandedQuery);

    const ret = await queryVectors({
      vector,
      count,
      includeParams,
    });

    ret.expandedUserQuery = expandedQuery;

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
