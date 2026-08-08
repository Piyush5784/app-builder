import { executer } from "@/agent/tools/executer";
import { tools } from "@/agent/tools/schema";

export const toolsModule = { executer, schema: { tools } };
export { tools };
