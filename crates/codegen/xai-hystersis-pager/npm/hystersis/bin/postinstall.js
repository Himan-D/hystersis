#!/usr/bin/env node
// Runs once after npm install/update. Reads the hystersis binary from the
// matching per-platform optional dependency (@xai-official/hystersis-<platform>)
// and installs it to ~/.hystersis/bin/ using versioned filenames:
//
//   Unix:    hystersis-<version>  +  hystersis  (symlink)
//   Windows: hystersis-<version>.exe  +  hystersis.exe  (copy)
//
// Versioned files ensure running processes are never disrupted on macOS
// (replacing a binary that a running process has mmap'd causes SIGKILL
// because the kernel can no longer verify the code signature).
const path = require('path');
const fs = require('fs');
const os = require('os');
const zlib = require('zlib');
const { execSync } = require('child_process');
const TOML = require('@iarna/toml');

// $HYSTERSIS_HOME (else ~/.hystersis), matching the Rust hystersis_home() including its
// canonicalized-home default. Lets fleets relocate the binary off a slow $HOME
// (NFS); old code hardcoded os.homedir().
function defaultHystersisHome() {
    const home = os.homedir();
    try { return path.join(fs.realpathSync(home), '.hystersis'); } catch { return path.join(home, '.hystersis'); }
}
const HYSTERSIS_HOME = process.env.HYSTERSIS_HOME ?? defaultHystersisHome();
const CANONICAL_DIR = path.join(HYSTERSIS_HOME, 'bin');

const key = `${process.platform}-${process.arch}`;
const SUPPORTED = new Set([
    'darwin-arm64',
    'darwin-x64',
    'linux-x64',
    'linux-arm64',
    'win32-x64',
    'win32-arm64',
]);
if (!SUPPORTED.has(key)) {
    console.error(`@xai-official/hystersis: unsupported platform ${key}`);
    process.exit(0);
}

// Resolve the per-platform sibling package's directory. The matching
// optionalDependency is installed by npm based on `os`/`cpu` filters; the
// other five are silently skipped. If the matching one is missing, npm was
// likely invoked with --no-optional or the platform is unsupported.
function resolvePlatformPackageDir() {
    const platformPkg = `@xai-official/hystersis-${key}`;
    try {
        return path.dirname(require.resolve(`${platformPkg}/package.json`));
    } catch {
        return null;
    }
}

let version;
try { version = require('../package.json').version; } catch {}
if (!version) {
    console.error('@xai-official/hystersis: unable to determine version');
    process.exit(0);
}

const IS_WINDOWS = process.platform === 'win32';
const EXE = IS_WINDOWS ? '.exe' : '';

fs.mkdirSync(CANONICAL_DIR, { recursive: true });

function writeVendorBinary(brPath, rawPath, destPath) {
    const tmp = destPath + `.tmp.${process.pid}`;
    try {
        if (fs.existsSync(brPath)) {
            fs.writeFileSync(tmp, zlib.brotliDecompressSync(fs.readFileSync(brPath)));
        } else if (fs.existsSync(rawPath)) {
            fs.copyFileSync(rawPath, tmp);
        } else {
            return false;
        }
        if (!IS_WINDOWS) fs.chmodSync(tmp, 0o755);
        fs.renameSync(tmp, destPath);
        return true;
    } catch {
        return false;
    } finally {
        try { fs.unlinkSync(tmp); } catch {}
    }
}

function installBinary(binName, sourceDir, vendorSubpath) {
    const brPath = path.join(sourceDir, 'bin', vendorSubpath + '.br');
    const rawPath = path.join(sourceDir, 'bin', vendorSubpath);

    const versionedName = `${binName}-${version}${EXE}`;
    const versionedPath = path.join(CANONICAL_DIR, versionedName);
    const canonicalName = `${binName}${EXE}`;
    const canonicalPath = path.join(CANONICAL_DIR, canonicalName);

    // Skip if this exact version is already installed.
    if (!fs.existsSync(versionedPath) && !writeVendorBinary(brPath, rawPath, versionedPath)) {
        console.error(`@xai-official/hystersis: missing binary at ${brPath}`);
        return false;
    }

    if (IS_WINDOWS) {
        // Symlinks need elevation on Windows; copy instead. If the exe is
        // locked by a running process, rename it aside then retry.
        const oldPath = canonicalPath + '.old';
        try { fs.unlinkSync(oldPath); } catch {} // stale backup from prior update
        try {
            try { fs.unlinkSync(canonicalPath); } catch {}
            fs.copyFileSync(versionedPath, canonicalPath);
        } catch (e) {
            try {
                fs.renameSync(canonicalPath, oldPath);
                try {
                    fs.copyFileSync(versionedPath, canonicalPath);
                } catch (copyErr) {
                    // Rollback: restore the old binary so the install isn't broken.
                    try { fs.renameSync(oldPath, canonicalPath); } catch {}
                    throw copyErr;
                }
            } catch (e2) {
                console.error(`@xai-official/hystersis: failed to update ${canonicalPath}: ${e2.message}`);
                console.error('Close all running hystersis processes and try again.');
                return false;
            }
        }
    } else {
        // Atomic symlink swap.
        const tmpLink = canonicalPath + `.link.${process.pid}`;
        try { fs.unlinkSync(tmpLink); } catch {}
        fs.symlinkSync(versionedName, tmpLink);
        fs.renameSync(tmpLink, canonicalPath);
    }

    // Don't report a broken wire-up as success.
    if (!fs.existsSync(canonicalPath)) {
        console.error(`@xai-official/hystersis: ${canonicalName} did not resolve after install`);
        return false;
    }

    console.log(`${binName} ${version} installed to ${canonicalPath} -> ${versionedName}`);
    return true;
}

