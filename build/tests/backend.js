const {run} = require('../utils.js');
const {test, expect} = require('../test.js');
const fetch = require('axios');

const api = async (path='', body={}) => {
    try {
        const res = await fetch.post(`http://localhost:56786/${path}`, body);
        return res.data;
    } catch (error) {
        return {error};
    }
}

function sleep (ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function startBackend () {
    run(`
        . server/venv/bin/activate;
        cd ./server/;
        gunicorn -b localhost:56786 app:app --log-level debug --error-logfile log.txt --capture-output;
    `);

    // keep on checking until the server is ready
    while (true) {
        await sleep(100);
        console.log('Waiting for server to start...');
        try {
            const res = await api().catch(() => {});
            if (res['ok']) {
                return;
            }
        } catch (e) {}
    }
}

test(async () => {
    await startBackend();

    expect ((await api())['ok']).toBe(true);

    await run('sudo pkill gunicorn');

    return true;
});
