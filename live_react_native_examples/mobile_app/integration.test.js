const { Socket } = require('phoenix');

describe('Mobile WebSocket Integration', () => {
  let socket;

  beforeEach(() => {
    // Test the actual WebSocket connection the mobile app uses
    socket = new Socket('ws://localhost:4000/mobile', {
      params: {},
      logger: (kind, msg, data) => {
        console.log(`${kind}: ${msg}`, data);
      }
    });
  });

  afterEach(() => {
    if (socket) {
      socket.disconnect();
    }
  });

  test('can connect to mobile WebSocket', (done) => {
    socket.onOpen(() => {
      console.log('✅ Socket connected successfully');
      socket.disconnect();
      done();
    });

    socket.onError((error) => {
      console.error('❌ Socket connection error:', error);
      done.fail(error);
    });

    socket.connect();
  });

  test('can join LiveView topic', (done) => {
    socket.onOpen(() => {
      console.log('✅ Socket connected, joining LiveView...');

      const channel = socket.channel('lv:/live/counter', {});

      channel.join()
        .receive('ok', (response) => {
          console.log('✅ LiveView joined successfully:', response);
          socket.disconnect();
          done();
        })
        .receive('error', (error) => {
          console.error('❌ LiveView join error:', error);
          socket.disconnect();
          done.fail(error);
        })
        .receive('timeout', () => {
          console.error('❌ LiveView join timeout');
          socket.disconnect();
          done.fail(new Error('Join timeout'));
        });
    });

    socket.onError((error) => {
      console.error('❌ Socket connection error:', error);
      done.fail(error);
    });

    socket.connect();
  });

  test('can send events to LiveView', (done) => {
    socket.onOpen(() => {
      const channel = socket.channel('lv:/live/counter', {});

      channel.join()
        .receive('ok', (response) => {
          console.log('✅ LiveView joined, sending increment event...');

          // Send increment event
          channel.push('event', {
            type: 'increment',
            event: 'increment',
            value: {}
          })
          .receive('ok', (response) => {
            console.log('✅ Event sent successfully:', response);
            expect(response.assigns.count).toBe(1);
            socket.disconnect();
            done();
          })
          .receive('error', (error) => {
            console.error('❌ Event error:', error);
            socket.disconnect();
            done.fail(error);
          });
        })
        .receive('error', (error) => {
          console.error('❌ LiveView join error:', error);
          socket.disconnect();
          done.fail(error);
        });
    });

    socket.connect();
  });
});

// Helper to run integration tests manually
if (require.main === module) {
  console.log('🧪 Running manual integration test...');

  const socket = new Socket('ws://localhost:4000/mobile', {
    params: {},
    logger: (kind, msg, data) => {
      console.log(`[${kind}] ${msg}`, data);
    }
  });

  socket.onOpen(() => {
    console.log('✅ Connected to mobile socket');

    const channel = socket.channel('lv:/live/counter', {});

    channel.join()
      .receive('ok', (response) => {
        console.log('✅ Joined LiveView:', response);
        console.log('Initial count:', response.assigns?.count);

        // Test increment
        channel.push('event', {
          type: 'increment',
          event: 'increment',
          value: {}
        })
        .receive('ok', (response) => {
          console.log('✅ Increment success:', response);
          socket.disconnect();
          process.exit(0);
        })
        .receive('error', (error) => {
          console.error('❌ Increment error:', error);
          socket.disconnect();
          process.exit(1);
        });
      })
      .receive('error', (error) => {
        console.error('❌ Join error:', error);
        socket.disconnect();
        process.exit(1);
      });
  });

  socket.onError((error) => {
    console.error('❌ Connection error:', error);
    process.exit(1);
  });

  socket.connect();
}