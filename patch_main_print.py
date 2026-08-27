import sys

content = open('crates/codegen/xai-hystersis-pager-bin/src/main.rs', 'r').read()

target = r"""    if agent_config.model_providers.is_empty() && agent_config.config_models.is_empty() {"""
replacement = r"""    eprintln!("Providers: {}, Models: {}", agent_config.model_providers.len(), agent_config.config_models.len());
    if agent_config.model_providers.is_empty() && agent_config.config_models.is_empty() {"""

if target in content:
    content = content.replace(target, replacement)
    open('crates/codegen/xai-hystersis-pager-bin/src/main.rs', 'w').write(content)
    print("Patched main.rs successfully!")
else:
    print("Could not find target in main.rs")
