// Router Plus 文档站的 Pages 发布脚本：构建站点、打包 dist、经 scp 上传后由远端脚本校验替换。
// 主机、站点名与 SSH 身份来自本机发布配置；上传路径在此生成，失败时只清理自己的临时包。
import { spawnSync } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { existsSync, lstatSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const app = fileURLToPath(new URL('../', import.meta.url));
const root = fileURLToPath(new URL('../../../', import.meta.url));
const configPath = join(root, '.local/pages/router-plus-docs.json');

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { cwd: root, stdio: 'inherit', ...options });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} failed (${result.signal || result.status})`);
}

function manifest(directory, prefix = '') {
  return Object.fromEntries(
    readdirSync(directory).flatMap((name) => {
      const path = join(directory, name),
        relative = prefix + name,
        stat = lstatSync(path);
      if (stat.isDirectory()) return Object.entries(manifest(path, relative + '/'));
      if (!stat.isFile()) throw new Error(`Unsupported build entry: ${relative}`);
      return [[relative, createHash('sha256').update(readFileSync(path)).digest('hex')]];
    }),
  );
}

function deploy() {
  if (!existsSync(configPath))
    throw new Error(`Create ${configPath} from scripts/deploy.config.example.json.`);
  const config = JSON.parse(readFileSync(configPath, 'utf8'));
  if (config.site !== 'router-plus-docs') throw new Error('Invalid Pages site name');
  if (!/^[a-z_][a-z0-9_-]*@[a-z0-9][a-z0-9.-]*$/i.test(config.host))
    throw new Error('Invalid SSH host');
  if (!config.pagesRoot.startsWith('/') || !existsSync(config.identity))
    throw new Error('Check Pages path and SSH identity in the local deployment configuration');
  const sshOptions = [
    '-i',
    config.identity,
    '-o',
    'IdentitiesOnly=yes',
    '-o',
    'BatchMode=yes',
    '-o',
    'ConnectTimeout=10',
  ];
  const temporary = mkdtempSync(join(tmpdir(), 'router-plus-docs-pages-'));
  const upload = `/tmp/router-plus-docs-${randomUUID()}.tgz`;
  let uploaded = false;
  try {
    run('npm', ['run', 'build', '--workspace', '@jangts/router-plus-docs']);
    const dist = join(app, 'dist'),
      files = manifest(dist);
    if (!files['index.html']) throw new Error('Build has no index.html');
    const archive = join(temporary, 'site.tgz');
    run('tar', ['-czf', archive, '-C', dist, '.']);
    uploaded = true;
    run('scp', [...sshOptions, archive, `${config.host}:${upload}`]);
    const payload = Buffer.from(
      JSON.stringify({
        ...config,
        upload,
        files,
        digest: createHash('sha256').update(readFileSync(archive)).digest('hex'),
      }),
    ).toString('base64');
    const script =
      `import base64, json\nCONFIG = json.loads(base64.b64decode('${payload}'))\n` +
      readFileSync(new URL('./deploy-remote.py', import.meta.url), 'utf8');
    run('ssh', [...sshOptions, config.host, 'sudo python3 -'], {
      input: script,
      stdio: ['pipe', 'inherit', 'inherit'],
    });
    uploaded = false;
    console.log(
      `Published ${config.site}.pages.jangts.cafe`,
    );
  } finally {
    if (uploaded) {
      // The path is generated above, never supplied by the caller.
      const cleanup = spawnSync('ssh', [...sshOptions, config.host, `sudo rm -f -- ${upload}`], {
        stdio: 'inherit',
      });
      if (cleanup.error || cleanup.status !== 0)
        console.error(`Remove temporary upload manually: ${upload}`);
    }
    rmSync(temporary, { recursive: true, force: true });
  }
}

if (process.argv.includes('--help')) {
  console.log(
    'Usage: npm run deploy --workspace @jangts/router-plus-docs\nBuild the Router Plus docs site, pack dist, upload with scp, verify and replace this Pages site over SSH.\nTarget and identity path: .local/pages/router-plus-docs.json. No NPM or certificate changes.',
  );
} else if (process.argv.length > 2) {
  console.error('Unknown arguments; use --help.');
  process.exitCode = 1;
} else {
  try {
    deploy();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
