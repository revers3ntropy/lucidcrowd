import type {} from '../../types/types';

document.title = 'Log In';

window.Alpine.store('main', {
    username: '',
    password: '',
    error: '',
    async redirectFromSessionID (res: any) {
        if (res['error']) {
            this.error = res['error'];
            return;
        }

        if (!res['valid'] || !res['session-id']) {
            this.error = 'Something went wrong, please try again';
            return
        }

        window.setSessionID(res['session-id']);

        window.location.assign(window.WEB_ROOT);
    },

    async signIn (username: string, password: string) {
        const res = await window.api('open-session', {
            username, password
        });

        await this.redirectFromSessionID(res);
    },
    async createAccount (username: string, password: string) {
        const res = await window.api('create-account', {
            username, password
        });

        await this.redirectFromSessionID(res);
    }
});
