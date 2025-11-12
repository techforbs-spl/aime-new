const http = require('http');

const API_PORT = process.env.PORT || 8080;

// Test cases
const testSignals = [
  {
    name: 'Basic Signal',
    data: { keyword: 'supplements' }
  },
  {
    name: 'Product Mention',
    data: {
      keyword: 'probiotics',
      context: 'Looking for the best probiotic for gut health'
    }
  },
  {
    name: 'Practitioner Context',
    data: {
      keyword: 'clinical',
      context: 'As a healthcare provider, I recommend...',
      userType: 'practitioner'
    }
  },
  {
    name: 'Lifestyle Context',
    data: {
      keyword: 'wellness',
      context: 'My daily wellness routine includes...',
      userType: 'lifestyle'
    }
  },
  {
    name: 'Complex Query',
    data: {
      keyword: 'immunity',
      context: 'What are the best supplements for immune support during winter?',
      userType: 'consumer'
    }
  }
];

// API Helper
async function sendSignal(signalData) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(signalData);
    
    const options = {
      hostname: 'localhost',
      port: API_PORT,
      path: '/api/signal/simulate',
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

async function runTests() {
  console.log('🚀 Starting Signal → Comment Loop Tests\n');
  
  for (const test of testSignals) {
    try {
      console.log(`🔍 [${test.name}]`);
      console.log('   Input:', JSON.stringify(test.data, null, 2));
      
      const startTime = Date.now();
      const result = await sendSignal(test.data);
      const responseTime = Date.now() - startTime;
      
      console.log('   Status:', result.status);
      console.log('   Response Time:', `${responseTime}ms`);
      console.log('   Output:', JSON.stringify(result.data, null, 2));
      console.log('   ' + '─'.repeat(50));
    } catch (error) {
      console.error(`❌ Test failed (${test.name}):`, error.message);
    }
  }
  
  console.log('\n✨ Test sequence completed');
}

// Run the tests
runTests().catch(console.error);
