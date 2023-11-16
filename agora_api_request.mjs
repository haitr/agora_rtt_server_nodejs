// import { RtcRole, RtcTokenBuilder } from 'agora-token';
import AgoraToken from 'agora-token';
import axios from 'axios';
import 'dotenv/config';
const { RtcRole, RtcTokenBuilder } = AgoraToken;

const appId = process.env.APP_ID;
const appCertificate = process.env.APP_CERTIFICATE;
const customerId = process.env.CUSTOMER_ID;
const customerSecret = process.env.CUSTOMER_SECRET;
const credentials = Buffer.from(`${customerId}:${customerSecret}`).toString('base64');
const authorizationHeader = `Basic ${credentials}`;
const baseUrl = 'https://api.agora.io';
const rttUrl = `${baseUrl}/v1/projects/${appId}/rtsc/speech-to-text`;
const headers = {
    'Authorization': authorizationHeader,
    'Content-Type': 'application/json'
}
// Storage config
const ossSecretKey = process.env.OSS_SECRET_KEY;
const ossAccessKey = process.env.OSS_ACCESS_KEY;
const ossBucketName = process.env.OSS_BUCKET_NAME;

// Our definition
const instanceId = 'RTT_Test';
// Unique uids to access the audio in the channel, and send the text
const uidAudio = 111;
const uidText = 222;
const tokenExpirationInSecond = 3600;
const privilegeExpirationInSecond = 3600;
const maxIdleTime = 120; // If there is no activity of this time, the task stops automatically.
const language = "ko-KR"; // Max 2 simultaneous languages are supported, separated by a comma.

async function agoraRequestBuildToken() {
    const url = `${rttUrl}/builderTokens`;
    const data = {
        'instanceId': instanceId
    };
    const apiResponse = await axios.post(url, data, { headers });
    if (apiResponse.hasOwnProperty('tokenName')) {
        const tokenName = apiResponse['tokenName'];
        process.env['AGORA_BUILDER_TOKEN'] = tokenName;
    }
}

async function agoraRttStart(channelName) {
    const url = `${rttUrl}/tasks
        ?builderToken=${process.env.AGORA_BUILDER_TOKEN}`;
    const tokenAudio = buildToken(channelName, uidAudio);
    const tokenVideo = buildToken(channelName, uidText);
    //
    const storageConfig = {
        'accessKey': ossAccessKey, // Access key of oss
        'secretKey': ossSecretKey, // Secret key of oss
        'bucket': ossBucketName, // Oss bucket name
        'vendor': 1, // Your Oss Vendor ID
        'region': 1, // Your Oss Region ID
        'fileNamePrefix': [
            'folder',
            'subFolder'
        ]
    }
    //
    const data = {
        'audio': {
            'subscribeSource': 'AGORARTC', // Currently fixed
            'agoraRtcConfig': {
                'channelName': channelName, // Name of the channel for RTT
                // Uid used by the audio streaming bot. Must be an
                // integer specified as a string. For example "111"
                'uid': uidAudio,
                'token': tokenAudio, // RTC token for the audio uid
                'channelType': 'LIVE_TYPE', // Currently fixed,
                'subscribeConfig': {
                    'subscribeMode': 'CHANNEL_MODE', // Currently fixed
                },
                // If there is no audio stream in the channel for
                // more than this time, the RTT task stops automatically
                'maxIdleTime': maxIdleTime,
            }
        },
        'config': {
            'features': [
                'RECOGNIZE' // Currently fixed
            ],
            'recognizeConfig': {
                // Supports at most two language codes separated by commas.
                // For example, "en-US,ja-JP"
                'language': language,
                'model': 'Model', // Currently fixed
                'output': {
                    'destinations': [
                        'AgoraRTCDataStream',
                        'Storage'
                    ],
                    'agoraRTCDataStream': {
                        'channelName': channelName,
                        'uid': uidText,
                        'token': tokenVideo
                    },
                    // 'cloudStorage': {
                    //     'format': 'HLS', // Currently fixed
                    //     'storageConfig': storageConfig
                    // }
                }
            }
        }
    };
    //
    try {
        const apiResponse = await axios.post(url, data, { headers });
        const status = apiResponse.data.status;
        const taskId = apiResponse.data.taskId;
        if (status == 'IN_PROGRESS' || status == 'STARTED') {
            console.log(`RTT task started for channel ${channelName} ID: ${taskId}`);
        } else {
            console.log(`RTT task status: ${status}`);
        }
    } catch (error) {
        console.log('Exception starting speech-to-text task: ' + error);
    }
}

async function agoraRttStop(taskId) {
    const url = `${rttUrl}/tasks/${taskId}
        ?builderToken=${process.env.AGORA_BUILDER_TOKEN}`;
    try {
        const apiResponse = await axios.delete(url, { headers });
        if (isSuccessful(apiResponse.status)) {
            console.log(`RTT stopped task: ${taskId}`);
        } else {
            console.log(`RTT failed to stop task: ${taskId}`);
        }
    } catch (error) {
        console.log('Exception stopping RTT task: ' + taskId);
        console.log(error);
        console.log('-----');
    }
}

async function agoraRttQuery(taskId) {
    const url = `${rttUrl}/tasks/${taskId}
        ?builderToken=${process.env.AGORA_BUILDER_TOKEN}`;
    try {
        const apiResponse = await axios.get(url, { headers });
        const status = apiResponse.data.status;
        if (isSuccessful(apiResponse.status)) {
            console.log(`RTT query task: ${taskId} status: ${status}`);
        } else {
            console.log(`RTT failed to query task: ${taskId} status: ${status}`);
        }
    } catch (error) {
        console.log('Exception querying RTT task: ' + taskId);
        console.log(error);
        console.log('-----');
    }
}

function isSuccessful(statusCode) {
    return statusCode >= 200 && statusCode <= 299;
}

function buildToken(channelName, uid) {
    return RtcTokenBuilder.buildTokenWithUid(
        appId,
        appCertificate,
        channelName,
        uid,
        RtcRole.PUBLISHER,
        tokenExpirationInSecond,
        privilegeExpirationInSecond);
}

export {
    agoraRequestBuildToken, agoraRttQuery, agoraRttStart,
    agoraRttStop
};
