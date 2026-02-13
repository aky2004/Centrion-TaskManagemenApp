const axios = require('axios');
const io = require('socket.io-client');

const API_URL = 'http://localhost:5001/api';
const SOCKET_URL = 'http://localhost:5001';

// Helper to create delay
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const runTest = async () => {
  console.log('🚀 Starting Collaboration Features Test...');

  try {
    // 1. Create/Login User A
    console.log('\n👤 Creating User A...');
    const userAEmail = `userA_${Date.now()}@test.com`;
    await axios.post(`${API_URL}/auth/register`, {
      name: 'User A',
      email: userAEmail,
      password: 'password123'
    });
    
    const loginA = await axios.post(`${API_URL}/auth/login`, {
      email: userAEmail,
      password: 'password123'
    });
    const tokenA = loginA.data.accessToken;
    const userAId = loginA.data.user._id;
    console.log(`✅ User A logged in (${userAId})`);

    // 2. Create/Login User B
    console.log('\n👤 Creating User B...');
    const userBEmail = `userB_${Date.now()}@test.com`;
    await axios.post(`${API_URL}/auth/register`, {
      name: 'User B',
      email: userBEmail,
      password: 'password123'
    });

    const loginB = await axios.post(`${API_URL}/auth/login`, {
      email: userBEmail,
      password: 'password123'
    });
    const tokenB = loginB.data.accessToken;
    const userBId = loginB.data.user._id;
    console.log(`✅ User B logged in (${userBId})`);

    // 3. User A creates Workspace and Project
    console.log('\n📁 User A creating workspace and project...');
    const workspaceRes = await axios.post(`${API_URL}/workspaces`, {
      name: 'Test Workspace',
      description: 'Collaboration Test'
    }, { headers: { Authorization: `Bearer ${tokenA}` }});
    const workspaceId = workspaceRes.data.workspace._id;

    const projectRes = await axios.post(`${API_URL}/projects`, {
      name: 'Collab Project',
      workspace: workspaceId,
      description: 'Testing real-time features'
    }, { headers: { Authorization: `Bearer ${tokenA}` }});
    const projectId = projectRes.data.project._id;
    console.log(`✅ Project created (${projectId})`);

    // 4. User A adds User B to Project
    console.log('\n🤝 User A adding User B to project...');
    await axios.post(`${API_URL}/projects/${projectId}/members`, {
      userId: userBId,
      role: 'editor'
    }, { headers: { Authorization: `Bearer ${tokenA}` }});
    console.log('✅ User B added to project');

    // 5. Connect Sockets
    console.log('\n🔌 Connecting sockets...');
    const socketA = io(SOCKET_URL, { auth: { token: tokenA } });
    const socketB = io(SOCKET_URL, { auth: { token: tokenB } });

    await new Promise(resolve => {
      let connected = 0;
      const check = () => {
        connected++;
        if (connected === 2) resolve();
      };
      socketA.on('connect', check);
      socketB.on('connect', check);
    });
    console.log('✅ Both sockets connected');

    // Join Project Room
    socketA.emit('project:join', projectId);
    socketB.emit('project:join', projectId);
    await sleep(500);

    // 6. User A creates a Task
    console.log('\n📝 User A creating a task...');
    const taskRes = await axios.post(`${API_URL}/tasks`, {
      title: 'Discuss Collaboration',
      project: projectId,
      column: 'To Do',
      priority: 'high'
    }, { headers: { Authorization: `Bearer ${tokenA}` }});
    const taskId = taskRes.data.task._id;
    console.log(`✅ Task created (${taskId})`);

    // 7. Test Comments (Real-time)
    console.log('\n💬 Testing Real-time Comments...');
    
    // User B listens for new comments
    const commentPromise = new Promise((resolve, reject) => {
      socketB.on('comment:added', (comment) => {
        if (comment.task === taskId && comment.content === 'Hello from User A!') {
          console.log('✅ User B received comment via socket!');
          resolve();
        }
      });
      setTimeout(() => reject('Timeout waiting for comment'), 5000);
    });

    // User A posts a comment
    await axios.post(`${API_URL}/comments`, {
      content: 'Hello from User A!',
      taskId: taskId
    }, { headers: { Authorization: `Bearer ${tokenA}` }});

    await commentPromise;

    // 8. Test Project Chat (Real-time)
    console.log('\n📢 Testing Project Chat...');
    
    // User A listens for new messages
    const chatPromise = new Promise((resolve, reject) => {
      socketA.on('message:new', (msg) => {
        if (msg.project === projectId && msg.content === 'Team chat test') {
          console.log('✅ User A received project message via socket!');
          resolve();
        }
      });
      setTimeout(() => reject('Timeout waiting for project message'), 5000);
    });

    // User B sends a message to project
    await axios.post(`${API_URL}/messages`, {
      content: 'Team chat test',
      project: projectId
    }, { headers: { Authorization: `Bearer ${tokenB}` }});

    await chatPromise;

    // 9. Test Direct Messages (Real-time)
    console.log('\n📨 Testing Direct Messages...');
    
    // User B listens for DM
    const dmPromise = new Promise((resolve, reject) => {
      socketB.on('message:direct', (msg) => {
        if (msg.sender._id === userAId && msg.content === 'Secret DM test') {
          console.log('✅ User B received DM via socket!');
          resolve();
        }
      });
      setTimeout(() => reject('Timeout waiting for DM'), 5000);
    });

    // User A sends DM to User B
    await axios.post(`${API_URL}/messages`, {
      content: 'Secret DM test',
      recipient: userBId
    }, { headers: { Authorization: `Bearer ${tokenA}` }});

    await dmPromise;

    // Cleanup
    console.log('\n🧹 Cleaning up...');
    socketA.disconnect();
    socketB.disconnect();
    
    console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY! 🎉');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.response?.data || error.message);
    process.exit(1);
  }
};

runTest();
