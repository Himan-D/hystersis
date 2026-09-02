// Resolution (bundled binary, RG_BIN_PATH, Bazel runfiles, PATH) lives in the
// hystersis-tools crate; this module only preserves the `crate::util::ripgrep` path.
pub use hystersis_tools::util::rg_path;
