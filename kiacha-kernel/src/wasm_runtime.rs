use wasmtime::{Engine, Instance, Linker, Module, Store};
use wasmtime_wasi::{WasiCtx, WasiCtxBuilder};
use anyhow::Result;

pub struct WasmRuntime {
    engine: Engine,
}

impl WasmRuntime {
    pub fn new() -> Result<Self> {
        let engine = Engine::default();
        Ok(WasmRuntime { engine })
    }

    pub async fn execute(&self, wasm_data: &[u8], _args: Vec<String>) -> Result<String> {
        let module = Module::new(&self.engine, wasm_data)?;
        let mut store = Store::new(&self.engine, ());

        let linker = Linker::new(&self.engine);
        let instance = linker.instantiate(&mut store, &module)?;

        // Call the "run" export if it exists
        if let Ok(run) = instance.get_typed_func::<(), i32>(&mut store, "run") {
            let result = run.call(&mut store, ())?;
            return Ok(format!("WASM result: {}", result));
        }

        Ok("WASM executed without explicit result".to_string())
    }
}
