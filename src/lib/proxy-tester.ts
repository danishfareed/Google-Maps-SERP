import http from 'http';

export interface ProxyTestResult {
    success: boolean;
    latency?: number;
    error?: string;
}

export async function checkProxy(
    host: string,
    port: number,
    username?: string,
    password?: string
): Promise<ProxyTestResult> {
    const start = Date.now();

    return new Promise((resolve) => {
        // Use a simple HTTP check to a reliable endpoint
        // For HTTP proxies, we can pass the full URL as the path
        const options: any = {
            host: host,
            port: port,
            path: 'http://www.google.com/generate_204',
            headers: {
                'Host': 'www.google.com',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            timeout: 5000 // 5 seconds timeout
        };

        if (username && password) {
            const auth = 'Basic ' + Buffer.from(username + ':' + password).toString('base64');
            options.headers['Proxy-Authorization'] = auth;
        }

        const req = http.get(options, (res) => {
            const latency = Date.now() - start;

            // Google's generate_204 returns 204 No Content
            if (res.statusCode === 204 || (res.statusCode && res.statusCode >= 200 && res.statusCode < 400)) {
                resolve({ success: true, latency });
            } else {
                resolve({ success: false, error: `HTTP ${res.statusCode}`, latency });
            }
            res.resume(); // Consume response data to free up memory
        });

        req.on('error', (err) => {
            resolve({ success: false, error: err.message });
        });

        req.on('timeout', () => {
            req.destroy();
            resolve({ success: false, error: 'TIMEOUT' });
        });
    });
}

/**
 * Validates a batch of proxies with controlled concurrency
 */
export async function validateProxyBatch(proxies: any[], concurrency: number = 10): Promise<any[]> {
    const results = [];
    const queue = [...proxies];

    async function worker() {
        while (queue.length > 0) {
            const proxy = queue.shift();
            if (!proxy) continue;

            const result = await checkProxy(proxy.host, proxy.port, proxy.username, proxy.password);
            results.push({
                id: proxy.id,
                host: proxy.host,
                port: proxy.port,
                ...result
            });
        }
    }

    const workers = Array(Math.min(concurrency, proxies.length)).fill(null).map(worker);
    await Promise.all(workers);

    return results;
}
