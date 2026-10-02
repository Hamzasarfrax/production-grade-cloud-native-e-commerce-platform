import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { execSync } from 'child_process';
import net from 'net';
import path from 'path';
import {defineConfig} from 'vite';

/**
 * Probe whether a host:port is accepting connections.
 */
function isReachable(host: string, port: number, timeoutMs = 1200): Promise<boolean> {
  return new Promise((resolve) => {
    const sock = new net.Socket();
    sock.setTimeout(timeoutMs);
    sock.once('connect', () => {
      sock.destroy();
      resolve(true);
    });
    sock.once('error', () => resolve(false));
    sock.once('timeout', () => {
      sock.destroy();
      resolve(false);
    });
    sock.connect(port, host);
  });
}

/**
 * Find the Laravel backend for the dev proxy.
 * Order of preference:
 *   1. VITE_PROXY_TARGET env (e.g. Docker: http://api:8000)
 *   2. http://localhost:8000 (backend running in this same WSL/container)
 *   3. http://<Windows-host-ip>:8000 (backend running on the Windows host,
 *      typical when running `php artisan serve` on the host and Vite inside WSL)
 */
async function resolveProxyTarget(): Promise<string> {
  const explicit = process.env.VITE_PROXY_TARGET;
  if (explicit) {
    return explicit;
  }

  // 127.0.0.1 on purpose: `localhost` may resolve to ::1 (IPv6) first,
  // but `php artisan serve` binds IPv4 only -> proxy would 404/504.
  if (await isReachable('127.0.0.1', 8000)) {
    return 'http://127.0.0.1:8000';
  }

  try {
    const gateway = execSync("ip route 2>/dev/null | awk '/default/ {print $3}'", {encoding: 'utf8'}).trim();
    if (gateway && await isReachable(gateway, 8000)) {
      return `http://${gateway}:8000`;
    }
  } catch {
    // not on Linux/WSL — ignore
  }

  return 'http://127.0.0.1:8000';
}

export default defineConfig(async () => {
  const apiTarget = await resolveProxyTarget();

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâ file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      port: 3000,
      // Proxy API calls to the Laravel backend (microservice on :8000).
      // Auto-detects localhost -> Windows host IP so the app connects either way.
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
  };
});