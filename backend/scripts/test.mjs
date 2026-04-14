import fs from 'fs';
async function run() {
    const res = await fetch('http://localhost:3000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'testuser@example.com', password: 'Password123' })
    });
    const data = await res.json();

    const formData = new FormData();
    formData.append('category', 'Üst Giyim');
    formData.append('colors', 'Siyah');
    formData.append('seasons', 'Yaz');

    const upload = await fetch('http://localhost:3000/wardrobe/items', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + data.accessToken },
        body: formData
    });

    console.log('Status:', upload.status);
    console.log('Result:', await upload.text());
}
run();
