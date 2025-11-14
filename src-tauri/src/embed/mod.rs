/// Embedded Assets Module
/// 
/// This module provides embedded access to frontend assets (HTML, JS, CSS, images)
/// directly from the binary without needing external files on disk.

use std::collections::HashMap;
use std::path::Path;

/// Represents an embedded asset file
#[derive(Debug, Clone)]
pub struct EmbeddedAsset {
    pub path: String,
    pub content: &'static [u8],
    pub mime_type: &'static str,
}

/// Central asset store - all assets embedded in binary
pub struct AssetStore {
    assets: HashMap<String, EmbeddedAsset>,
}

impl AssetStore {
    /// Create a new asset store with all embedded assets
    pub fn new() -> Self {
        let mut assets = HashMap::new();
        
        // Embed index.html
        assets.insert(
            "index.html".to_string(),
            EmbeddedAsset {
                path: "index.html".to_string(),
                content: include_bytes!("../../dist/index.html"),
                mime_type: "text/html; charset=utf-8",
            },
        );
        
        // Try to embed main JS (will be created during frontend build)
        // These will be populated by the build system
        
        AssetStore { assets }
    }
    
    /// Get an asset by path
    pub fn get(&self, path: &str) -> Option<&EmbeddedAsset> {
        let normalized = path.trim_start_matches('/');
        self.assets.get(normalized)
    }
    
    /// Get or return 404
    pub fn get_or_404(&self, path: &str) -> &'static [u8] {
        if let Some(asset) = self.get(path) {
            asset.content
        } else {
            b"404 Not Found"
        }
    }
    
    /// List all available assets
    pub fn list_assets(&self) -> Vec<&str> {
        self.assets.keys().map(|k| k.as_str()).collect()
    }
    
    /// Get MIME type for asset
    pub fn get_mime_type(&self, path: &str) -> &'static str {
        if let Some(asset) = self.get(path) {
            asset.mime_type
        } else {
            Self::guess_mime_type(path)
        }
    }
    
    /// Guess MIME type from file extension
    fn guess_mime_type(path: &str) -> &'static str {
        if let Some(ext) = Path::new(path).extension() {
            match ext.to_str().unwrap_or("") {
                "html" => "text/html; charset=utf-8",
                "css" => "text/css; charset=utf-8",
                "js" => "application/javascript; charset=utf-8",
                "json" => "application/json; charset=utf-8",
                "png" => "image/png",
                "jpg" | "jpeg" => "image/jpeg",
                "gif" => "image/gif",
                "svg" => "image/svg+xml",
                "wasm" => "application/wasm",
                "ttf" => "font/ttf",
                "woff" => "font/woff",
                "woff2" => "font/woff2",
                "txt" => "text/plain; charset=utf-8",
                "md" => "text/markdown; charset=utf-8",
                _ => "application/octet-stream",
            }
        } else {
            "application/octet-stream"
        }
    }
}

impl Default for AssetStore {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_mime_type_detection() {
        assert_eq!(AssetStore::guess_mime_type("file.html"), "text/html; charset=utf-8");
        assert_eq!(AssetStore::guess_mime_type("file.css"), "text/css; charset=utf-8");
        assert_eq!(AssetStore::guess_mime_type("file.js"), "application/javascript; charset=utf-8");
        assert_eq!(AssetStore::guess_mime_type("file.png"), "image/png");
        assert_eq!(AssetStore::guess_mime_type("file.wasm"), "application/wasm");
    }
}
