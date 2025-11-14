import { MegafunctionRegistry, MegafunctionMeta, UserContext } from "../modules/megafunction-core";

const registry = new MegafunctionRegistry();

const meta: MegafunctionMeta = {
  name: "core.intent.route",
  description: "Interpreta intenção multimodal e direciona para o módulo correto.",
  permission: "intent.process",
  impl: async (input, context: any) => {
    const { eventBus, dispatcher } = context;
    eventBus.emit("intent:received", input);
    const intent = await context.brain.nlu.process(input);
    const route = {
      intent: intent.label,
      confidence: intent.confidence,
      targetModule: intent.target,
      parameters: intent.parameters
    };
    const output = await dispatcher.dispatch(route.targetModule, route.parameters);
    eventBus.emit("intent:routed", { route, output });
    return { route, output };
  }
};

registry.register(meta.name, meta);
