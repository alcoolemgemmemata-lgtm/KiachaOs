import { MegafunctionRegistry, MegafunctionMeta, UserContext, EventMapper } from "../modules/megafunction-core";
import os from "os";

const registry = new MegafunctionRegistry();

const meta: MegafunctionMeta = {
  name: "system.status",
  description: "Retorna o estado completo do Kiacha OS.",
  permission: "system.read",
  impl: async (_, context: any) => {
    const cpuLoad = os.loadavg();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const result = {
      timestamp: Date.now(),
      cpu: {
        load_1m: cpuLoad[0],
        load_5m: cpuLoad[1],
        load_15m: cpuLoad[2],
      },
      memory: {
        total: totalMem,
        free: freeMem,
        used: totalMem - freeMem,
        usage: Number(((totalMem - freeMem) / totalMem).toFixed(3))
      },
      uptime: os.uptime(),
      platform: os.platform(),
      version: context.kernel.version,
      modulesLoaded: context.kernel.modules,
      eventsRecent: context.eventBus.getRecentEvents(20)
    };
    context.eventBus.emit("system:status:update", result);
    return result;
  }
};

registry.register(meta.name, meta);
