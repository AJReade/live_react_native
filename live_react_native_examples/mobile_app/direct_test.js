const WebSocket = require('ws');

console.log('🧪 Testing direct WebSocket connection...');

const ws = new WebSocket('ws://localhost:4000/mobile/websocket');

let responseReceived = false;

// Timeout to catch if no response is received
const timeout = setTimeout(() => {
  if (!responseReceived) {
    console.error('❌ No response received within 5 seconds - server likely rejecting join');
    ws.close();
    process.exit(1);
  }
}, 5000);

ws.on('open', function open() {
  console.log('✅ WebSocket connected successfully!');

  // Send join message for LiveView with minimal session
  const joinMsg = {
    join_ref: '1',
    msg_ref: '1',
    topic: 'lv:/live/counter',
    event: 'phx_join',
    payload: {
      session: {},
      static: '',
      url: 'http://localhost:4000/live/counter',
      params: {},
      _mounts: 0
    }
  };

  console.log('🚀 Sending join message with session:', JSON.stringify(joinMsg));
  ws.send(JSON.stringify(joinMsg));
});

ws.on('message', function message(data) {
  responseReceived = true;
  clearTimeout(timeout);

  console.log('📨 Received:', data.toString());
  const msg = JSON.parse(data.toString());

  if (msg.event === 'phx_reply') {
    console.log('📋 Reply status:', msg.payload.status);
    console.log('📋 Reply response:', JSON.stringify(msg.payload.response, null, 2));

    if (msg.payload.status === 'ok') {
      console.log('✅ Join successful!');
      console.log('Initial assigns:', msg.payload.response?.assigns);

      // Send increment event
      const eventMsg = {
        join_ref: '1',
        msg_ref: '2',
        topic: 'lv:/live/counter',
        event: 'event',
        payload: {
          type: 'increment',
          event: 'increment',
          value: {}
        }
      };

      console.log('🚀 Sending increment event:', JSON.stringify(eventMsg));
      ws.send(JSON.stringify(eventMsg));
    } else if (msg.payload.status === 'error') {
      console.error('❌ Join error status:', msg.payload.status);
      console.error('❌ Join error response:', msg.payload.response);
      ws.close();
      process.exit(1);
    }
  } else if (msg.event === 'phx_reply' && msg.ref === '2') {
    console.log('✅ Event response:', JSON.stringify(msg.payload, null, 2));
    console.log('🎉 All tests passed!');
    ws.close();
    process.exit(0);
  } else {
    console.log('📨 Other message:', JSON.stringify(msg, null, 2));
  }
});

ws.on('error', function error(err) {
  console.error('❌ WebSocket error:', err);
  clearTimeout(timeout);
  process.exit(1);
});

ws.on('close', function close(code, reason) {
  console.log(`🔌 WebSocket disconnected - Code: ${code}, Reason: ${reason.toString()}`);
  clearTimeout(timeout);
  if (!responseReceived) {
    console.error('❌ Connection closed without receiving any response');
    process.exit(1);
  }
});