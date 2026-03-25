async function ping() {
    try {
        const res = await fetch('http://localhost:3000/api', { method: 'GET' });
        console.log("STATUS:", res.status);
    } catch (e) {
        console.error("PING FAILED:", e.message);
    }
}
ping();
