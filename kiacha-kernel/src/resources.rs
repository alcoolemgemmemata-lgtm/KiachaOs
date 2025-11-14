use std::collections::HashMap;
use sysinfo::{System, SystemExt};

pub struct ResourceMonitor {
    system: parking_lot::Mutex<System>,
}

impl ResourceMonitor {
    pub fn new() -> Self {
        ResourceMonitor {
            system: parking_lot::Mutex::new(System::new_all()),
        }
    }

    pub async fn get_stats(&self) -> HashMap<String, f64> {
        let mut system = self.system.lock();
        system.refresh_all();

        let mut stats = HashMap::new();
        
        // CPU usage
        let cpu_usage = system.global_cpu_info().cpu_usage();
        stats.insert("cpu_usage".to_string(), cpu_usage as f64);

        // Memory
        let total_mem = system.total_memory() as f64;
        let used_mem = system.used_memory() as f64;
        stats.insert("memory_total".to_string(), total_mem);
        stats.insert("memory_used".to_string(), used_mem);
        stats.insert("memory_percent".to_string(), (used_mem / total_mem) * 100.0);

        stats
    }
}
