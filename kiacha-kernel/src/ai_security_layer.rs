/**
 * AI Security Layer
 * 
 * Sistema de segurança inteligente:
 * - Detecta invasão
 * - Reage sozinho
 * - Bloqueia processos
 * - Reconfigura portas
 * - Protege arquivos
 * 
 * Objetivo: Sobrevivência do sistema
 */

use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;

// ============ TYPES ============

#[derive(Debug, Clone, PartialEq)]
pub enum ThreatLevel {
    Info,       // Informativo
    Low,        // Baixa ameaça
    Medium,     // Ameaça média
    High,       // Ameaça alta
    Critical,   // Crítica - ação imediata
}

#[derive(Debug, Clone)]
pub enum ThreatType {
    UnauthorizedAccess,
    PortScan,
    MaliciousProcess,
    FileIntrusionAttempt,
    DDoS,
    PrivilegeEscalation,
    NetworkAnomaly,
    SystemResourceAbuse,
}

#[derive(Debug, Clone)]
pub struct SecurityEvent {
    pub id: String,
    pub timestamp: chrono::DateTime<chrono::Utc>,
    pub threat_type: ThreatType,
    pub threat_level: ThreatLevel,
    pub source: String,
    pub description: String,
    pub auto_response: String,
    pub processed: bool,
}

#[derive(Debug, Clone)]
pub struct BlockedEntity {
    pub id: String,
    pub entity_type: String, // "process", "ip", "port", "file"
    pub identifier: String,
    pub reason: String,
    pub blocked_at: chrono::DateTime<chrono::Utc>,
    pub severity: u32, // 0-100
    pub auto_unblock_after: Option<i64>, // milliseconds
}

#[derive(Debug, Clone)]
pub struct FirewallRule {
    pub id: String,
    pub name: String,
    pub rule_type: String, // "allow", "block", "isolate"
    pub target: String,     // IP, port, process name
    pub priority: u32,
    pub active: bool,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug)]
pub struct SecurityProfile {
    pub baseline_processes: Vec<String>,
    pub allowed_ports: Vec<u16>,
    pub critical_files: Vec<String>,
    pub whitelist: Vec<String>,
    pub blacklist: Vec<String>,
}

// ============ AI SECURITY LAYER ============

pub struct AISecurityLayer {
    security_events: Arc<RwLock<Vec<SecurityEvent>>>,
    blocked_entities: Arc<RwLock<HashMap<String, BlockedEntity>>>,
    firewall_rules: Arc<RwLock<Vec<FirewallRule>>>,
    security_profile: Arc<RwLock<SecurityProfile>>,
    threat_responses: Arc<RwLock<HashMap<ThreatType, String>>>,
    is_active: Arc<RwLock<bool>>,
}

impl AISecurityLayer {
    pub fn new() -> Self {
        Self {
            security_events: Arc::new(RwLock::new(Vec::new())),
            blocked_entities: Arc::new(RwLock::new(HashMap::new())),
            firewall_rules: Arc::new(RwLock::new(Vec::new())),
            security_profile: Arc::new(RwLock::new(SecurityProfile {
                baseline_processes: vec![],
                allowed_ports: vec![80, 443, 3000, 3001, 8080],
                critical_files: vec![],
                whitelist: vec![],
                blacklist: vec![],
            })),
            threat_responses: Arc::new(RwLock::new(Self::setup_threat_responses())),
            is_active: Arc::new(RwLock::new(true)),
        }
    }

    // ============ THREAT DETECTION ============

    /// Detecta ameaça de acesso não autorizado
    pub async fn detect_unauthorized_access(&self, source_ip: String) -> Option<SecurityEvent> {
        let profile = self.security_profile.read().await;
        
        if profile.blacklist.contains(&source_ip) {
            let event = SecurityEvent {
                id: format!("sec-{}", uuid::Uuid::new_v4()),
                timestamp: chrono::Utc::now(),
                threat_type: ThreatType::UnauthorizedAccess,
                threat_level: ThreatLevel::High,
                source: source_ip.clone(),
                description: format!("Tentativa de acesso de IP bloqueado: {}", source_ip),
                auto_response: "Bloqueio de conexão".to_string(),
                processed: false,
            };

            self.process_event(event.clone()).await;
            return Some(event);
        }

        None
    }

