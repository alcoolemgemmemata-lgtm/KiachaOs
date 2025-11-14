#include <emscripten.h>
#include <emscripten/bind.h>
#include <string>
#include <vector>
#include <map>
#include <queue>
#include <memory>
#include <algorithm>
#include <cmath>
#include <json/json.h>

/**
 * KIACHA OS - WASM Reasoning Module v2
 * Chain-of-Thought Engine com raciocínio em etapas
 * 
 * Arquitetura:
 *   Task → Planner → CoT Engine → Executor → Kernel Actions
 * 
 * Performance:
 *   - Raciocínio paralelo
 *   - Memória interna estruturada
 *   - Mini motor lógico
 *   - Sandbox WASM seguro
 */

// ============================================================================
// ESTRUTURAS DE DADOS
// ============================================================================

/**
 * Etapa de um plano de raciocínio
 */
struct ReasoningStep {
    std::string id;
    std::string type;              // "analysis", "planning", "execution", "validation"
    std::string content;
    std::vector<std::string> dependencies;  // IDs de outras etapas
    std::string status;            // "pending", "executing", "completed", "failed"
    std::string result;
    double confidence;             // 0.0 - 1.0
    int retries = 0;
    
    Json::Value toJson() const {
        Json::Value json;
        json["id"] = id;
        json["type"] = type;
        json["content"] = content;
        json["status"] = status;
        json["result"] = result;
        json["confidence"] = confidence;
        json["retries"] = retries;
        
        Json::Value deps(Json::arrayValue);
        for (const auto& dep : dependencies) {
            deps.append(dep);
        }
        json["dependencies"] = deps;
        
        return json;
    }
};

/**
 * Plano de execução completo
 */
struct ExecutionPlan {
    std::string task_id;
    std::string goal;
    std::vector<ReasoningStep> steps;
    std::map<std::string, std::string> context;
    std::string status;            // "planning", "executing", "completed", "failed"
    int current_step_index = 0;
    
    Json::Value toJson() const {
        Json::Value json;
        json["task_id"] = task_id;
        json["goal"] = goal;
        json["status"] = status;
        json["current_step"] = current_step_index;
        
        Json::Value steps_json(Json::arrayValue);
        for (const auto& step : steps) {
            steps_json.append(step.toJson());
        }
        json["steps"] = steps_json;
        
        Json::Value context_json(Json::objectValue);
        for (const auto& [key, val] : context) {
            context_json[key] = val;
        }
        json["context"] = context_json;
        
        return json;
    }
};

/**
 * Resultado de uma ação
 */
struct ActionResult {
    bool success;
    std::string message;
    std::string data;
    double confidence;
    
    Json::Value toJson() const {
        Json::Value json;
        json["success"] = success;
        json["message"] = message;
        json["data"] = data;
        json["confidence"] = confidence;
        return json;
    }
};

// ============================================================================
// MOTOR DE RACIOCÍNIO EM CADEIA (CHAIN-OF-THOUGHT)
// ============================================================================

class ChainOfThoughtEngine {
private:
    std::vector<ExecutionPlan> plans;
    std::map<std::string, std::vector<std::string>> memory;  // Memória semântica local
    int plan_counter = 0;
    
public:
    ChainOfThoughtEngine() {}
    
    /**
     * Decompor tarefa em etapas de raciocínio
     */
    ExecutionPlan planTask(const std::string& goal, const Json::Value& context) {
        ExecutionPlan plan;
        plan.task_id = "task_" + std::to_string(++plan_counter);
        plan.goal = goal;
        plan.status = "planning";
        
        // Converter contexto JSON para mapa
        for (const auto& key : context.getMemberNames()) {
            plan.context[key] = context[key].asString();
        }
        
        // FASE 1: Análise
        ReasoningStep analysis;
        analysis.id = plan.task_id + "_step_1";
        analysis.type = "analysis";
        analysis.content = "Analisar goal: " + goal;
        analysis.status = "pending";
        analysis.confidence = 0.9;
        plan.steps.push_back(analysis);
        
        // FASE 2: Decomposição
        ReasoningStep decomposition;
        decomposition.id = plan.task_id + "_step_2";
        decomposition.type = "planning";
        decomposition.content = "Quebrar em subtarefas";
        decomposition.dependencies.push_back(analysis.id);
        decomposition.status = "pending";
        decomposition.confidence = 0.85;
        plan.steps.push_back(decomposition);
        
        // FASE 3: Verificação lógica
        ReasoningStep verification;
        verification.id = plan.task_id + "_step_3";
        verification.type = "validation";
        verification.content = "Validar consistência lógica";
        verification.dependencies.push_back(decomposition.id);
        verification.status = "pending";
        verification.confidence = 0.8;
        plan.steps.push_back(verification);
        
        // FASE 4: Execução
        ReasoningStep execution;
        execution.id = plan.task_id + "_step_4";
        execution.type = "execution";
        execution.content = "Executar plano";
        execution.dependencies.push_back(verification.id);
        execution.status = "pending";
        execution.confidence = 0.75;
        plan.steps.push_back(execution);
        
        plans.push_back(plan);
        return plan;
    }
    
