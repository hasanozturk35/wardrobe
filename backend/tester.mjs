import fs from 'fs';

async function test() {
    try {
        const reg = await fetch('http://localhost:3000/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'tester2', email: 'tester2@test.com', password: 'password123' })
        });

        const log = await fetch('http://localhost:3000/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'tester2@test.com', password: 'password123' })
        });
        const { accessToken } = await log.json();

        const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
        const body = '--' + boundary + '\r\nContent-Disposition: form-data; name="category"\r\n\r\nÜst Giyim\r\n--' + boundary + '--\r\n';

        const up = await fetch('http://localhost:3000/wardrobe/items', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + accessToken,
                'Content-Type': 'multipart/form-data; boundary=' + boundary
            },
            body: body
        });
        console.log('STATUS:', up.status);
        console.log('RESPONSE:', await up.text());
    } catch (e) { console.error(e); }
}
test();