    /// Detecta varredura de porta
    pub async fn detect_port_scan(&self, source_ip: String, scanned_ports: Vec<u16>) -> Option<SecurityEvent> {
        if scanned_ports.len() > 5 {
            let blocked_ports: Vec<u16> = scanned_ports
                .iter()
                .filter(|p| !self.security_profile.read().await.allowed_ports.contains(p))
                .copied()
                .collect();

            if blocked_ports.len() > 3 {
                let event = SecurityEvent {
                    id: format!("sec-{}", uuid::Uuid::new_v4()),
                    timestamp: chrono::Utc::now(),
                    threat_type: ThreatType::PortScan,
                    threat_level: ThreatLevel::Medium,
                    source: source_ip.clone(),
                    description: format!(
                        "Varredura de portas detectada de {}: {:?}",
                        source_ip, scanned_ports
                    ),
                    auto_response: "Isolamento de conexão".to_string(),
                    processed: false,
                };

                self.process_event(event.clone()).await;
                return Some(event);
            }
        }

        None
    }

    /// Detecta processo malicioso
    pub async fn detect_malicious_process(
        &self,
        process_name: String,
        behavior: String,
    ) -> Option<SecurityEvent> {
        let malicious_patterns = vec![
            "inject",
            "hook",
            "hijack",
            "worm",
            "trojan",
            "ransomware",
        ];

        let is_suspicious = malicious_patterns
            .iter()
            .any(|pattern| behavior.to_lowercase().contains(pattern));

        if is_suspicious {
            let event = SecurityEvent {
                id: format!("sec-{}", uuid::Uuid::new_v4()),
                timestamp: chrono::Utc::now(),
                threat_type: ThreatType::MaliciousProcess,
                threat_level: ThreatLevel::Critical,
                source: process_name.clone(),
                description: format!(
                    "Processo suspeito detectado: {} - Comportamento: {}",
                    process_name, behavior
                ),
                auto_response: "Bloqueio e isolamento imediato".to_string(),
                processed: false,
            };

            self.process_event(event.clone()).await;
            self.block_process(&process_name).await;
            return Some(event);
        }

        None
    }

    /// Detecta tentativa de intrusão em arquivo
    pub async fn detect_file_intrusion(&self, file_path: String) -> Option<SecurityEvent> {
        let profile = self.security_profile.read().await;

        if profile.critical_files.iter().any(|f| file_path.contains(f)) {
            let event = SecurityEvent {
                id: format!("sec-{}", uuid::Uuid::new_v4()),
                timestamp: chrono::Utc::now(),
                threat_type: ThreatType::FileIntrusionAttempt,
                threat_level: ThreatLevel::High,
                source: file_path.clone(),
                description: format!("Tentativa de acesso a arquivo crítico: {}", file_path),
                auto_response: "Bloqueio de acesso".to_string(),
                processed: false,
            };

            self.process_event(event.clone()).await;
            return Some(event);
        }

        None
    }

    /// Detecta anomalia de rede
    pub async fn detect_network_anomaly(
        &self,
        bandwidth_usage: u64,
        connection_count: u32,
    ) -> Option<SecurityEvent> {
        let unusual_bandwidth = bandwidth_usage > 1_000_000_000; // 1GB
        let unusual_connections = connection_count > 100;

        if unusual_bandwidth || unusual_connections {
            let event = SecurityEvent {
                id: format!("sec-{}", uuid::Uuid::new_v4()),
                timestamp: chrono::Utc::now(),
                threat_type: ThreatType::NetworkAnomaly,
                threat_level: ThreatLevel::Medium,
                source: "network".to_string(),
                description: format!(
                    "Anomalia de rede: {} GB trafegados, {} conexões ativas",
                    bandwidth_usage / 1_000_000_000,
                    connection_count
                ),
                auto_response: "Investigação e possível isolamento".to_string(),
                processed: false,
            };

            self.process_event(event.clone()).await;
            return Some(event);
        }

        None
    }

    // ============ AUTO RESPONSE ============

    /// Processa evento e responde automaticamente
    async fn process_event(&self, mut event: SecurityEvent) {
        let response = match event.threat_level {
            ThreatLevel::Critical => self.respond_critical(&event).await,
            ThreatLevel::High => self.respond_high(&event).await,
            ThreatLevel::Medium => self.respond_medium(&event).await,
            ThreatLevel::Low | ThreatLevel::Info => self.respond_low(&event).await,
        };

        event.processed = true;
        self.security_events.write().await.push(event);

        println!("[SECURITY] Resposta executada: {}", response);
    }

