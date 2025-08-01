const WebSocket = require('ws');

console.log('🧪 Testing different topic formats...');

const ws = new WebSocket('ws://localhost:4000/live/websocket?vsn=2.0.0');

let testIndex = 0;
const topicsToTest = [
  'lv:/live/counter',
  'live:/live/counter',
  '/live/counter',
  'counter',
  'lv:counter',
  'live:counter'
];

function testNextTopic() {
  if (testIndex >= topicsToTest.length) {
    console.error('❌ All topic formats failed');
    ws.close();
    process.exit(1);
    return;
  }

  const topic = topicsToTest[testIndex];
  console.log(`\n🔍 Testing topic #${testIndex + 1}: "${topic}"`);

  const joinMsg = {
    join_ref: testIndex + 1,
    msg_ref: testIndex + 1,
    topic: topic,
    event: 'phx_join',
    payload: {
      session: 'SFMyNTY.g3QAAAABbQAAAAtfY3NyZl90b2tlbm0AAAAYbW9iaWxlLWFwcC1jc3JmLXRva2Vu.9yKKK-pqfzPG7-gIf-hvLRu8p8sLaJNL9G5EjWQnBqg',
      static: '',
      url: 'http://localhost:4000/live/counter',
      params: {},
      _mounts: 0
    }
  };

  console.log(`📤 Sending: ${JSON.stringify(joinMsg)}`);
  ws.send(JSON.stringify(joinMsg));

  // Wait a bit for response, then try next topic
  setTimeout(() => {
    testIndex++;
    testNextTopic();
  }, 1000);
}

ws.on('open', function open() {
  console.log('✅ WebSocket connected successfully!');
  testNextTopic();
});

ws.on('message', function message(data) {
  console.log(`📨 Received: ${data.toString()}`);
  const msg = JSON.parse(data.toString());

  if (msg.event === 'phx_reply' && msg.payload.status === 'ok') {
    console.log(`🎉 SUCCESS! Topic "${topicsToTest[testIndex-1]}" works!`);
    console.log(`📋 Response: ${JSON.stringify(msg.payload, null, 2)}`);
    ws.close();
    process.exit(0);
  } else if (msg.event === 'phx_reply' && msg.payload.status === 'error') {
    console.log(`❌ Topic "${topicsToTest[testIndex-1]}" failed:`, msg.payload.response);
  }
});

ws.on('error', function error(err) {
  console.error('❌ WebSocket error:', err);
  process.exit(1);
});

ws.on('close', function close(code, reason) {
  console.log(`🔌 WebSocket closed - Code: ${code}, Reason: ${reason.toString()}`);
});