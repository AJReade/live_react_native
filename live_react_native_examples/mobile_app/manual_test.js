// Polyfill WebSocket for Node.js
const WebSocket = require('ws');
global.WebSocket = WebSocket;

const { Socket } = require('phoenix');

console.log('🧪 Running manual WebSocket integration test...');

const socket = new Socket('ws://localhost:4000/mobile', {
  params: {},
  logger: (kind, msg, data) => {
    console.log(`[${kind}] ${msg}`, data);
  }
});

socket.onOpen(() => {
  console.log('✅ Connected to mobile socket');

  const channel = socket.channel('lv:/live/counter', {});

  channel.join()
    .receive('ok', (response) => {
      console.log('✅ Joined LiveView successfully!');
      console.log('Response:', JSON.stringify(response, null, 2));
      console.log('Initial count:', response.assigns?.count);

      // Test increment
      console.log('🚀 Sending increment event...');
      channel.push('event', {
        type: 'increment',
        event: 'increment',
        value: {}
      })
      .receive('ok', (response) => {
        console.log('✅ Increment success!');
        console.log('New count:', response.assigns?.count);
        socket.disconnect();
        console.log('🎉 All tests passed!');
        process.exit(0);
      })
      .receive('error', (error) => {
        console.error('❌ Increment error:', error);
        socket.disconnect();
        process.exit(1);
      });
    })
    .receive('error', (error) => {
      console.error('❌ Join error details:', error);
      socket.disconnect();
      process.exit(1);
    })
    .receive('timeout', () => {
      console.error('❌ Join timeout after 10 seconds');
      socket.disconnect();
      process.exit(1);
    });
});

socket.onError((error) => {
  console.error('❌ Connection error:', error);
  process.exit(1);
});

socket.onClose(() => {
  console.log('🔌 Socket disconnected');
});

console.log('🔌 Connecting to ws://localhost:4000/mobile...');
socket.connect();