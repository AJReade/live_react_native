const WebSocket = require('ws');
const http = require('http');

console.log('🧪 Testing updated mobile app approach...');

async function testMobileAppApproach() {
  try {
    // STEP 1: Get session token (same as mobile app)
    console.log('🔄 Getting session token from /mobile/session...');

    const sessionResponse = await new Promise((resolve, reject) => {
      const req = http.request({
        hostname: 'localhost',
        port: 4000,
        path: '/mobile/session',
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        });
      });
      req.on('error', reject);
      req.end();
    });

    const sessionToken = sessionResponse.session_token;
    console.log('✅ Got session token:', sessionToken.substring(0, 50) + '...');

    // STEP 2: Connect with Phoenix.js approach (what our library uses)
    console.log('🔄 Testing Phoenix.js WebSocket connection...');

    // Simulate what Phoenix.js does with session in params
    const wsUrl = `ws://localhost:4000/live/websocket?vsn=2.0.0`;
    console.log('🔄 Connecting to:', wsUrl);

    const ws = new WebSocket(wsUrl);

    const timeout = setTimeout(() => {
      console.error('❌ Connection timeout');
      ws.close();
      process.exit(1);
    }, 10000);

    ws.on('open', function open() {
      console.log('✅ WebSocket connected!');
      console.log('🔄 Sending LiveView join with session...');

      // Send LiveView join with session (Phoenix.js format)
      const joinMsg = [
        "1",                    // join_ref
        "1",                    // msg_ref
        "lv:/live/counter",     // topic (with lv: prefix)
        "phx_join",             // event
        {
          session: sessionToken,  // Real session token
          static: "",
          url: "http://localhost:4000/live/counter",
          params: {},
          _mounts: 0
        }
      ];

      console.log('🚀 Sending join message...');
      ws.send(JSON.stringify(joinMsg));
    });

    ws.on('message', function message(data) {
      clearTimeout(timeout);

      console.log('📨 Received:', data.toString());

      try {
        const msg = JSON.parse(data.toString());

        if (Array.isArray(msg) && msg[3] === 'phx_reply') {
          const payload = msg[4];
          console.log('📋 Status:', payload.status);

          if (payload.status === 'ok') {
            console.log('🎉 SUCCESS! LiveView join worked!');
            console.log('✅ Response:', JSON.stringify(payload.response?.assigns, null, 2));

            // Test event
            const eventMsg = [
              "1", "2", "lv:/live/counter", "event",
              { type: "increment", event: "increment", value: {} }
            ];

            console.log('🚀 Testing increment event...');
            ws.send(JSON.stringify(eventMsg));

          } else {
            console.error('❌ Join failed:', payload.response);
            console.log('🔍 This tells us what the mobile app issue will be...');
            ws.close();
            process.exit(1);
          }
        } else if (Array.isArray(msg) && msg[1] === '2') {
          console.log('✅ Event response:', JSON.stringify(msg[4], null, 2));
          console.log('🎉 COMPLETE SUCCESS! Mobile app approach should work!');
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
      console.error('❌ WebSocket error:', err);
      clearTimeout(timeout);
      process.exit(1);
    });

    ws.on('close', function close(code, reason) {
      console.log(`🔌 WebSocket closed - Code: ${code}, Reason: ${reason?.toString()}`);
      clearTimeout(timeout);
    });

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testMobileAppApproach();