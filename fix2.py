with open('crates/codegen/xai-hystersis-pager/src/app/event_loop.rs', 'r') as f:
    content = f.read()
content = content.replace('let needs_interactive_login = false;', 'let needs_interactive_login = connection.needs_login || force_login;')
with open('crates/codegen/xai-hystersis-pager/src/app/event_loop.rs', 'w') as f:
    f.write(content)
