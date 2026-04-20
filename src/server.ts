import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerShaderGenerator } from "./tools/shader-generator.js";
import { registerShaderCompositor } from "./tools/shader-compositor.js";
import { registerBackgroundGenerator } from "./tools/background-presets.js";
import { registerModelGenerator } from "./tools/model-generator.js";
import { registerScrollAnimation } from "./tools/animation-scroll.js";
import { registerComponentGenerator } from "./tools/component-generator.js";
import { registerPageComposer } from "./tools/page-composer.js";
import { registerAnimationValidator } from "./tools/animation-validator.js";
import { registerPageCapture } from "./tools/page-capture.js";
import { registerDesignEvaluator } from "./tools/design-evaluator.js";
import { registerAsciiArt } from "./tools/ascii-art.js";
import { registerSceneGenerator } from "./tools/scene-generator.js";
import { registerPageIterator } from "./tools/page-iterator.js";
import { registerResources } from "./resources/index.js";
import { registerPrompts } from "./prompts/index.js";

export function createServer(): McpServer {
  const server = new McpServer({
    name: "brushstroke",
    version: "1.0.0",
  });

  // Tools (13 tool registrations = 15 tools total, since compositor registers 2 and validator registers 2)
  registerShaderGenerator(server);
  registerShaderCompositor(server);
  registerBackgroundGenerator(server);
  registerModelGenerator(server);
  registerScrollAnimation(server);
  registerComponentGenerator(server);
  registerPageComposer(server);
  registerAnimationValidator(server);
  registerPageCapture(server);
  registerDesignEvaluator(server);
  registerAsciiArt(server);
  registerSceneGenerator(server);
  registerPageIterator(server);

  // Resources (browsable documentation)
  registerResources(server);

  // Prompts (workflow templates)
  registerPrompts(server);

  return server;
}
