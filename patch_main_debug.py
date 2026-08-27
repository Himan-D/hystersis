import sys

content = open('crates/codegen/xai-hystersis-pager-bin/src/main.rs', 'r').read()

target = r"""    let agent_config = xai_hystersis_shell::config::load_agent_config_disk_only().unwrap_or_default();"""
replacement = r"""    let agent_config = xai_hystersis_shell::config::load_agent_config_disk_only().unwrap_or_else(|e| {
        eprintln!("CONFIG LOAD ERROR: {}", e);
        Default::default()
    });"""

if target in content:
    content = content.replace(target, replacement)
    open('crates/codegen/xai-hystersis-pager-bin/src/main.rs', 'w').write(content)
    print("Patched main.rs successfully!")
else:
    print("Could not find target in main.rs")
