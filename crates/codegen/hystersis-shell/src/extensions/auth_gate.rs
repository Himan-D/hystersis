use agent_client_protocol as acp;

use crate::auth::{AuthManager, HystersisAuth};

/// Require xAI auth from a sync context, accepting tokens in the client-side buffer window.
pub(crate) fn require_hystersis_auth(
    auth_manager: &AuthManager,
    missing_message: &'static str,
    non_hystersis_message: &'static str,
) -> Result<HystersisAuth, acp::Error> {
    let auth = auth_manager
        .current_or_expired()
        .ok_or_else(|| acp::Error::auth_required().data(missing_message))?;
    if !auth.is_hystersis_auth() {
        return Err(acp::Error::auth_required().data(non_hystersis_message));
    }
    Ok(auth)
}
