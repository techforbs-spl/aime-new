import http from 'http';

// Set a timeout for all requests (5 seconds)
const REQUEST_TIMEOUT = 10000;

function req(path, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
        const body = data ? JSON.stringify(data) : null;
        
        const options = {
            hostname: 'localhost',
            port: process.env.PORT || 8080,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            timeout: REQUEST_TIMEOUT
        };

        console.log(`Making ${method} request to ${options.hostname}:${options.port}${path}`);

        const req = http.request(options, (res) => {
            let responseData = '';
            
            res.on('data', (chunk) => {
                responseData += chunk;
            });

            res.on('end', () => {
                console.log(`Response status: ${res.statusCode} ${res.statusMessage}`);
                try {
                    const jsonResponse = responseData ? JSON.parse(responseData) : {};
                    resolve({
                        status: res.statusCode,
                        headers: res.headers,
                        body: jsonResponse
                    });
                } catch (e) {
                    console.error('Error parsing JSON response:', e);
                    resolve({
                        status: res.statusCode,
                        body: responseData
                    });
                }
            });
        });

        req.on('error', (error) => {
            console.error('Request error:', error);
            reject(error);
        });

        req.on('timeout', () => {
            console.error('Request timed out');
            req.destroy(new Error('Request timeout'));
        });

        if (body) {
            req.write(body);
        }
        
        req.end();
    });
}

async function testEndpoint(path, method = 'GET', data = null) {
    try {
        console.log(`\n--- Testing ${method} ${path} ---`);
        const response = await req(path, method, data);
        console.log('Response:', JSON.stringify(response, null, 2));
        
        if (response.status >= 400) {
            console.error(`Error: Received status code ${response.status}`);
            return false;
        }
        
        return true;
    } catch (error) {
        console.error(`Test failed for ${method} ${path}:`, error);
        return false;
    }
}

async function runSmokeTests() {
    console.log('Starting smoke tests...');
    
    // Test health endpoint
    const healthTest = await testEndpoint('/api/health');
    if (!healthTest) {
        console.error('Health check failed');
        process.exit(1);
    }
    
    // Test core smoke endpoint
    const smokeTest = await testEndpoint('/api/smoke/core', 'POST', {});
    if (!smokeTest) {
        console.error('Smoke test failed');
        process.exit(1);
    }
    
    console.log('\nAll smoke tests passed!');
    process.exit(0);
}

// Set a global timeout for the entire test suite (30 seconds)
const GLOBAL_TIMEOUT = 30000;
const timeout = setTimeout(() => {
    console.error('Smoke tests timed out after', GLOBAL_TIMEOUT, 'ms');
    process.exit(1);
}, GLOBAL_TIMEOUT);

// Run the tests
runSmokeTests()
    .catch(error => {
        console.error('Unhandled error in smoke tests:', error);
        process.exit(1);
    })
    .finally(() => {
        clearTimeout(timeout);
    });
