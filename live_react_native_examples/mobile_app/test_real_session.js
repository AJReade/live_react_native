const WebSocket = require('ws');
const https = require('http');

console.log('🧪 Getting real session token and testing LiveView...');

// First, get a real session token from the server
function getSessionToken() {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'localhost',
      port: 4000,
      path: '/mobile/session',
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    }, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log('✅ Got session token from server!');
          resolve(response.session_token);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.end();
  });
}

async function testLiveViewWithRealSession() {
  try {
    // Get real session token
    const sessionToken = await getSessionToken();
    console.log('🔑 Session token:', sessionToken.substring(0, 50) + '...');

    // Now test LiveView with real session
    const ws = new WebSocket('ws://localhost:4000/live/websocket?vsn=2.0.0');

    const timeout = setTimeout(() => {
      console.error('❌ Timeout waiting for LiveView response');
      ws.close();
      process.exit(1);
    }, 5000);

    ws.on('open', function open() {
      console.log('✅ WebSocket connected with real session!');

      const joinMsg = [
        "1",    // join_ref
        "1",    // msg_ref
        "lv:/live/counter",  // topic
        "phx_join",          // event
        {
          session: sessionToken,  // Real session token!
          static: "",
          url: "http://localhost:4000/live/counter",
          params: {},
          _mounts: 0
        }
      ];

      console.log('🚀 Sending join with REAL session token...');
      ws.send(JSON.stringify(joinMsg));
    });

    ws.on('message', function message(data) {
      clearTimeout(timeout);

      console.log('📨 LiveView response:', data.toString());

      try {
        const msg = JSON.parse(data.toString());

        if (Array.isArray(msg) && msg[3] === 'phx_reply') {
          const payload = msg[4];
          console.log('📋 Status with real session:', payload.status);

          if (payload.status === 'ok') {
            console.log('🎉 BREAKTHROUGH! Real session works!');
            console.log('✅ LiveView mounted successfully!');
            console.log('✅ Initial assigns:', JSON.stringify(payload.response?.assigns, null, 2));

            // Test increment event
            const eventMsg = [
              "1", "2", "lv:/live/counter", "event",
              { type: "increment", event: "increment", value: {} }
            ];

            console.log('🚀 Testing increment event...');
            ws.send(JSON.stringify(eventMsg));

          } else {
            console.error('❌ Even real session failed:', payload.response);
            ws.close();
            process.exit(1);
          }
        } else if (Array.isArray(msg) && msg[1] === '2') {
          const eventResponse = msg[4];
          console.log('✅ Event response:', JSON.stringify(eventResponse, null, 2));
          console.log('🎉 COMPLETE SUCCESS! LiveView + Events + Real Session!');
          console.log('🎯 Now we know exactly how to fix the mobile app!');
          ws.close();
          process.exit(0);
        }
      } catch (e) {
        console.error('❌ Error parsing response:', e);
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
    console.error('❌ Error getting session token:', error);
    process.exit(1);
  }
}

testLiveViewWithRealSession();