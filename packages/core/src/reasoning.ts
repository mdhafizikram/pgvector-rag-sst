import { getAcadPlanDescription } from "./dpl";
import { generateReasoningOpenAI } from "./openai";
import { convert } from "html-to-text";

export async function getReasoning(queryStringParameters: {
  acadPlanCode: string;
  prompt: string;
}) {
  const { acadPlanCode, prompt } = queryStringParameters || {};

  if (!acadPlanCode || !prompt) {
    return {
      statusCode: 400,
      body: "Bad Request - Missing required parameters in the query string.",
    };
  }

  const acadPlanFullDescription = await getAcadPlanDescription(acadPlanCode);
  const reasoning = await generateReasoningOpenAI(
    convert(acadPlanFullDescription),
    prompt
  );

  return {
    statusCode: 200,
    body: JSON.stringify(reasoning, null, 2),
  };
}
