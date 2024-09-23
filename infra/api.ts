import { bucket } from "./storage";
import { OpenAiApiKey } from "./secrets";
import { vector } from "./vector";

export const api = new sst.aws.ApiGatewayV2("iam-dpl-rag-api");

api.route("ANY /{proxy+}", {
  link: [bucket, OpenAiApiKey, vector],
  handler: "packages/functions/src/api.handler",
});
