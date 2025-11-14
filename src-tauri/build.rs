use std::env;
use std::path::PathBuf;

fn main() {
    let out_dir = env::var("OUT_DIR").unwrap();
    let out_path = PathBuf::from(&out_dir);
    
    // Tauri build
    tauri_build::build();
    
    // Generate embed constants
    println!("cargo:rustc-env=EMBED_FRONTEND_DIR={}/embedded", out_dir);
}
