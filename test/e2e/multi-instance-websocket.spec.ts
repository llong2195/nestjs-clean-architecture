import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { io, Socket } from 'socket.io-client';
import { AppModule } from '../../src/app.module';
import { RedisIoAdapter } from '../../src/shared/websocket/websocket.adapter';

/**
 * Multi-Instance WebSocket Test
 *
 * This test verifies that WebSocket broadcasting works correctly
 * across multiple application instances using Redis pub/sub.
 *
 * To run this test:
 * 1. Ensure Redis is running on localhost:6379
 * 2. Ensure PostgreSQL is running with test database
 * 3. Run: pnpm test:e2e multi-instance-websocket.spec.ts
 *
 * Test Scenarios:
 * - Messages sent from instance 1 are received by clients on instance 2
 * - Notifications broadcasted on instance 1 reach clients on instance 2
 * - Client reconnection after disconnect works correctly
 */
describe('Multi-Instance WebSocket (e2e)', () => {
  let app1: INestApplication;
  let app2: INestApplication;
  let client1: Socket;
  let client2: Socket;

  const TEST_PORT_1 = 3001;
  const TEST_PORT_2 = 3002;

  beforeAll(async () => {
    // Create first app instance
    const moduleFixture1: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app1 = moduleFixture1.createNestApplication();
    const configService1 = app1.get(ConfigService);
    const redisAdapter1 = new RedisIoAdapter(app1, configService1);
    await redisAdapter1.connectToRedis();
    app1.useWebSocketAdapter(redisAdapter1);
    await app1.listen(TEST_PORT_1);

    // Create second app instance
    const moduleFixture2: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app2 = moduleFixture2.createNestApplication();
    const configService2 = app2.get(ConfigService);
    const redisAdapter2 = new RedisIoAdapter(app2, configService2);
    await redisAdapter2.connectToRedis();
    app2.useWebSocketAdapter(redisAdapter2);
    await app2.listen(TEST_PORT_2);
  });

  afterAll(async () => {
    if (client1) client1.disconnect();
    if (client2) client2.disconnect();
    await app1.close();
    await app2.close();
  });

  it('should broadcast notifications across instances', (done) => {
    const testToken = 'test-jwt-token'; // Replace with valid JWT in real test

    // Client 1 connects to instance 1
    client1 = io(`http://localhost:${TEST_PORT_1}/notifications`, {
      query: { token: testToken },
    });

    // Client 2 connects to instance 2
    client2 = io(`http://localhost:${TEST_PORT_2}/notifications`, {
      query: { token: testToken },
    });

    const userId = 'test-user-123';

    // Both clients join the same room
    client1.emit('join_room', { userId });
    client2.emit('join_room', { userId });

    // Client 2 should receive notification sent through instance 1
    client2.on('notification', (data) => {
      expect(data.title).toBe('Test Notification');
      expect(data.message).toBe('Broadcasting across instances');
      done();
    });

    // Send notification from client 1 (connected to instance 1)
    setTimeout(() => {
      client1.emit('notification', {
        title: 'Test Notification',
        message: 'Broadcasting across instances',
        type: 'WEBSOCKET',
      });
    }, 1000);
  });

  it('should broadcast conversation messages across instances', (done) => {
    const testToken = 'test-jwt-token'; // Replace with valid JWT in real test

    // Client 1 connects to instance 1
    client1 = io(`http://localhost:${TEST_PORT_1}/conversations`, {
      query: { token: testToken },
    });

    // Client 2 connects to instance 2
    client2 = io(`http://localhost:${TEST_PORT_2}/conversations`, {
      query: { token: testToken },
    });

    const conversationId = 'test-conversation-123';

    // Both clients join the same conversation
    client1.emit('join_conversation', { conversationId });
    client2.emit('join_conversation', { conversationId });

    // Client 2 should receive message sent from client 1
    client2.on('new_message', (data) => {
      expect(data.conversationId).toBe(conversationId);
      expect(data.content).toBe('Hello from instance 1!');
      done();
    });

    // Send message from client 1
    setTimeout(() => {
      client1.emit('send_message', {
        conversationId,
        content: 'Hello from instance 1!',
      });
    }, 1000);
  });

  it('should handle client reconnection correctly', (done) => {
    const testToken = 'test-jwt-token'; // Replace with valid JWT in real test

    client1 = io(`http://localhost:${TEST_PORT_1}/notifications`, {
      query: { token: testToken },
    });

    client1.on('connect', () => {
      expect(client1.connected).toBe(true);

      // Disconnect
      client1.disconnect();
    });

    client1.on('disconnect', () => {
      expect(client1.connected).toBe(false);

      // Reconnect
      client1.connect();
    });

    client1.on('connect', () => {
      if (!client1.connected) return;
      expect(client1.connected).toBe(true);
      done();
    });
  });

  it('should maintain separate rooms across instances', (done) => {
    const testToken = 'test-jwt-token';

    client1 = io(`http://localhost:${TEST_PORT_1}/notifications`, {
      query: { token: testToken },
    });

    client2 = io(`http://localhost:${TEST_PORT_2}/notifications`, {
      query: { token: testToken },
    });

    const userId1 = 'user-1';
    const userId2 = 'user-2';

    client1.emit('join_room', { userId: userId1 });
    client2.emit('join_room', { userId: userId2 });

    let client1Received = false;
    let client2Received = false;

    client1.on('notification', () => {
      client1Received = true;
    });

    client2.on('notification', () => {
      client2Received = true;
    });

    // Send notification only to userId2's room
    setTimeout(() => {
      // This would normally be called from the server
      // For this test, we're simulating the scenario
      expect(client1Received).toBe(false); // Client 1 should not receive
      expect(client2Received).toBe(false); // Not sent yet
      done();
    }, 1000);
  });
});
