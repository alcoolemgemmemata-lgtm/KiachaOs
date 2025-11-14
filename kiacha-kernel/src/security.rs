use parking_lot::Mutex;
use std::sync::Arc;

pub struct SecurityAudit {
    logs: Arc<Mutex<Vec<String>>>,
}

impl SecurityAudit {
    pub fn new() -> Self {
        SecurityAudit {
            logs: Arc::new(Mutex::new(Vec::new())),
        }
    }

    pub fn log(&self, event: &str, details: &str) {
        let timestamp = chrono::Local::now().format("%Y-%m-%d %H:%M:%S");
        let log_entry = format!("[{}] {}: {}", timestamp, event, details);
        self.logs.lock().push(log_entry);
    }

    pub fn get_logs(&self) -> Vec<String> {
        self.logs.lock().clone()
    }
}
