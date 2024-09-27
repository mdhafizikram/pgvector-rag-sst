import { bucket } from "./storage";
import { api } from "./api";

export const viteStaticSite = new sst.aws.StaticSite("IamDplRagWeb", {
  environment: {
    VITE_DPL_API_DOMAIN: "https://api.myasuplat-dpl.asu.edu",
    VITE_LAMBDA_API_DOMAIN: api.url,
  },
  build: {
    command: "pnpm run build",
    output: "dist",
  },
  path: "packages/client",
  assets: {
    bucket: bucket.name,
  },
  dev: {
    command: "pnpm run dev",
  },
});