    /// Resposta para ameaça crítica
    async fn respond_critical(&self, event: &SecurityEvent) -> String {
        match event.threat_type {
            ThreatType::MaliciousProcess => {
                self.isolate_system().await;
                "Sistema isolado. Processo eliminado.".to_string()
            }
            ThreatType::PrivilegeEscalation => {
                self.revoke_privileges().await;
                "Privilégios revogados. Sistema reconfigurado.".to_string()
            }
            _ => {
                self.activate_emergency_lockdown().await;
                "Bloqueio de emergência ativado.".to_string()
            }
        }
    }

    /// Resposta para ameaça alta
    async fn respond_high(&self, event: &SecurityEvent) -> String {
        match event.threat_type {
            ThreatType::UnauthorizedAccess => {
                self.block_ip(&event.source).await;
                format!("IP {} bloqueado permanentemente", event.source)
            }
            ThreatType::FileIntrusionAttempt => {
                self.protect_file(&event.source).await;
                format!("Arquivo {} protegido", event.source)
            }
            _ => {
                self.add_firewall_rule(&event.source, "block").await;
                "Regra de firewall adicionada".to_string()
            }
        }
    }

    /// Resposta para ameaça média
    async fn respond_medium(&self, event: &SecurityEvent) -> String {
        self.log_and_monitor(&event.source).await;
        "Monitoramento intensificado.".to_string()
    }

    /// Resposta para ameaça baixa
    async fn respond_low(&self, event: &SecurityEvent) -> String {
        self.log_event_only().await;
        "Evento registrado para análise posterior.".to_string()
    }

    // ============ BLOCKING ACTIONS ============

    /// Bloqueia processo
    pub async fn block_process(&self, process_name: &str) {
        let blocked = BlockedEntity {
            id: format!("block-{}", uuid::Uuid::new_v4()),
            entity_type: "process".to_string(),
            identifier: process_name.to_string(),
            reason: "Comportamento malicioso detectado".to_string(),
            blocked_at: chrono::Utc::now(),
            severity: 95,
            auto_unblock_after: None,
        };

        self.blocked_entities
            .write()
            .await
            .insert(blocked.id.clone(), blocked);

        println!("[SECURITY] Processo bloqueado: {}", process_name);
    }

    /// Bloqueia IP
    pub async fn block_ip(&self, ip: &str) {
        let blocked = BlockedEntity {
            id: format!("block-{}", uuid::Uuid::new_v4()),
            entity_type: "ip".to_string(),
            identifier: ip.to_string(),
            reason: "Acesso não autorizado".to_string(),
            blocked_at: chrono::Utc::now(),
            severity: 90,
            auto_unblock_after: None,
        };

        self.blocked_entities
            .write()
            .await
            .insert(blocked.id.clone(), blocked);

        // Adiciona à blacklist
        let mut profile = self.security_profile.write().await;
        if !profile.blacklist.contains(&ip.to_string()) {
            profile.blacklist.push(ip.to_string());
        }

        println!("[SECURITY] IP bloqueado: {}", ip);
    }

    /// Bloqueia porta
    pub async fn block_port(&self, port: u16) {
        let blocked = BlockedEntity {
            id: format!("block-{}", uuid::Uuid::new_v4()),
            entity_type: "port".to_string(),
            identifier: port.to_string(),
            reason: "Atividade suspeita".to_string(),
            blocked_at: chrono::Utc::now(),
            severity: 70,
            auto_unblock_after: Some(3600000), // 1 hora
        };

        self.blocked_entities
            .write()
            .await
            .insert(blocked.id.clone(), blocked);

        println!("[SECURITY] Porta bloqueada: {}", port);
    }

    // ============ PROTECTION ACTIONS ============

    /// Protege arquivo crítico
    pub async fn protect_file(&self, file_path: &str) {
        let mut profile = self.security_profile.write().await;
        if !profile.critical_files.contains(&file_path.to_string()) {
            profile.critical_files.push(file_path.to_string());
        }
        println!("[SECURITY] Arquivo protegido: {}", file_path);
    }

    /// Isola sistema (desconecta da rede)
    async fn isolate_system(&self) {
        println!("[SECURITY] ISOLAMENTO DO SISTEMA ATIVADO!");
        // Em produção, desconectaria da rede
    }

    /// Revoga privilégios
    async fn revoke_privileges(&self) {
        println!("[SECURITY] Privilégios revogados");
    }