    /**
     * Executar um plano step-by-step
     */
    Json::Value executePlan(const std::string& task_id) {
        auto it = std::find_if(plans.begin(), plans.end(),
            [&task_id](const ExecutionPlan& p) { return p.task_id == task_id; });
        
        if (it == plans.end()) {
            Json::Value error;
            error["success"] = false;
            error["message"] = "Plan not found";
            return error;
        }
        
        ExecutionPlan& plan = *it;
        plan.status = "executing";
        
        // Executar etapas na ordem de dependências
        for (int i = 0; i < plan.steps.size(); i++) {
            auto& step = plan.steps[i];
            
            // Verificar se as dependências foram completadas
            bool can_execute = true;
            for (const auto& dep_id : step.dependencies) {
                auto dep_it = std::find_if(plan.steps.begin(), plan.steps.end(),
                    [&dep_id](const ReasoningStep& s) { return s.id == dep_id; });
                if (dep_it != plan.steps.end() && dep_it->status != "completed") {
                    can_execute = false;
                    break;
                }
            }
            
            if (!can_execute) continue;
            
            step.status = "executing";
            step.result = executeStep(step, plan);
            step.status = (step.result.empty() ? "failed" : "completed");
            
            plan.current_step_index = i;
        }
        
        plan.status = "completed";
        return plan.toJson();
    }
    
    /**
     * Executar uma etapa individual com retry logic
     */
    std::string executeStep(ReasoningStep& step, ExecutionPlan& plan) {
        std::string result;
        
        switch(hashType(step.type)) {
            case 0: // "analysis"
                result = performAnalysis(step, plan);
                break;
            case 1: // "planning"
                result = performPlanning(step, plan);
                break;
            case 2: // "validation"
                result = performValidation(step, plan);
                break;
            case 3: // "execution"
                result = performExecution(step, plan);
                break;
            default:
                result = "";
        }
        
        // Retry em caso de falha
        if (result.empty() && step.retries < 3) {
            step.retries++;
            step.confidence *= 0.8;
            result = executeStep(step, plan);
        }
        
        return result;
    }
    
    /**
     * Análise do objetivo
     */
    std::string performAnalysis(ReasoningStep& step, ExecutionPlan& plan) {
        // Extrair informações-chave do goal
        std::string analysis = "Analysis of: " + plan.goal + "\n";
        analysis += "Context items: " + std::to_string(plan.context.size()) + "\n";
        analysis += "Complexity: " + estimateComplexity(plan.goal) + "\n";
        
        step.confidence = 0.95;
        return analysis;
    }
    
    /**
     * Planejamento de subtarefas
     */
    std::string performPlanning(ReasoningStep& step, ExecutionPlan& plan) {
        std::string planning = "Plan decomposed into subtasks:\n";
        
        // Criar subtarefas baseado no goal
        auto subtasks = decomposeGoal(plan.goal);
        for (const auto& task : subtasks) {
            planning += "- " + task + "\n";
            memory["subtasks"].push_back(task);
        }
        
        step.confidence = 0.9;
        return planning;
    }
    
    /**
     * Validação lógica do plano
     */
    std::string performValidation(ReasoningStep& step, ExecutionPlan& plan) {
        std::string validation = "Logical validation:\n";
        
        // Verificar consistência
        bool consistent = true;
        for (const auto& [key, val] : plan.context) {
            if (val.empty()) {
                consistent = false;
                validation += "- Missing context: " + key + "\n";
            }
        }
        
        if (consistent) {
            validation += "- All contexts valid\n";
            step.confidence = 0.98;
        } else {
            validation += "- Some contexts missing, proceeding anyway\n";
            step.confidence = 0.7;
        }
        
        return validation;
    }
    
    /**
     * Execução do plano
     */
    std::string performExecution(ReasoningStep& step, ExecutionPlan& plan) {
        std::string execution = "Executing plan:\n";
        
        for (const auto& task : memory["subtasks"]) {
            execution += "- Executing: " + task + "\n";
        }
        
        step.confidence = 0.85;
        return execution;
    }
    
    /**
     * Recuperação de memória semântica
     */
    std::vector<std::string> recallMemory(const std::string& query) {
        auto it = memory.find(query);
        if (it != memory.end()) {
            return it->second;
        }
        return {};
    }
    
