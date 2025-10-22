const path = require('path');
const { spawn } = require('child_process');
const request = require('supertest');

const baseUrl = 'http://localhost:3000';
let serverProcess;

function waitForOutput(proc, regex, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const onData = (data) => {
      const text = data.toString();
      if (regex.test(text)) {
        cleanup();
        resolve();
      }
    };
    const onExit = (code) => {
      cleanup();
      reject(new Error(`Server process exited prematurely with code ${code}`));
    };
    const cleanup = () => {
      clearTimeout(timer);
      proc.stdout.off('data', onData);
      proc.stderr.off('data', onData);
      proc.off('exit', onExit);
    };
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error('Server did not start in time'));
    }, timeout);

    proc.stdout.on('data', onData);
    proc.stderr.on('data', onData);
    proc.on('exit', onExit);
  });
}

beforeAll(async () => {
  serverProcess = spawn('node', ['server.js'], {
    cwd: path.join(__dirname, '..'),
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, PORT: '3000' },
  });
  await waitForOutput(serverProcess, /App listening at http:\/\/localhost:3000/);
}, 20000);

afterAll(async () => {
  if (serverProcess && !serverProcess.killed) {
    serverProcess.kill('SIGTERM');
  }
});

describe('/unsafe-route', () => {
  test('returns text/plain with sanitized echo', async () => {
    const res = await request(baseUrl)
      .get('/unsafe-route')
      .query({ cmd: 'hello' });

    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/plain/);
    expect(res.text).toBe('Résultat: hello');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  test('removes non-printable characters and truncates to 200 chars', async () => {
    const withNonPrintable = 'a\u0000b\u0007c';
    const res1 = await request(baseUrl)
      .get('/unsafe-route')
      .query({ cmd: withNonPrintable });
    expect(res1.text).toBe('Résultat: abc');

    const longInput = 'x'.repeat(250);
    const res2 = await request(baseUrl)
      .get('/unsafe-route')
      .query({ cmd: longInput });

    const prefix = 'Résultat: ';
    expect(res2.text.startsWith(prefix)).toBe(true);
    const echoed = res2.text.slice(prefix.length);
    expect(echoed.length).toBe(200);
  });

  test('returns literal HTML in plain text (no HTML interpretation)', async () => {
    const payload = '<script>alert(1)</script>';
    const res = await request(baseUrl)
      .get('/unsafe-route')
      .query({ cmd: payload });

    expect(res.headers['content-type']).toMatch(/text\/plain/);
    expect(res.text).toBe(`Résultat: ${payload}`);
  });
});
