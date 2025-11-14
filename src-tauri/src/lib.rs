/// Kiacha OS - Tauri Application Library
/// 
/// This library provides the core functionality for the Kiacha OS Tauri application,
/// including embedded assets, custom protocol handlers, and IPC.

pub mod embed;

pub use embed::AssetStore;

/// Initialize the application
pub fn init() {
    #[cfg(debug_assertions)]
    {
        println!("[KIACHA] Starting Kiacha OS (Debug Mode)");
    }
    
    #[cfg(not(debug_assertions))]
    {
        println!("[KIACHA] Starting Kiacha OS (Release Mode - Embedded Assets)");
    }
}

/// Get version information
pub fn version() -> &'static str {
    env!("CARGO_PKG_VERSION")
}

/// Get application name
pub fn app_name() -> &'static str {
    env!("CARGO_PKG_NAME")
}
