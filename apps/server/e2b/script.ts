import { readFileSync } from "fs";
import { dirname, join } from "path";
import { Sandbox } from "e2b";

const envPath = join(dirname(import.meta.dir), ".env");
for (const line of readFileSync(envPath, "utf8").split("\n")) {
  const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (match?.[1] !== undefined && match[2] !== undefined) {
    process.env[match[1]] ??= match[2];
  }
}

const E2B_API_KEY = process.env.E2B_API_KEY!;
const E2B_TEMPLATE_ID = process.env.E2B_TEMPLATE_ID || "lovable-v1-react-ts";

async function main() {
  const sbx = await Sandbox.create(E2B_TEMPLATE_ID, {
    timeoutMs: 60000,
    apiKey: E2B_API_KEY,
  });

  const files = await sbx.files.list("/home/user/app/src/components/ui");
  console.log("count:", files.length);
  console.log(files.slice(0, 5).map((f) => f.name));

  const url = sbx.getHost(5173);
  console.log("url:", `https://${url}`);

  //   await sbx.kill();
}

main();
