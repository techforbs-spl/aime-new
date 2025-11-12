const fs = require('fs');
const path = require('path');
const http = require('http');

const configPath = path.resolve('partner-config', 'adeeva-creators.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

function post(path, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: 'localhost',
        port: process.env.PORT || 8080,
        path,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      },
      res => {
        let out = '';
        res.on('data', d => (out += d));
        res.on('end', () => resolve({ status: res.statusCode, out }));
      }
    );
    req.on('error', reject);
    req.write(JSON.stringify(data));
    req.end();
  });
}

async function loadCreators() {
  try {
    console.log(`Loading ${config.creators.length} Adeeva creators...`);
    
    // Load each creator
    for (const creator of config.creators) {
      try {
        console.log(`Processing creator: ${creator.handle}...`);
        const result = await post('/api/partner/config/import', {
          partner: config.partner,
          type: 'creator',
          data: creator
        });
        
        if (result.status >= 200 && result.status < 300) {
          console.log(`✅ Loaded creator: ${creator.handle}`);
        } else {
          console.error(`❌ Failed to load creator ${creator.handle}:`, result.out);
        }
      } catch (err) {
        console.error(`❌ Error loading creator ${creator.handle}:`, err.message);
      }
    }
    
    console.log('\nAdeeva creators loading completed!');
  } catch (err) {
    console.error('Error in loadCreators:', err);
    process.exit(1);
  }
}

loadCreators();
