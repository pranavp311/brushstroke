import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerShaderGenerator } from "./tools/shader-generator.js";
import { registerBackgroundGenerator } from "./tools/background-presets.js";
import { registerModelGenerator } from "./tools/model-generator.js";
import { registerScrollAnimation } from "./tools/animation-scroll.js";
import { registerComponentGenerator } from "./tools/component-generator.js";

export function createServer(): McpServer {
  const server = new McpServer({
    name: "frontend-mcp",
    version: "1.0.0",
  });

  registerShaderGenerator(server);
  registerBackgroundGenerator(server);
  registerModelGenerator(server);
  registerScrollAnimation(server);
  registerComponentGenerator(server);

  return server;
}
