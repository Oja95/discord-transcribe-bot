import 'dotenv/config';
import fetch from 'node-fetch';
import streamToBlob from 'stream-to-blob';

/**
 * Submits an audio file to DeepInfra for transcription
 */
export async function DeepInfraRequest(attachmentUrl) {
    const url = 'https://api.deepinfra.com/v1/inference/openai/whisper-large';

    const audioFileResponse = await fetch(attachmentUrl);
    if (!audioFileResponse.ok) {
        console.error('Error downloading audio file:', audioFileResponse.statusText);
        return;
    }

    const audioBlob = await streamToBlob(audioFileResponse.body);

    const formData = new FormData();
    formData.append('audio', audioBlob, {
        filename: 'voice.ogg',
        contentType: audioFileResponse.headers.get('content-type'),
    });

    const res = await fetch(url, {
        method: 'POST',
        headers: {
            Authorization: `bearer ${process.env.DEEPINFRA_API_KEY}`,
        },
        body: formData,
    });

    if (!res.ok) {
        const data = await res.json();
        console.error(`DeepInfra API Error (${res.status}):`, JSON.stringify(data));
    }

    return res;
}
