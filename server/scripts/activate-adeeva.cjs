const http = require('http');
const path = require('path');
const fs = require('fs');

// Configuration
const CONFIG_PATH = path.resolve('partner-config', 'adeeva.json');
const API_PORT = process.env.PORT || 8080;

// Check if config exists
if (!fs.existsSync(CONFIG_PATH)) {
  console.error(`❌ Error: Config file not found at ${CONFIG_PATH}`);
  process.exit(1);
}

// Load config
const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));

// API Helper
async function importPartnerConfig() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(config);
    
    const options = {
      hostname: 'localhost',
      port: API_PORT,
      path: '/api/partner/config/import',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const response = data ? JSON.parse(data) : {};
          resolve({
            status: res.statusCode,
            data: response,
            headers: res.headers,
          });
        } catch (e) {
          console.error('Failed to parse response:', data);
          reject(new Error('Invalid JSON response'));
        }
      });
    });

    req.on('error', (error) => {
      console.error('Request failed:', error.message);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

async function activateAdeeva() {
  try {
    console.log('🔍 Activating Adeeva partner configuration...');
    
    // 1. Import partner config
    console.log('📤 Uploading partner configuration...');
    const response = await importPartnerConfig();
    
    if (response.status === 200) {
      console.log('✅ Successfully activated Adeeva partner configuration');
      console.log('   Partner:', response.data.partner);
      console.log('   Message:', response.data.message);
      
      if (config.campaigns && config.campaigns.length > 0) {
        console.log('\n🎯 Available campaigns:');
        config.campaigns.forEach((campaign, index) => {
          console.log(`   ${index + 1}. ${campaign.campaign_id} - ${campaign.description || 'No description'}`);
          console.log(`      Status: ${campaign.active ? 'Active' : 'Inactive'}`);
        });
      }
      
      console.log('\n✨ Activation process completed successfully!');
    } else {
      console.error('❌ Failed to activate configuration:', response.data?.error || 'Unknown error');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Activation failed:', error.message);
    console.error('\n💡 Make sure the server is running and accessible at http://localhost:8080');
    process.exit(1);
  }
}

// Start the process
activateAdeeva();
