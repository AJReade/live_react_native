const WebSocket = require('ws');

console.log('🧪 Testing regular /live WebSocket connection...');

// Try the regular socket with a proper session token
const ws = new WebSocket('ws://localhost:4000/live/websocket?vsn=2.0.0');

let responseReceived = false;

const timeout = setTimeout(() => {
  if (!responseReceived) {
    console.error('❌ No response received within 5 seconds');
    ws.close();
    process.exit(1);
  }
}, 5000);

ws.on('open', function open() {
  console.log('✅ Regular WebSocket connected successfully!');

  // Send join message for LiveView with a signed session token
  const joinMsg = {
    join_ref: '1',
    msg_ref: '1',
    topic: 'lv:/live/counter',
    event: 'phx_join',
    payload: {
      session: 'SFMyNTY.g3QAAAABbQAAAAtfY3NyZl90b2tlbm0AAAAYbW9iaWxlLWFwcC1jc3JmLXRva2Vu.9yKKK-pqfzPG7-gIf-hvLRu8p8sLaJNL9G5EjWQnBqg',
      static: '',
      url: 'http://localhost:4000/live/counter',
      params: {},
      _mounts: 0
    }
  };

  console.log('🚀 Sending join to regular socket:', JSON.stringify(joinMsg));
  ws.send(JSON.stringify(joinMsg));
});

ws.on('message', function message(data) {
  responseReceived = true;
  clearTimeout(timeout);

  console.log('📨 Regular socket received:', data.toString());
  const msg = JSON.parse(data.toString());

  if (msg.event === 'phx_reply') {
    console.log('📋 Regular socket reply status:', msg.payload.status);

    if (msg.payload.status === 'ok') {
      console.log('✅ Regular socket join successful!');
      console.log('✅ This proves LiveView works - issue is with mobile socket config');
      ws.close();
      process.exit(0);
    } else {
      console.error('❌ Regular socket join error:', msg.payload.response);
      ws.close();
      process.exit(1);
    }
  }
});

ws.on('error', function error(err) {
  console.error('❌ Regular socket error:', err);
  clearTimeout(timeout);
  process.exit(1);
});

ws.on('close', function close(code, reason) {
  console.log(`🔌 Regular socket disconnected - Code: ${code}, Reason: ${reason.toString()}`);
  clearTimeout(timeout);
  if (!responseReceived) {
    console.error('❌ Regular socket closed without response');
    process.exit(1);
  }
});