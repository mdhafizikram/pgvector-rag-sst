import { Resource } from "sst";

interface CustomResource extends Resource {
  "iam-dpl-rag-bucket": {
    name: string;
  };
}

console.log(
  ` Linked to ${(Resource as CustomResource)["iam-dpl-rag-bucket"].name}.`
);
