export const vector = new sst.aws.Vector("dplAPVectorDB", {
  dimension: 1536,
  transform: {
    postgres: {
      databaseName: "dplAPVectorDB",
      scaling: {
        max: "2 ACU",
      },
    },
  },
});
