const http = require('http');
const path = require('path');
const fs = require('fs');

// Configuration
const PARTNER_NAME = 'Adeeva';
const CONFIG_PATH = path.resolve('partner-config', 'adeeva.json');
const API_BASE = 'http://localhost:8080';

// Check if config exists
if (!fs.existsSync(CONFIG_PATH)) {
  console.error(`❌ Error: Config file not found at ${CONFIG_PATH}`);
  process.exit(1);
}

// Load config
const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));

// API Helper
async function apiRequest(method, endpoint, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 8080,
      path: `/api${endpoint}`,
      method,
      headers: {
        'Content-Type': 'application/json',
      },
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

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function activatePartner() {
  try {
    console.log('🔍 Activating partner:', PARTNER_NAME);
    
    // 1. Check if partner exists
    const checkResponse = await apiRequest('GET', `/partner/${config.partner_id}`);
    
    if (checkResponse.status === 200) {
      console.log('✅ Partner already exists');
    } else if (checkResponse.status === 404) {
      // 2. Create partner if doesn't exist
      console.log('Creating new partner...');
      const createResponse = await apiRequest('POST', '/partner', {
        ...config,
        active: true
      });
      
      if (createResponse.status !== 200 && createResponse.status !== 201) {
        throw new Error(`Failed to create partner: ${JSON.stringify(createResponse.data)}`);
      }
      console.log('✅ Partner created and activated');
    } else {
      throw new Error(`Unexpected status: ${checkResponse.status}`);
    }
    
    // 3. Activate campaigns
    if (config.campaigns && config.campaigns.length > 0) {
      console.log('\n🎯 Activating campaigns:');
      for (const campaign of config.campaigns) {
        try {
          const campaignResponse = await apiRequest(
            'PUT',
            `/campaign/${campaign.campaign_id}/activate`,
            { active: true }
          );
          
          if (campaignResponse.status === 200) {
            console.log(`✅ Activated campaign: ${campaign.campaign_id}`);
          } else {
            console.warn(`⚠️  Could not activate campaign ${campaign.campaign_id} (${campaignResponse.status})`);
          }
        } catch (error) {
          console.error(`❌ Error with campaign ${campaign.campaign_id}:`, error.message);
        }
      }
    } else {
      console.log('\nℹ️  No campaigns found in config');
    }
    
    console.log('\n✨ Activation process completed!');
  } catch (error) {
    console.error('\n❌ Activation failed:', error.message);
    process.exit(1);
  }
}

// Start the process
activatePartner();
