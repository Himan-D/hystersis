//! `/hystersis` -- activate hystersis mode!
use crate::slash::command::{CommandExecCtx, CommandResult, SlashCommand};

/// Prints a fun hystersis message.
pub struct HystersisCommand;

impl SlashCommand for HystersisCommand {
    fn name(&self) -> &str {
        "hystersis"
    }

    fn description(&self) -> &str {
        "Activate hystersis mode"
    }

    fn usage(&self) -> &str {
        "/hystersis"
    }

    fn run(&self, _ctx: &mut CommandExecCtx, _args: &str) -> CommandResult {
        CommandResult::Message("🚀 Hystersis mode activated! We are floating now. 🌌".to_string())
    }
}
