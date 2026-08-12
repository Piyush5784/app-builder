import { Template, defaultBuildLogger } from "e2b";
import { template } from "./template";

async function main() {
  await Template.build(template, "lovable-v1-react-ts-dev", {
    onBuildLogs: defaultBuildLogger(),
  });
}

main().catch(console.error);
