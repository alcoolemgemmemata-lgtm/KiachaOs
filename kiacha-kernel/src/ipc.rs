use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct IpcMessage {
    pub from: String,
    pub to: String,
    pub payload: String,
    pub timestamp: u64,
}

impl IpcMessage {
    pub fn new(from: String, to: String, payload: String) -> Self {
        IpcMessage {
            from,
            to,
            payload,
            timestamp: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default()
                .as_millis() as u64,
        }
    }
}

pub struct IpcChannel {
    sender: tokio::sync::mpsc::Sender<IpcMessage>,
    receiver: tokio::sync::mpsc::Receiver<IpcMessage>,
}

impl IpcChannel {
    pub fn new(capacity: usize) -> (Self, tokio::sync::mpsc::Sender<IpcMessage>, tokio::sync::mpsc::Receiver<IpcMessage>) {
        let (sender, receiver) = tokio::sync::mpsc::channel(capacity);
        (
            IpcChannel {
                sender: sender.clone(),
                receiver,
            },
            sender,
            receiver,
        )
    }
}
