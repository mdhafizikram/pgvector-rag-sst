import { Handler } from "aws-lambda/handler.js";
import { seeder } from "../../core/src/seeder.ts";
import { Similarity_Search } from "../../core/src/search.ts";
import { getReasoning } from "../../core/src/reasoning.ts";
import { deleteVectors } from "../../core/src/vector-client/index.ts";

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
        if (method === "GET") return await getReasoning(queryStringParameters);
        break;

      case "/delete-vectors":
        if (method === "DELETE") return await deleteVectors();
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
