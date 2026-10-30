const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { ROOT, SERVICES, pythonPath, requireNode, configure } = require('./local-config.cjs');

function run(command, args, cwd = ROOT) {
    console.log(`\n[setup] ${path.relative(ROOT, cwd) || '.'}: ${command} ${args.join(' ')}`);
    const result = spawnSync(command, args, { cwd, stdio: 'inherit', windowsHide: true });
    if (result.error) throw result.error;
    if (result.status !== 0) throw new Error(`Command failed (${result.status}): ${command} ${args.join(' ')}`);
}
function npm(args, cwd = ROOT) {
    // Reuse npm's actual JS entry point; avoids Windows .cmd/shell quoting.
    if (!process.env.npm_execpath || !fs.existsSync(process.env.npm_execpath)) {
        throw new Error('Run setup using npm run setup, not node scripts/setup.cjs.');
    }
    run(process.execPath, [process.env.npm_execpath, ...args], cwd);
}
function findPython() {
    const candidates = process.platform === 'win32'
        ? [['py', ['-3.12']], ['py', ['-3']], ['python', []], ['python3', []]]
        : [['python3', []], ['python', []]];
    for (const [command, args] of candidates) {
        const check = spawnSync(command, [...args, '-c', 'import sys; print("%d.%d" % sys.version_info[:2]); sys.exit(0 if sys.version_info >= (3,12) else 1)'], { encoding: 'utf8', windowsHide: true });
        if (check.status === 0) return { command, args };
    }
    throw new Error('Python 3.12 or newer is required. Install it, enable pip/venv, and rerun npm run setup.');
}
try {
    requireNode();
    const python = findPython();
    const skipInstall = process.argv.includes('--skip-install');
    if (!skipInstall) {
        npm(['ci', '--no-audit', '--no-fund']);
        for (const service of SERVICES) npm(['ci', '--no-audit', '--no-fund'], path.join(ROOT, service));
    }
    const gateway = configure();
    const executable = pythonPath(ROOT);
    if (!fs.existsSync(executable)) run(python.command, [...python.args, '-m', 'venv', path.join(ROOT, 'ai/.venv')]);
    if (!skipInstall) run(executable, ['-m', 'pip', 'install', '--disable-pip-version-check', '-r', path.join(ROOT, 'ai/requirements.txt')]);
    for (const service of ['backend', 'iot']) npm(['run', 'build'], path.join(ROOT, service));
    console.log(`\nSetup complete. Run npm start.\nESP32 configuration: iot/esp32/config.h (${gateway.host}:${gateway.port}).\nExisting environment files and firmware credentials were preserved.`);
} catch (error) { console.error(`\nSetup failed: ${error.message}`); process.exitCode = 1; }
