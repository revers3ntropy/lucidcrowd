const {run} = require('../utils.js');
const {test, expect} = require('../test.js');

const fetch = require('axios');
const fs = require("fs");

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

        expect(!!session).toBe(true);

        sessions.push(session);
    }

    return sessions;
}

async function validateSessions (sessions) {
    for (const session of sessions) {
        const res = await api('valid-session', {
            'session-id': session
        });

        expect(res['valid']).toBe(true);
    }
}

async function inValidateSessions (sessions) {
    for (const session of sessions) {
        const res = await api('invalidate-session', {
            'session-id': session
        });

        expect(res['completed']).toBe(true);
    }
}

async function validateInvalidSessions (sessions) {
    for (const session of sessions) {
        const res = await api('valid-session', {
            'session-id': session
        });

        expect(res['valid']).toBe(false);
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

        expect(res['completed']).toBe(true);
        i++;
    }
    // kill server
    await run('sudo pkill gunicorn');
}


async function invalidUser () {
    const badUsernameRes = await api('create-account', {
        username: 'user0',
        password: 'password'
    });
    expect(badUsernameRes['session-id']).toBe(undefined);
    expect(badUsernameRes['error']).toHaveType('string');
}

function clearLog () {
    fs.truncateSync('server/log.txt', 0);
    expect(fs.readFileSync('server/log.txt')).toEq('');
}

function serverRunning () {
    expect( (await api())['ok'] )
        .toBe(true);
}

test(async () => {
    clearLog();

    await startBackend();
    await serverRunning();

    const sessions = await generateUsers(5);

    await validateSessions(sessions);
    await inValidateSessions(sessions);
    await validateInvalidSessions(sessions);

    await cleanUp(sessions);
    return true;
});