// Comparator: sort "<prefix>X.Y.Z" filenames by version, newest first.
function byVersionDescending(prefix) {
    return (a, b) => {
        const pa = a.slice(prefix.length).split('.').map(Number);
        const pb = b.slice(prefix.length).split('.').map(Number);
        for (let i = 0; i < 3; i++) {
            if ((pa[i] || 0) !== (pb[i] || 0)) return (pb[i] || 0) - (pa[i] || 0);
        }
        return 0;
    };
}

// Best-effort cleanup of old versioned binaries for a given binary name.
// Keeps the current version and the previous one (in case a process is still
// running the old binary and hasn't fully loaded all pages yet).
// Uses an exact prefix match + hyphen + digit to avoid hystersis-* matching hystersis-pager-*.
function cleanupOldVersions(binName) {
    try {
        const prefix = `${binName}-`;
        const currentVersioned = `${binName}-${version}${EXE}`;
        const entries = fs.readdirSync(CANONICAL_DIR);
        const versionedBinaries = entries
            .filter(e => {
                if (!e.startsWith(prefix)) return false;
                if (e.includes('.tmp.') || e.includes('.link.')) return false;
                if (e === currentVersioned) return false;
                const suffix = e.slice(prefix.length);
                return /^\d/.test(suffix);
            })
            .sort(byVersionDescending(prefix));
        for (const old of versionedBinaries.slice(1)) {
            try { fs.unlinkSync(path.join(CANONICAL_DIR, old)); } catch {}
        }
    } catch {}
}

const platformDir = resolvePlatformPackageDir();
if (!platformDir) {
    console.error(`@xai-official/hystersis: platform package @xai-official/hystersis-${key} not installed.`);
    console.error('  This usually means npm was invoked with --no-optional, or the install failed.');
    console.error('  Try: npm install -g @xai-official/hystersis');
    process.exit(0);
}

installBinary('hystersis', platformDir, `hystersis${EXE}`);
cleanupOldVersions('hystersis');
cleanupOldVersions('hystersis-pager');

// Write installer config
const configDir = HYSTERSIS_HOME;
const configPath = path.join(configDir, 'config.toml');
let obj = {};
try { obj = TOML.parse(fs.readFileSync(configPath, 'utf8')); } catch { }
obj.cli ??= {};
obj.cli.installer = 'npm';

// Persist the npm registry so `hystersis update` and the trampoline use the same one.
const npmRegistry = process.env.HYSTERSIS_NPM_REGISTRY
    || (() => {
        try {
            const resolved = execSync(
                'npm config get @xai-official:registry',
                { encoding: 'utf8', timeout: 5000 }
            ).trim();
            if (resolved && resolved !== 'undefined') return resolved;
        } catch {}
        return null;
    })();

if (npmRegistry) {
    obj.cli.npm_registry = npmRegistry;
}

fs.writeFileSync(configPath, TOML.stringify(obj), 'utf8');

// Shell completions: print setup hints (no silent shell config mutation).
// Set HYSTERSIS_INSTALL_COMPLETIONS=1 to auto-generate to ~/.hystersis/completions.
const HYSTERSIS_PATH = path.join(CANONICAL_DIR, `hystersis${EXE}`);
if (process.env.HYSTERSIS_INSTALL_COMPLETIONS === '1' && !IS_WINDOWS) {
    try {
        const { spawnSync } = require('child_process');
        const completionsDir = path.join(HYSTERSIS_HOME, 'completions');
        const bashPath = path.join(completionsDir, 'bash', 'hystersis.bash');
        const zshPath = path.join(completionsDir, 'zsh', '_hystersis');
        fs.mkdirSync(path.dirname(bashPath), { recursive: true });
        fs.mkdirSync(path.dirname(zshPath), { recursive: true });
        const bashRes = spawnSync(HYSTERSIS_PATH, ['completions', 'bash'], { encoding: 'utf8' });
        if (bashRes.status === 0) fs.writeFileSync(bashPath, bashRes.stdout);
        const zshRes = spawnSync(HYSTERSIS_PATH, ['completions', 'zsh'], { encoding: 'utf8' });
        if (zshRes.status === 0) fs.writeFileSync(zshPath, zshRes.stdout);
        console.log('Completions generated to ~/.hystersis/completions (bash/zsh)');
    } catch {}
} else if (!IS_WINDOWS) {
    console.log('Tip: hystersis completions bash > ~/.local/share/bash-completion/completions/hystersis');
    console.log('     hystersis completions zsh  > ~/.zsh/completions/_hystersis');
}
