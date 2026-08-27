import sys

content = open('crates/codegen/xai-hystersis-pager-bin/src/main.rs', 'r').read()

target = r"""    let _otel_guard = xai_hystersis_telemetry::otel_layer::otel_guard();"""

replacement = r"""    let _otel_guard = xai_hystersis_telemetry::otel_layer::otel_guard();
    let agent_config = xai_hystersis_shell::config::load_agent_config_disk_only().unwrap_or_default();
    if agent_config.model_providers.is_empty() && agent_config.config_models.is_empty() {
        let _ = xai_hystersis_pager::configure_cmd::run().await;
    }"""

if target in content:
    content = content.replace(target, replacement)
    open('crates/codegen/xai-hystersis-pager-bin/src/main.rs', 'w').write(content)
    print("Patched main.rs successfully!")
else:
    print("Could not find target in main.rs")
