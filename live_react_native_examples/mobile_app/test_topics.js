const WebSocket = require('ws');

console.log('🧪 Testing different topic formats...');

const topics = [
  '/live/counter',
  '/counter',
  'lv:/live/counter',
  'lv:/counter',
  'live:counter',
  'counter'
];

let currentTopicIndex = 0;

function testTopic(topicIndex) {
  if (topicIndex >= topics.length) {
    console.log('❌ No working topics found');
    process.exit(1);
    return;
  }

  const topic = topics[topicIndex];
  console.log(`\n🧪 Testing topic: "${topic}"`);

  const ws = new WebSocket('ws://localhost:4000/mobile/websocket?vsn=2.0.0');

  const timeout = setTimeout(() => {
    console.log(`❌ Timeout for topic: ${topic}`);
    ws.close();
    testTopic(topicIndex + 1);
  }, 3000);

  ws.on('open', function open() {
    console.log(`✅ Connected, testing topic: ${topic}`);

    const joinMsg = [
      "1",
      "1",
      topic,
      "phx_join",
      {
        url: `http://localhost:4000${topic}`,
        params: {},
        session: {},
        static: ""
      }
    ];

    ws.send(JSON.stringify(joinMsg));
  });

  ws.on('message', function message(data) {
    clearTimeout(timeout);

    try {
      const msg = JSON.parse(data.toString());

      if (Array.isArray(msg) && msg[3] === 'phx_reply') {
        const payload = msg[4];
        console.log(`📋 Topic "${topic}" status:`, payload.status);

        if (payload.status === 'ok') {
          console.log(`🎉 SUCCESS! Topic "${topic}" works!`);
          console.log('✅ Response:', JSON.stringify(payload.response, null, 2));
          ws.close();
          process.exit(0);
        } else {
          console.log(`❌ Topic "${topic}" failed:`, payload.response?.reason);
          ws.close();
          testTopic(topicIndex + 1);
        }
      }
    } catch (e) {
      console.error(`❌ Error parsing for topic ${topic}:`, e);
      ws.close();
      testTopic(topicIndex + 1);
    }
  });

  ws.on('error', function error(err) {
    console.error(`❌ WebSocket error for topic ${topic}:`, err.message);
    clearTimeout(timeout);
    testTopic(topicIndex + 1);
  });

  ws.on('close', function close() {
    clearTimeout(timeout);
  });
}

testTopic(0);