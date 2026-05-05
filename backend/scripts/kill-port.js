const { execSync } = require('child_process');
try {
    const out = execSync('netstat -ano', { encoding: 'utf8' });
    const line = out.split('\n').find(l => l.includes(':3000') && l.includes('LISTENING'));
    if (line) {
        const pid = line.trim().split(/\s+/).pop();
        if (pid && /^\d+$/.test(pid) && pid !== '0') {
            execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
            console.log(`Port 3000 freed (PID ${pid})`);
        }
    }
} catch (e) { /* port not in use */ }
