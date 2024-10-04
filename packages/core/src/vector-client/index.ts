import { VectorClient } from "sst";
const client = VectorClient("dplAPVectorDB");

export async function deleteVectors() {
  try {
    await client.remove({
      include: { type: "acadPlan" },
    });

    return {
      statusCode: 200,
      body: "Removed all vectors",
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: "Internal Server Error",
    };
  }
}

export async function queryVectors({
  vector,
  count = "10",
  includeParams,
}: {
  vector: any;
  count?: string;
  includeParams?: any;
}) {
  try {
    return await client.query({
      vector,
      count: parseInt(count),
      include: includeParams,
    });
  } catch (error) {
    console.log("Error in queryVectors:", error);
    return {
      statusCode: 500,
      body: "Internal Server Error",
    };
  }
}

export async function putVectors({
  vector,
  metadata,
}: {
  vector: any;
  metadata: any;
}) {
  try {
    return await client.put({
      vector,
      metadata,
    });
  } catch (error) {
    console.log("Error in putVectors:", error);
    return {
      statusCode: 500,
      body: "Internal Server Error",
    };
  }
}
