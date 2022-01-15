import type {} from '../../types/types';

document.title = 'Log In';

window.Alpine.store('main', {
    username: '',
    password: '',
    error: '',
    async signIn (username: string, password: string) {
        const res = await window.api('open-session', {
            username, password
        });

        if (res.error) {
            this.error = res.error;
            return;
        }

        if (!res['valid']) {
            this.error = 'Something went wrong, please try again';
            return
        }

        console.log(res);
    },


    async createAccount (username: string, password: string) {

    }
});
