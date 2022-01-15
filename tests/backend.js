const {run} = require('../build/utils.js');
const {test, expect} = require('../build/test.js');

const fetch = require('axios');
const fs = require("fs");

const n = 5;

let sessions = [];

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

test('clear log', () => {
    fs.truncateSync('server/log.txt', 0);
    expect(fs.readFileSync('server/log.txt').toString()).toEq('');
});

test('start backend server', async () => {
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
});

test('server is running', async () => {
    expect( (await api())['ok'] )
        .toBe(true);
});

test('generate users', async () => {
    for (let i = 0; i < n; i++) {
        const res = await api('create-account', {
            username: 'user' + i,
            password: 'password' + i
        });

        const session = res['session-id'];

        expect(!!session).toBe(true);

        sessions.push(session);
    }
});

test('invalid user creation', async () => {
    const res = await api('create-account', {
        username: 'user0',
        password: 'password'
    });
    expect(res['session-id']).toBe(undefined);
    expect(res['error']).toHaveType('string');
});

test('validate sessions', async () => {
    for (const session of sessions) {
        const res = await api('valid-session', {
            'session-id': session
        });

        expect(res).toHaveKeys(['valid', 'remaining']);
        expect(res['valid']).toBe(true);
    }
});

test('invalidate currently valid sessions', async () => {
    for (const session of sessions) {
        const res = await api('invalidate-session', {
            'session-id': session
        });

        expect(res['completed']).toBe(true);
    }
});

test('validate currently invalid sessions', async () => {
    for (const session of sessions) {
        const res = await api('valid-session', {
            'session-id': session
        });

        expect(res['valid']).toBe(false);
    }
});

test('log back in', async () => {
    for (let i = 0; i < n; i++) {
        const res = await api('open-session', {
            username: 'user' + i,
            password: 'password' + i
        });

        const session = res['session-id'];

        expect(res).toHaveKeys(['session-id']);
        expect(!!session).toBe(true);
        expect(session).toHaveType('string');

        sessions[i] = session;
    }
});

test('clean up', async () => {
    let i = 0;
    for (const session of sessions) {
        const res = await api('delete-account', {
            'session-id': session
        });

        expect(res).toEq({completed: true});
        i++;
    }
});

test('kill server', async () => {
    await run('sudo pkill gunicorn');
});
