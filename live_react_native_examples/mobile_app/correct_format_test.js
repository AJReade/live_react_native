const WebSocket = require('ws');

console.log('🧪 Testing correct Phoenix LiveView message format...');

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
  console.log('✅ WebSocket connected successfully!');

  // Correct Phoenix LiveView join format - remove the "lv:" prefix
  const joinMsg = [
    "1",    // join_ref
    "1",    // msg_ref
    "/live/counter",  // topic (without lv: prefix)
    "phx_join",       // event
    {
      url: "http://localhost:4000/live/counter",
      params: {},
      session: {},
      static: ""
    }
  ];

  console.log('🚀 Sending correct format join:', JSON.stringify(joinMsg));
  ws.send(JSON.stringify(joinMsg));
});

ws.on('message', function message(data) {
  responseReceived = true;
  clearTimeout(timeout);

  console.log('📨 Received:', data.toString());

  try {
    const msg = JSON.parse(data.toString());
    console.log('📨 Parsed message:', JSON.stringify(msg, null, 2));

    // Phoenix sends array format: [join_ref, msg_ref, topic, event, payload]
    if (Array.isArray(msg) && msg[3] === 'phx_reply') {
      const [join_ref, msg_ref, topic, event, payload] = msg;
      console.log('📋 Reply status:', payload.status);

      if (payload.status === 'ok') {
        console.log('✅ Join successful!');
        console.log('✅ LiveView response:', JSON.stringify(payload.response, null, 2));

        // Send increment event in correct format
        const eventMsg = [
          "1",    // join_ref
          "2",    // msg_ref
          "/live/counter",  // topic
          "event",          // event type
          {
            type: "increment",
            event: "increment",
            value: {}
          }
        ];

        console.log('🚀 Sending increment event:', JSON.stringify(eventMsg));
        ws.send(JSON.stringify(eventMsg));
      } else {
        console.error('❌ Join error:', payload);
        ws.close();
        process.exit(1);
      }
    } else if (Array.isArray(msg) && msg[1] === '2') {
      console.log('✅ Event response:', JSON.stringify(msg[4], null, 2));
      console.log('🎉 All tests passed! LiveView is working!');
      ws.close();
      process.exit(0);
    }
  } catch (e) {
    console.error('❌ Error parsing message:', e);
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
    console.error('❌ Connection closed without response');
    process.exit(1);
  }
});