import acadPlans from "./acadplans/mappedAcadPlans.json";
import { generateEmbeddingOpenAI } from "./openai";
import { putVectors } from "./vector-client";

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

export async function seeder({ start, end }: { start: number; end: number }) {
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

          const putPayload = {
            vector,
            metadata: {
              type: "acadPlan",
              id: acadPlanCode,
              fullDescription,
              careerOpportunities,
              globalExperienceText,
              ...rest,
            },
          };

          return await putVectors(putPayload);
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
