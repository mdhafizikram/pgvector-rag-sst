import { validateUserQuery } from "./openai";

async function promptValidation(userQuery = "") {
  try {
    const validationPrompt = `
        ### Role ###
        AI Validator responsible for checking if the user query meets content guidelines.
  
        ### Instructions ###
        - The User Query should be focused on the student's interest to take up course. 
        - The User Query should be as per student's perspective. Possible query's student might ask.
        - The User Query must not contain destructive content (e.g., harmful, violent, illegal, offensive, etc.).
        - The User Query should not be a lame or non-sensible question.
        - If the User Query meets these conditions, return "true".
        - If the User Query violates any of the conditions, return "false".
  
        ### User Query: ###
        ${userQuery}
      `;

    const validationResult = await validateUserQuery(validationPrompt);

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
