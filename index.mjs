
import express from 'express';
import { agoraRequestBuildToken, agoraRttQuery, agoraRttStart, agoraRttStop } from './agora_api_request.mjs';

const app = express();
const port = 3000;

// Middleware to parse JSON in the request body
app.use(express.json());

app.get('/', (req, res) => {
    res.send('<html><h2>Welcome to Agora RTT server.</h2></html>');
});

app.get('/rttStart', async (req, res) => {
    const taskId = await agoraRttStart();
    res.send({ 'id': taskId });
});

app.get('/rttQuery', async (req, res) => {
    const result = await agoraRttQuery();
    res.send({ result });
});

app.get('/rttStop', async (req, res) => {
    const result = await agoraRttStop();
    res.send({ result });
});

// Start server
app.listen(port, async () => {
    await agoraRequestBuildToken();
    console.log('Listening port 3000...');
});