import { MegafunctionRegistry, MegafunctionMeta, UserContext } from "../modules/megafunction-core";

const registry = new MegafunctionRegistry();

const memoryStore = {
  short: {},
  long: {},
  contextual: {},
  emotional: {}
};

const meta: MegafunctionMeta = {
  name: "core.memory",
  description: "Sistema de memória central do Kiacha OS.",
  permission: "memory.read",
  impl: async ({ action, key, value, scope = "short" }, context: any) => {
    const { eventBus } = context;
    if (action === "set") {
      memoryStore[scope][key] = value;
      eventBus.emit("memory:write", { scope, key, value });
      return { status: "written", scope, key, value };
    }
    if (action === "update") {
      memoryStore[scope][key] = { ...(memoryStore[scope][key] || {}), ...value };
      eventBus.emit("memory:update", { scope, key, value });
      return { status: "updated", scope, key, value };
    }
    if (action === "get") {
      const found = memoryStore[scope][key];
      eventBus.emit("memory:retrieve", { scope, key, value: found });
      return found ?? null;
    }
    return { error: "invalid action" };
  }
};

registry.register(meta.name, meta);
