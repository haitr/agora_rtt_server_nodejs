
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
    await agoraRttStart();
});

app.get('/rttQuery', async (req, res) => {
    await agoraRttQuery();
});

app.get('/rttStop', async (req, res) => {
    await agoraRttStop();
});

// Start server
app.listen(port, async () => {
    await agoraRequestBuildToken();
    console.log('Listening port 3000...');
});