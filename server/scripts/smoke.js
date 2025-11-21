import http from 'http'; 

function req(path, method = 'GET', data = null) { 
    return new Promise((resolve, reject) => { 
        const body = data 
        ? JSON.stringify(data) 
        : null; 
        const r = http.request({ 
            hostname: 'localhost', 
            port: process.env.PORT || 8080, 
            path, 
            method, 
            headers: { 'Content-Type': 'application/json' } 
        }, res => { 
            let s = ''; 
            res.on('data', d => s += d); 
            res.on('end', () => resolve({ status: res.statusCode, body: s })); 
        }); 
        r.on('error', reject); 
        if (body) r.write(body); 
        r.end(); 
    }); 
} 

const run = async () => { 
    const health = await req('/api/health'); 
    const smoke = await req('/api/smoke/core', 'POST', {}); 
    console.log('HEALTH', health.status, health.body); 
    console.log('SMOKE ', smoke.status, smoke.body); 
    process.exit(0); 
};
 
run();
