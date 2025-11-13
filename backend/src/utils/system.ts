import os from 'os'

export function getSystemInfo() {
  return {
    platform: process.platform,
    cpus: os.cpus().length,
    memory: {
      total: os.totalmem(),
      free: os.freemem(),
      usedPercent: ((os.totalmem() - os.freemem()) / os.totalmem() * 100).toFixed(2)
    },
    uptime: process.uptime(),
    hostname: os.hostname()
  }
}

export function getMemoryUsage() {
  const usage = process.memoryUsage()
  return {
    rss: `${(usage.rss / 1024 / 1024).toFixed(2)} MB`,
    heapTotal: `${(usage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
    heapUsed: `${(usage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
    external: `${(usage.external / 1024 / 1024).toFixed(2)} MB`
  }
}
