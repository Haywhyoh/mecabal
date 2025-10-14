const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000';
const TOKEN = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhNGJhOTg4Ni1jZTMwLTQzZWEtOWFjMC03Y2E0NWU0NTU3MGYiLCJ1c2VySWQiOiJhNGJhOTg4Ni1jZTMwLTQzZWEtOWFjMC03Y2E0NWU0NTU3MGYiLCJlbWFpbCI6ImF5b0Bjb2RlbXlnaWcuY29tIiwicGhvbmVOdW1iZXIiOiIrMjM0ODE0MjM2NDQ3NCIsInNlc3Npb25JZCI6IjBhZGU0MmZiLWU3NzAtNGZkYS1hOGRkLTQ5YjdlMzc2NWQwNyIsInR5cGUiOiJhY2Nlc3MiLCJpYXQiOjE3NjAzODA5OTUsImV4cCI6MTc2MDQ2NzM5NX0.oE4O62WkJUlnBXkefWy3PxA1WAwM60HqCRjCs9CWE8w';

async function testAPI() {
  try {
    console.log('Testing API Gateway...');
    
    // Test basic health check
    const healthResponse = await axios.get(`${API_BASE_URL}/`);
    console.log('✅ Health check:', healthResponse.data);
    
    // Test posts endpoint
    const postsResponse = await axios.get(`${API_BASE_URL}/posts`, {
      headers: {
        'Authorization': TOKEN,
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ Posts endpoint:', postsResponse.status, postsResponse.data);
    
  } catch (error) {
    console.log('❌ Error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
  }
}

testAPI();
