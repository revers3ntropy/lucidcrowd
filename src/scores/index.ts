import type {} from '../../types/types';

window.Alpine.store('leaderboard', {
    data: [],
    options: {
        top: 10
    },
    async load () {
        await window.api('leaderboard', {
            session: window.SESSION_ID,
            options: this.options
        });
    }
});
