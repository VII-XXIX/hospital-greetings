import dotenv from 'dotenv';
dotenv.config();

const token = process.env.HF_TOKEN;

async function testToken() {
    console.log(`Testing token: ${token.substring(0, 5)}...`);
    try {
        const response = await fetch('https://huggingface.co/api/whoami-v2', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            console.log('✅ Token is VALID.');
            console.log('User:', data.name);
            console.log('Type:', data.type);
            console.log('Permissions:', data.auth.accessToken.fineGrained);
        } else {
            console.error('❌ Token is INVALID.');
            console.error('Status:', response.status);
            const text = await response.text();
            console.error('Response:', text);
        }
    } catch (e) {
        console.error('Fetch error:', e);
    }
}

testToken();
