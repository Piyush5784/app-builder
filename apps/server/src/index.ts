import { app } from "@/app";
import { PORT } from "@/config";
import { attachAgentEventServer } from "@/agent/events";

const server = app.listen(PORT, () => console.log(`Server started on port ${PORT}`));

attachAgentEventServer(server);
