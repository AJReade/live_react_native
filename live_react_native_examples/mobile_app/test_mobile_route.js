const WebSocket = require('ws');

console.log('🧪 Testing mobile-specific LiveView route...');

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
  console.log('✅ Connected to test mobile route!');

  // Test the mobile-specific route
  const joinMsg = [
    "1",    // join_ref
    "1",    // msg_ref
    "lv:/mobile/counter",  // Mobile-specific topic
    "phx_join",            // event
    {
      session: "",  // Empty session should work for mobile route
      static: "",
      url: "http://localhost:4000/mobile/counter",
      params: {},
      _mounts: 0
    }
  ];

  console.log('🚀 Sending join to mobile route...');
  ws.send(JSON.stringify(joinMsg));
});

ws.on('message', function message(data) {
  responseReceived = true;
  clearTimeout(timeout);

  console.log('📨 Mobile route response:', data.toString());

  try {
    const msg = JSON.parse(data.toString());

    if (Array.isArray(msg) && msg[3] === 'phx_reply') {
      const payload = msg[4];
      console.log('📋 Mobile route status:', payload.status);

      if (payload.status === 'ok') {
        console.log('🎉 SUCCESS! Mobile route works!');
        console.log('✅ Mobile LiveView mounted!');
        console.log('✅ Initial count:', payload.response?.assigns?.count);

        // Test increment event
        const eventMsg = [
          "1", "2", "lv:/mobile/counter", "event",
          { type: "increment", event: "increment", value: {} }
        ];

        console.log('🚀 Testing mobile increment...');
        ws.send(JSON.stringify(eventMsg));

      } else {
        console.error('❌ Mobile route failed:', payload.response);
        ws.close();
        process.exit(1);
      }
    } else if (Array.isArray(msg) && msg[1] === '2') {
      const eventResponse = msg[4];
      console.log('✅ Mobile event response:', JSON.stringify(eventResponse, null, 2));
      console.log('🎉 MOBILE LIVEVIEW WORKING PERFECTLY!');
      console.log('🎯 Ready to fix the React Native app!');
      ws.close();
      process.exit(0);
    }
  } catch (e) {
    console.error('❌ Error parsing mobile response:', e);
    ws.close();
    process.exit(1);
  }
});

ws.on('error', function error(err) {
  console.error('❌ Mobile route error:', err);
  clearTimeout(timeout);
  process.exit(1);
});

ws.on('close', function close(code, reason) {
  console.log(`🔌 Mobile route disconnected - Code: ${code}`);
  clearTimeout(timeout);
});