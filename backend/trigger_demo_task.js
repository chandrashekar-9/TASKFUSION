import http from 'http';

const API_PORT = 5000;
const API_HOST = 'localhost';

function request(method, path, body = null, token = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: API_HOST,
            port: API_PORT,
            path: '/api' + path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
        };

        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }

        if (body) {
            options.headers['Content-Length'] = Buffer.byteLength(body);
        }

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                try {
                    resolve({
                        status: res.statusCode,
                        body: data ? JSON.parse(data) : {}
                    });
                } catch (e) {
                    console.error("Failed to parse JSON for URL " + path + ":", data);
                    resolve({ status: res.statusCode, body: data });
                }
            });
        });

        req.on('error', (e) => {
            reject(e);
        });

        if (body) {
            req.write(body);
        }
        req.end();
    });
}

async function runDemo() {
    try {
        const email = `demo_${Date.now()}@test.com`;
        const password = 'password123';

        // Correct endpoint: /auth/signup, Correct field: name
        const registerBody = JSON.stringify({ name: 'DemoUser', email, password });

        console.log(`Registering user: ${email}`);
        let res = await request('POST', '/auth/signup', registerBody);

        let token = null;

        // Signup usually returns message, you need to login to get token
        // But some implementations return token on signup. Let's check.
        // authRoutes returns { message: "Signup successful" }
        // So we MUST login.

        console.log('Signup response:', res.status, res.body);

        console.log('Logging in...');
        const loginBody = JSON.stringify({ email, password });
        res = await request('POST', '/auth/login', loginBody);

        token = res.body.token;
        if (!token) {
            console.error('Failed to get token:', res.body);
            return;
        }
        console.log('Got token, triggering task...');

        // Trigger Task (Async)
        const taskBody = JSON.stringify({ prompt: 'Explain quantum computing in 5 words' });
        res = await request('POST', '/ai/generate-async', taskBody, token);

        console.log('Task Triggered. Status:', res.status, 'Result:', res.body);

        // Wait a bit to ensure async processing happens and logs are flushed
        await new Promise(r => setTimeout(r, 2000));

    } catch (error) {
        console.error('Error:', error);
    }
}

runDemo();
