import fs from 'fs';
import path from 'path';

async function testUpload() {
    const tokenUrl = 'http://localhost:3000/auth/login';
    const loginRes = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: "test@test.com", password: "password" })
    });
    const { access_token } = await loginRes.json();

    const formDataId = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
    let body = '';

    // Category
    body += '--' + formDataId + '\r\n';
    body += 'Content-Disposition: form-data; name="category"\r\n\r\n';
    body += 'Üst Giyim\r\n';

    // Photo
    body += '--' + formDataId + '\r\n';
    body += 'Content-Disposition: form-data; name="photos"; filename="test.jpg"\r\n';
    body += 'Content-Type: image/jpeg\r\n\r\n';
    body += 'FAKE_IMAGE_DATA\r\n';

    body += '--' + formDataId + '--\r\n';

    const res = await fetch('http://localhost:3000/wardrobe/items', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${access_token}`,
            'Content-Type': 'multipart/form-data; boundary=' + formDataId
        },
        body: body
    });

    const text = await res.text();
    console.log('STATUS:', res.status);
    console.log('RESPONSE:', text);
}

testUpload();
