mod kernel;
mod ipc;
mod permissions;
mod resources;
mod wasm_runtime;
mod security;

use kernel::KiachaKernel;
use std::net::SocketAddr;
use tracing::{info, Level};
use tracing_subscriber;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Setup tracing
    tracing_subscriber::fmt()
        .with_max_level(Level::INFO)
        .init();

    info!("🚀 Kiacha OS Kernel starting...");

    // Initialize kernel
    let kernel = KiachaKernel::new().await?;

    // Start IPC server (gRPC)
    let addr: SocketAddr = "[::1]:50051".parse()?;
    info!("IPC server listening on {}", addr);

    kernel.start_ipc_server(addr).await?;

    info!("✓ Kiacha OS Kernel running");
    Ok(())
}
