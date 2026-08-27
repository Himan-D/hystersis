import sys

content = open('crates/codegen/xai-hystersis-pager-bin/src/main.rs', 'r').read()

target = r"""    eprintln!("Providers: {}, Models: {}", agent_config.model_providers.len(), agent_config.config_models.len());
    if agent_config.model_providers.is_empty() && agent_config.config_models.is_empty() {"""
replacement = r"""    if agent_config.model_providers.is_empty() && agent_config.config_models.is_empty() {"""

if target in content:
    content = content.replace(target, replacement)
    
target2 = r"""    let agent_config = xai_hystersis_shell::config::load_agent_config_disk_only().unwrap_or_else(|e| {
        eprintln!("CONFIG LOAD ERROR: {}", e);
        Default::default()
    });"""
replacement2 = r"""    let agent_config = xai_hystersis_shell::config::load_agent_config_disk_only().unwrap_or_default();"""

if target2 in content:
    content = content.replace(target2, replacement2)
    open('crates/codegen/xai-hystersis-pager-bin/src/main.rs', 'w').write(content)
    print("Patched main.rs successfully!")
else:
    print("Could not find target in main.rs")
