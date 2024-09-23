/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "iam-dpl-rag",
      removal: input?.stage === "production" ? "retain" : "remove",
      home: "aws",
      providers: {
        aws: {
          region: "ap-south-1",
          profile: "oo-sandbox-admin-460413214814",
        },
      },
    };
  },
  async run() {
    await import("./infra/storage");
    await import("./infra/secrets");
    await import("./infra/api");
    await import("./infra/vector");
  },
});
