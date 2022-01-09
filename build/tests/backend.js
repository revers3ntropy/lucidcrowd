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

async function generateUsers (n) {
    const sessions = [];

    for (let i = 0; i < n; i++) {
        const res = await api('create-account', {
            username: 'user' + i,
            password: 'password' + i
        });
        const session = res['session-id'];
        expect(session).toBeGT(0);

        console.log(i, ': ', session, res);
        sessions.push(session);
    }

    return sessions;
}

async function validateSessions (sessions) {
    let i = 0;
    for (const session of sessions) {
        const res = await api('valid-session', {
            'session-id': session
        });

        console.log(i, ': ', session, res);

        expect(res['valid']).toBe(true);
        i++;
    }
}

async function cleanUp (sessions) {
    let i = 0;
    for (const session of sessions) {
        const res = await api('delete-account', {
            'session-id': session,
            username: 'user' + i,
            password: 'password' + i
        });

        console.log(res);

        expect(res['completed']).toBe(true);
        i++;
    }
}

test(async () => {
    await startBackend();

    expect ((await api())['ok']).toBe(true);

    const sessions = await generateUsers(5);
    await validateSessions(sessions);

    const badUsernameRes = await api('create-account', {
        username: 'user0',
        password: 'password'
    });
    expect(badUsernameRes['session-id']).toBe(undefined);
    expect(badUsernameRes['error']).toHaveType('string');

    await cleanUp(sessions);

    await run('sudo pkill gunicorn');

    return true;
});
