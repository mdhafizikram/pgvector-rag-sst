export async function getAcadPlanDescription(acadPlanCode: string) {
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
