//! `HYSTERSIS_HOME` override tests in an isolated binary so `hystersis_home()`'s
//! process-wide `OnceLock` initializes from the overridden env var.

use std::path::PathBuf;

#[test]
#[serial_test::serial(HYSTERSIS_HOME)]
fn hystersis_home_override_path_helpers() {
    let tmp = tempfile::tempdir().expect("tempdir");
    let hystersis_home = tmp.path().to_path_buf();
    unsafe {
        std::env::set_var("HYSTERSIS_HOME", &hystersis_home);
    }

    assert_eq!(
        hystersis_pager::util::pager_toml_path(),
        hystersis_home.join("pager.toml")
    );
    assert_eq!(
        hystersis_pager::util::display_hystersis_home_prefix(),
        "$HYSTERSIS_HOME"
    );
    assert_eq!(
        hystersis_pager::util::display_user_hystersis_path("config.toml"),
        "$HYSTERSIS_HOME/config.toml"
    );

    let memory_path = hystersis_home.join("memory/MEMORY.md");
    assert_eq!(
        hystersis_pager::util::abbreviate_path(&memory_path.display().to_string()),
        "$HYSTERSIS_HOME/memory/MEMORY.md"
    );

    // Copy-toast paths follow the same abbreviation convention, so a custom
    // $HYSTERSIS_HOME outside $HOME still displays short.
    assert_eq!(
        hystersis_pager::clipboard::display_copy_path(&hystersis_home.join("last-copy.txt")),
        "$HYSTERSIS_HOME/last-copy.txt"
    );

    assert!(hystersis_pager::util::is_under_user_hystersis_home(&memory_path));
    assert!(!hystersis_pager::util::is_under_user_hystersis_home(
        PathBuf::from("/tmp/other").as_path()
    ));
}

/// Isolated because `hystersis_home()`'s `OnceLock` is already initialized by the
/// time the shared lib-test binary reaches a case like this.
#[test]
#[serial_test::serial(HYSTERSIS_HOME)]
fn disk_usage_run_creates_no_hystersis_home() {
    let tmp = tempfile::tempdir().expect("tempdir");
    let ghost = tmp.path().join("ghost-home");
    unsafe {
        std::env::set_var("HYSTERSIS_HOME", &ghost);
    }

    for json in [false, true] {
        hystersis_pager::disk_usage_cmd::run(hystersis_pager::disk_usage_cmd::DiskUsageArgs { json })
            .expect("a missing home is not an error");
        assert!(
            !ghost.exists(),
            "hystersis du must not create the home it reports on (json={json})"
        );
    }
}
