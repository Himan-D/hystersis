with open('crates/codegen/xai-hystersis-pager/src/app/app_view.rs', 'r') as f:
    content = f.read()
content = content.replace('pub fn session_startup_allowed(pub fn session_startup_allowed(&self) -> bool {self) -> bool {\n        return matches!(self.auth_state, AuthState::Done)\n            && matches!(self.trust_state, TrustState::Done)\n            && matches!(self.consent_state, crate::app::consent::ConsentState::Done);\n        true', 'pub fn session_startup_allowed(&self) -> bool {\n        matches!(self.auth_state, AuthState::Done)')
content = content.replace('    pub fn ready_for_startup_typeahead(&self) -> bool {\n        true', '    pub fn ready_for_startup_typeahead(&self) -> bool {\n        matches!(self.auth_state, AuthState::Done)')
with open('crates/codegen/xai-hystersis-pager/src/app/app_view.rs', 'w') as f:
    f.write(content)
