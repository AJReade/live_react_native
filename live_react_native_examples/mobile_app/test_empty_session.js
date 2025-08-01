const WebSocket = require('ws');

console.log('🧪 Testing /live socket with empty session...');

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
  console.log('✅ /live socket connected!');

  // Try with minimal/empty session
  const joinMsg = [
    "1",    // join_ref
    "1",    // msg_ref
    "lv:/live/counter",  // topic
    "phx_join",          // event
    {
      session: "",       // Empty session
      static: "",
      url: "http://localhost:4000/live/counter",
      params: {},
      _mounts: 0
    }
  ];

  console.log('🚀 Sending join with empty session...');
  ws.send(JSON.stringify(joinMsg));
});

ws.on('message', function message(data) {
  responseReceived = true;
  clearTimeout(timeout);

  console.log('📨 Received:', data.toString());

  try {
    const msg = JSON.parse(data.toString());

    if (Array.isArray(msg) && msg[3] === 'phx_reply') {
      const payload = msg[4];
      console.log('📋 Status:', payload.status);

      if (payload.status === 'ok') {
        console.log('🎉 SUCCESS! Empty session works!');
        console.log('✅ LiveView response:', JSON.stringify(payload.response, null, 2));

        // Test event
        const eventMsg = [
          "1", "2", "lv:/live/counter", "event",
          { type: "increment", event: "increment", value: {} }
        ];

        console.log('🚀 Testing increment event...');
        ws.send(JSON.stringify(eventMsg));

      } else {
        console.log('❌ Empty session failed, trying no session...');
        ws.close();

        // Try with no session field at all
        setTimeout(() => {
          testNoSession();
        }, 1000);
      }
    } else if (Array.isArray(msg) && msg[1] === '2') {
      console.log('✅ Event worked!:', JSON.stringify(msg[4], null, 2));
      console.log('🎉 COMPLETE SUCCESS!');
      ws.close();
      process.exit(0);
    }
  } catch (e) {
    console.error('❌ Error:', e);
  }
});

ws.on('error', function error(err) {
  console.error('❌ Socket error:', err);
  clearTimeout(timeout);
  process.exit(1);
});

ws.on('close', function close(code, reason) {
  console.log(`🔌 Socket disconnected - Code: ${code}`);
  clearTimeout(timeout);
});

function testNoSession() {
  console.log('\n🧪 Testing with NO session field...');

  const ws2 = new WebSocket('ws://localhost:4000/live/websocket?vsn=2.0.0');

  ws2.on('open', function open() {
    console.log('✅ Connected for no-session test!');

    const joinMsg = [
      "1", "1", "lv:/live/counter", "phx_join",
      {
        static: "",
        url: "http://localhost:4000/live/counter",
        params: {},
        _mounts: 0
        // No session field at all
      }
    ];

    console.log('🚀 Sending join with NO session field...');
    ws2.send(JSON.stringify(joinMsg));
  });

  ws2.on('message', function message(data) {
    console.log('📨 No-session result:', data.toString());

    try {
      const msg = JSON.parse(data.toString());
      if (Array.isArray(msg) && msg[3] === 'phx_reply') {
        const payload = msg[4];
        console.log('📋 No-session status:', payload.status);

        if (payload.status === 'ok') {
          console.log('🎉 SUCCESS! No session works!');
        } else {
          console.log('❌ No session failed:', payload.response?.reason);
        }
      }
    } catch (e) {
      console.error('❌ Parse error:', e);
    }

    ws2.close();
    process.exit(payload.status === 'ok' ? 0 : 1);
  });

  ws2.on('error', (err) => {
    console.error('❌ No-session error:', err);
    process.exit(1);
  });
}