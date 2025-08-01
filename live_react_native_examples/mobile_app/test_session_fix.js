const WebSocket = require('ws');
const http = require('http');

console.log('🧪 Testing our session handling fix...');

async function testSessionFix() {
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

    // STEP 2: Test our fixed approach (what our library now does)
    console.log('🔄 Testing with proper LiveView join parameters...');

    const ws = new WebSocket('ws://localhost:4000/live/websocket?vsn=2.0.0');

    const timeout = setTimeout(() => {
      console.error('❌ Connection timeout');
      ws.close();
      process.exit(1);
    }, 10000);

    ws.on('open', function open() {
      console.log('✅ WebSocket connected!');

      // CRITICAL: Use the EXACT format our fixed library now creates
      console.log('🔧 Creating LiveView join parameters (our library format):');
      const liveViewJoinParams = {
        session: sessionToken,  // ✅ Top-level session (not in params.session)
        static: "",
        url: "http://localhost:4000/live/counter",
        params: {},  // ✅ Empty params object
        _mounts: 0
      };

      console.log('📋 Join params:', JSON.stringify(liveViewJoinParams, null, 2));

      // Send the join message
      const joinMsg = [
        "1",                      // join_ref
        "1",                      // msg_ref
        "lv:/live/counter",       // topic
        "phx_join",               // event
        liveViewJoinParams        // ✅ Properly formatted params
      ];

      console.log('🚀 Sending join with FIXED format...');
      ws.send(JSON.stringify(joinMsg));
    });

    ws.on('message', function message(data) {
      clearTimeout(timeout);

      console.log('📨 Received:', data.toString());

      try {
        const msg = JSON.parse(data.toString());

        if (Array.isArray(msg) && msg[3] === 'phx_reply') {
          const payload = msg[4];
          console.log('📋 Join status:', payload.status);

          if (payload.status === 'ok') {
            console.log('🎉 SUCCESS! Session fix works!');
            console.log('✅ LiveView response:', JSON.stringify(payload.response?.assigns, null, 2));
            console.log('🎯 Mobile app should now work!');

            // Test event
            const eventMsg = [
              "1", "2", "lv:/live/counter", "event",
              { type: "increment", event: "increment", value: {} }
            ];

            console.log('🚀 Testing increment event...');
            ws.send(JSON.stringify(eventMsg));

          } else {
            console.error('❌ Session fix failed:', payload.response);
            console.log('❓ Reason:', payload.response?.reason);

            if (payload.response?.reason === 'stale') {
              console.log('🔍 "Stale" means session format is right but token is invalid');
              console.log('🔍 This is progress! The format is working.');
            }

            ws.close();
            process.exit(1);
          }
        } else if (Array.isArray(msg) && msg[1] === '2') {
          console.log('✅ Event response:', JSON.stringify(msg[4], null, 2));
          console.log('🎉 COMPLETE SUCCESS! Session + Events working!');
          console.log('🎯 The mobile app is now fixed!');
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
      console.log(`🔌 WebSocket closed - Code: ${code}`);
      clearTimeout(timeout);
    });

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testSessionFix();