    /// Ativa bloqueio de emergência
    async fn activate_emergency_lockdown(&self) {
        println!("[SECURITY] BLOQUEIO DE EMERGÊNCIA!");
        *self.is_active.write().await = false;
    }

    // ============ FIREWALL MANAGEMENT ============

    /// Adiciona regra de firewall
    pub async fn add_firewall_rule(&self, target: &str, rule_type: &str) {
        let rule = FirewallRule {
            id: format!("rule-{}", uuid::Uuid::new_v4()),
            name: format!("{} - {}", rule_type, target),
            rule_type: rule_type.to_string(),
            target: target.to_string(),
            priority: 100,
            active: true,
            created_at: chrono::Utc::now(),
        };

        self.firewall_rules.write().await.push(rule);
        println!("[SECURITY] Regra de firewall adicionada: {}", target);
    }

    /// Reconfigura portas
    pub async fn reconfigure_ports(&self, new_ports: Vec<u16>) {
        let mut profile = self.security_profile.write().await;
        profile.allowed_ports = new_ports;
        println!("[SECURITY] Portas reconfiguradas");
    }

    // ============ LOGGING & MONITORING ============

    async fn log_and_monitor(&self, source: &str) {
        println!("[SECURITY] Monitorando: {}", source);
    }

    async fn log_event_only(&self) {
        println!("[SECURITY] Evento registrado");
    }

    // ============ GETTERS ============

    pub async fn get_security_events(&self) -> Vec<SecurityEvent> {
        self.security_events.read().await.clone()
    }

    pub async fn get_blocked_entities(&self) -> Vec<BlockedEntity> {
        self.blocked_entities
            .read()
            .await
            .values()
            .cloned()
            .collect()
    }

    pub async fn get_firewall_rules(&self) -> Vec<FirewallRule> {
        self.firewall_rules.read().await.clone()
    }

    pub async fn get_threat_level(&self) -> ThreatLevel {
        let events = self.security_events.read().await;
        let critical = events.iter().any(|e| e.threat_level == ThreatLevel::Critical);
        let high = events.iter().any(|e| e.threat_level == ThreatLevel::High);

        if critical {
            ThreatLevel::Critical
        } else if high {
            ThreatLevel::High
        } else {
            ThreatLevel::Low
        }
    }

    fn setup_threat_responses() -> HashMap<ThreatType, String> {
        let mut responses = HashMap::new();
        responses.insert(
            ThreatType::UnauthorizedAccess,
            "Bloquear e investigar".to_string(),
        );
        responses.insert(ThreatType::PortScan, "Isolar conexão".to_string());
        responses.insert(ThreatType::MaliciousProcess, "Eliminar imediatamente".to_string());
        responses.insert(ThreatType::FileIntrusionAttempt, "Proteger arquivos".to_string());
        responses.insert(ThreatType::DDoS, "Mitigar ataque".to_string());
        responses
    }
}

// ============ THREAT ANALYSIS ============

pub struct ThreatAnalyzer;

impl ThreatAnalyzer {
    pub fn analyze_behavior(process_name: &str, behavior: &str) -> ThreatLevel {
        let suspicious_keywords = vec!["inject", "hook", "hijack", "keylog", "steal"];
        let critical_keywords = vec!["worm", "trojan", "ransomware", "backdoor"];

        if critical_keywords
            .iter()
            .any(|keyword| behavior.to_lowercase().contains(keyword))
        {
            ThreatLevel::Critical
        } else if suspicious_keywords
            .iter()
            .any(|keyword| behavior.to_lowercase().contains(keyword))
        {
            ThreatLevel::High
        } else {
            ThreatLevel::Low
        }
    }

    pub fn calculate_risk_score(
        threat_level: &ThreatLevel,
        frequency: u32,
        impact: u32,
    ) -> u32 {
        let level_score = match threat_level {
            ThreatLevel::Critical => 100,
            ThreatLevel::High => 75,
            ThreatLevel::Medium => 50,
            ThreatLevel::Low => 25,
            ThreatLevel::Info => 0,
        };

        ((level_score * frequency * impact) / 100).min(100)
    }
}

// ============ EXPORTS ============

pub mod exports {
    pub use super::{
        AISecurityLayer, BlockedEntity, FirewallRule, SecurityEvent, SecurityProfile,
        ThreatAnalyzer, ThreatLevel, ThreatType,
    };
}