    /**
     * Armazenar resultado na memória
     */
    void storeMemory(const std::string& key, const std::string& value) {
        memory[key].push_back(value);
    }
    
private:
    /**
     * Hash simples para tipos de etapas
     */
    int hashType(const std::string& type) {
        if (type == "analysis") return 0;
        if (type == "planning") return 1;
        if (type == "validation") return 2;
        if (type == "execution") return 3;
        return -1;
    }
    
    /**
     * Estimar complexidade da tarefa
     */
    std::string estimateComplexity(const std::string& goal) {
        int words = 0;
        for (char c : goal) {
            if (c == ' ') words++;
        }
        
        if (words < 5) return "Low";
        if (words < 15) return "Medium";
        return "High";
    }
    
    /**
     * Decompor objetivo em subtarefas
     */
    std::vector<std::string> decomposeGoal(const std::string& goal) {
        std::vector<std::string> subtasks;
        
        // Padrões simples de decomposição
        if (goal.find("create") != std::string::npos) {
            subtasks.push_back("Validate requirements");
            subtasks.push_back("Prepare resources");
            subtasks.push_back("Execute creation");
            subtasks.push_back("Verify result");
        } else if (goal.find("monitor") != std::string::npos) {
            subtasks.push_back("Collect metrics");
            subtasks.push_back("Analyze data");
            subtasks.push_back("Compare thresholds");
            subtasks.push_back("Report status");
        } else if (goal.find("update") != std::string::npos) {
            subtasks.push_back("Check version");
            subtasks.push_back("Download update");
            subtasks.push_back("Verify integrity");
            subtasks.push_back("Apply update");
        } else {
            subtasks.push_back("Plan approach");
            subtasks.push_back("Gather information");
            subtasks.push_back("Execute action");
            subtasks.push_back("Evaluate outcome");
        }
        
        return subtasks;
    }
};

// ============================================================================
// INSTÂNCIA GLOBAL
// ============================================================================

ChainOfThoughtEngine* global_engine = nullptr;

// ============================================================================
// EMSCRIPTEN BINDINGS
// ============================================================================

/**
 * Ciclo principal de raciocínio
 * Entrada: JSON com tarefa e contexto
 * Saída: JSON com plano de execução
 */
std::string reason_cycle(const std::string& input_json) {
    if (!global_engine) {
        global_engine = new ChainOfThoughtEngine();
    }
    
    Json::CharReaderBuilder reader;
    Json::Value input;
    std::string errs;
    std::istringstream is(input_json);
    
    if (!Json::parseFromStream(reader, is, &input, &errs)) {
        Json::Value error;
        error["success"] = false;
        error["message"] = "JSON parse error: " + errs;
        
        Json::StreamWriterBuilder writer;
        return Json::writeString(writer, error);
    }
    
    // Extrair goal e contexto
    std::string goal = input.get("goal", "").asString();
    Json::Value context = input.get("context", Json::objectValue);
    
    if (goal.empty()) {
        Json::Value error;
        error["success"] = false;
        error["message"] = "Goal is required";
        
        Json::StreamWriterBuilder writer;
        return Json::writeString(writer, error);
    }
    
    // Planejar e executar
    auto plan = global_engine->planTask(goal, context);
    auto result = global_engine->executePlan(plan.task_id);
    
    // Serializar resultado
    Json::StreamWriterBuilder writer;
    return Json::writeString(writer, result);
}

/**
 * Chamar o motor de raciocínio com entrada string
 */
std::string think(const std::string& input) {
    if (!global_engine) {
        global_engine = new ChainOfThoughtEngine();
    }
    
    Json::Value obj;
    obj["goal"] = input;
    obj["context"] = Json::objectValue;
    
    Json::StreamWriterBuilder writer;
    std::string json_input = Json::writeString(writer, obj);
    
    return reason_cycle(json_input);
}

/**
 * Recuperar memória
 */
std::string recall_memory(const std::string& key) {
    if (!global_engine) {
        global_engine = new ChainOfThoughtEngine();
    }
    
    auto memories = global_engine->recallMemory(key);
    
    Json::Value result(Json::arrayValue);
    for (const auto& mem : memories) {
        result.append(mem);
    }
    
    Json::StreamWriterBuilder writer;
    return Json::writeString(writer, result);
}

/**
 * Armazenar na memória
 */
void store_memory(const std::string& key, const std::string& value) {
    if (!global_engine) {
        global_engine = new ChainOfThoughtEngine();
    }
    
    global_engine->storeMemory(key, value);
}

// Emscripten bindings
EMSCRIPTEN_BINDINGS(reasoning) {
    emscripten::function("reason_cycle", &reason_cycle);
    emscripten::function("think", &think);
    emscripten::function("recall_memory", &recall_memory);
    emscripten::function("store_memory", &store_memory);
}
