const { io } = require('socket.io-client');

console.log('🧪 Testing WebSocket connection through API Gateway...');

// Test connection through the gateway (port 3000)
const socket = io('http://localhost:3000/messaging', {
  auth: {
    token: 'mock-token',
  },
  transports: ['websocket', 'polling'],
  timeout: 30000,
  forceNew: true,
  reconnection: true,
  reconnectionAttempts: 3,
  reconnectionDelay: 1000,
});

socket.on('connect', () => {
  console.log('✅ WebSocket connected successfully through gateway!');
  console.log('🔍 Socket ID:', socket.id);
  console.log('🔍 Transport:', socket.io.engine.transport.name);
  console.log('🔍 Namespace:', socket.nsp.name);
  
  // Test sending a message
  socket.emit('joinConversation', { conversationId: 'test-conversation' });
  
  setTimeout(() => {
    console.log('🧪 Test completed, disconnecting...');
    socket.disconnect();
    process.exit(0);
  }, 2000);
});

socket.on('connect_error', (error) => {
  console.error('❌ WebSocket connection error:', error);
  console.error('🔍 Error details:', {
    message: error.message,
    description: error.description,
    context: error.context,
    type: error.type
  });
  process.exit(1);
});

socket.on('disconnect', (reason) => {
  console.log('❌ WebSocket disconnected:', reason);
});

socket.on('reconnect', (attemptNumber) => {
  console.log(`🔄 WebSocket reconnected after ${attemptNumber} attempts`);
});

// Timeout after 15 seconds
setTimeout(() => {
  console.error('❌ Connection timeout after 15 seconds');
  process.exit(1);
}, 15000);
