const WebSocket = require('ws');

console.log('🧪 Testing mobile socket without session validation...');

const ws = new WebSocket('ws://localhost:4000/mobile/websocket?vsn=2.0.0');

let responseReceived = false;

const timeout = setTimeout(() => {
  if (!responseReceived) {
    console.error('❌ No response received within 5 seconds');
    ws.close();
    process.exit(1);
  }
}, 5000);

ws.on('open', function open() {
  console.log('✅ Mobile socket connected!');

  // Test mobile socket with NO session (should work)
  const joinMsg = [
    "1",                    // join_ref
    "1",                    // msg_ref
    "lv:/live/counter",     // topic
    "phx_join",             // event
    {
      session: "",          // Empty session (mobile socket shouldn't require it)
      static: "",
      url: "http://localhost:4000/live/counter",
      params: {},
      _mounts: 0
    }
  ];

  console.log('🚀 Sending join to mobile socket (no session required)...');
  ws.send(JSON.stringify(joinMsg));
});

ws.on('message', function message(data) {
  responseReceived = true;
  clearTimeout(timeout);

  console.log('📨 Mobile socket response:', data.toString());

  try {
    const msg = JSON.parse(data.toString());

    if (Array.isArray(msg) && msg[3] === 'phx_reply') {
      const payload = msg[4];
      console.log('📋 Mobile socket status:', payload.status);

      if (payload.status === 'ok') {
        console.log('🎉 SUCCESS! Mobile socket works without sessions!');
        console.log('✅ Response:', JSON.stringify(payload.response?.assigns, null, 2));
        console.log('🎯 Mobile app should now work perfectly!');

        // Test event
        const eventMsg = [
          "1", "2", "lv:/live/counter", "event",
          { type: "increment", event: "increment", value: {} }
        ];

        console.log('🚀 Testing increment event...');
        ws.send(JSON.stringify(eventMsg));

      } else {
        console.error('❌ Mobile socket failed:', payload.response);
        console.log('❓ Reason:', payload.response?.reason);

        if (payload.response?.reason === 'unmatched topic') {
          console.log('🔍 Mobile socket can\'t find LiveView routes');
          console.log('🔍 Need to configure routing for mobile socket');
        } else if (payload.response?.reason === 'stale') {
          console.log('🔍 Mobile socket still requires sessions');
          console.log('🔍 Need to configure socket differently');
        }

        ws.close();
        process.exit(1);
      }
    } else if (Array.isArray(msg) && msg[1] === '2') {
      console.log('✅ Event response:', JSON.stringify(msg[4], null, 2));
      console.log('🎉 MOBILE SOCKET COMPLETE SUCCESS!');
      console.log('🎯 The mobile app will now work!');
      ws.close();
      process.exit(0);
    }
  } catch (e) {
    console.error('❌ Parse error:', e);
    ws.close();
    process.exit(1);
  }
});

ws.on('error', function error(err) {
  console.error('❌ Mobile socket error:', err);
  clearTimeout(timeout);
  process.exit(1);
});

ws.on('close', function close(code, reason) {
  console.log(`🔌 Mobile socket closed - Code: ${code}`);
  clearTimeout(timeout);
});