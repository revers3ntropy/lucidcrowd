Alpine.store('leaderboard', {
    data: [],
    options: {
        top: 10
    },
    async load () {
        await api('leaderboard', {
            session: window.SESSION_ID,
            options: this.options
        });
    }
});