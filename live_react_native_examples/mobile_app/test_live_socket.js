const WebSocket = require('ws');

console.log('🧪 Testing regular /live socket with session...');

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
  console.log('✅ Regular /live socket connected!');

  // Use the correct topic format with proper session
  const joinMsg = [
    "1",    // join_ref
    "1",    // msg_ref
    "lv:/live/counter",  // topic with lv: prefix for LiveView
    "phx_join",          // event
    {
      session: "SFMyNTY.g3QAAAABbQAAAAtfY3NyZl90b2tlbm0AAAAYbW9iaWxlLWFwcC1jc3JmLXRva2Vu.signature",
      static: "",
      url: "http://localhost:4000/live/counter",
      params: {},
      _mounts: 0
    }
  ];

  console.log('🚀 Sending join to /live socket:', JSON.stringify(joinMsg));
  ws.send(JSON.stringify(joinMsg));
});

ws.on('message', function message(data) {
  responseReceived = true;
  clearTimeout(timeout);

  console.log('📨 Received from /live:', data.toString());

  try {
    const msg = JSON.parse(data.toString());

    if (Array.isArray(msg) && msg[3] === 'phx_reply') {
      const payload = msg[4];
      console.log('📋 /live socket status:', payload.status);

      if (payload.status === 'ok') {
        console.log('🎉 SUCCESS! /live socket works!');
        console.log('✅ LiveView mounted successfully!');
        console.log('✅ Initial assigns:', JSON.stringify(payload.response, null, 2));

        // Test increment event
        const eventMsg = [
          "1",    // join_ref
          "2",    // msg_ref
          "lv:/live/counter",  // topic
          "event",             // event type
          {
            type: "increment",
            event: "increment",
            value: {}
          }
        ];

        console.log('🚀 Sending increment event...');
        ws.send(JSON.stringify(eventMsg));

      } else {
        console.error('❌ /live socket join error:', payload.response);
        ws.close();
        process.exit(1);
      }
    } else if (Array.isArray(msg) && msg[1] === '2') {
      console.log('✅ Event response:', JSON.stringify(msg[4], null, 2));
      console.log('🎉 COMPLETE SUCCESS! LiveView + Events working!');
      ws.close();
      process.exit(0);
    }
  } catch (e) {
    console.error('❌ Error parsing message:', e);
  }
});

ws.on('error', function error(err) {
  console.error('❌ /live socket error:', err);
  clearTimeout(timeout);
  process.exit(1);
});

ws.on('close', function close(code, reason) {
  console.log(`🔌 /live socket disconnected - Code: ${code}, Reason: ${reason.toString()}`);
  clearTimeout(timeout);
});