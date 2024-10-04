const { ChatOpenAI } = require("@langchain/openai");
const { ChatPromptTemplate } = require("@langchain/core/prompts");

const system = `
  You are an expert at converting user questions to perfom query expansion. 
  
  From the user question ,understand the field the user is intrested in. 
  Look if there are multiple common ways of phrasing a user question 
  or common synonyms for key words in the question. 
  Remember that the user question align's with a student who is looking to take up academic courses.
  

  If there are acronyms or words you are not familiar with, do not try to rephrase them.


`;

const openai = new ChatOpenAI({
  modelName: "gpt-3.5-turbo",
  temperature: 0,
  apiKey: OPENAI_APIKEY,
});

const prompt = ChatPromptTemplate.fromMessages([
  { role: "system", content: system },
  { role: "user", content: "{question}" },
]);

const chain = prompt.pipe(openai);

const question =
  "What should I study if I want to create AI tools that assist with mental health?";

async function runQueryExpansion() {
  const result = await chain.invoke({ question });
  console.log(result.content);
}

runQueryExpansion();
