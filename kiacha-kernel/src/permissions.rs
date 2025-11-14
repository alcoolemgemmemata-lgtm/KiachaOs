use std::collections::HashMap;

#[derive(Clone, Debug, PartialEq, Eq, Hash)]
pub enum Permission {
    SendIpc,
    RunWasm,
    AccessMemory,
    AccessVision,
    AccessAudio,
    SystemCall,
    Admin,
}

pub struct PermissionManager {
    permissions: dashmap::DashMap<String, Vec<Permission>>,
}

impl PermissionManager {
    pub fn new() -> Self {
        let pm = PermissionManager {
            permissions: dashmap::DashMap::new(),
        };
        
        // Default permissions for known modules
        pm.permissions.insert("brain".to_string(), vec![
            Permission::SendIpc,
            Permission::RunWasm,
            Permission::AccessMemory,
            Permission::AccessVision,
            Permission::AccessAudio,
        ]);

        pm.permissions.insert("interface".to_string(), vec![
            Permission::SendIpc,
            Permission::AccessVision,
            Permission::AccessAudio,
        ]);

        pm
    }

    pub fn check(&self, module_id: &str, permission: Permission) -> anyhow::Result<()> {
        if let Some(perms) = self.permissions.get(module_id) {
            if perms.contains(&permission) {
                return Ok(());
            }
        }
        Err(anyhow::anyhow!("Permission denied for {}: {:?}", module_id, permission))
    }

    pub fn grant(&self, module_id: &str, permission: Permission) {
        self.permissions
            .entry(module_id.to_string())
            .or_insert_with(Vec::new)
            .push(permission);
    }

    pub fn revoke(&self, module_id: &str, permission: Permission) {
        if let Some(mut perms) = self.permissions.get_mut(module_id) {
            perms.retain(|p| p != &permission);
        }
    }
}
