// CopilotKit runtime (AG-UI) for the Atlas copilot drawer. Serves /api/copilotkit/info, /agent/:id/run, etc.
import { CopilotRuntime, createCopilotRuntimeHandler } from "@copilotkit/runtime/v2";
import { MastraAgent } from "@ag-ui/mastra";
import { radarCopilot } from "@/mastra/copilot";

process.env.COPILOTKIT_TELEMETRY_DISABLED ??= "true";

const runtime = new CopilotRuntime({
  agents: { default: new MastraAgent({ agentId: "default", agent: radarCopilot, resourceId: "radar" }) },
});
const handler = createCopilotRuntimeHandler({ runtime, basePath: "/api/copilotkit" });

export const GET = handler;
export const POST = handler;
