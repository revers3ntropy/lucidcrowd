import type {} from '../../types/types';

const cal = new window.CalHeatMap();

const year   = new Date().getFullYear();
const month  = new Date().getMonth();
const day    = new Date().getDate();
const start  = new Date(year - 1, month + 1, day);


// docs: https://cal-heatmap.com/
cal.init({
    itemSelector: "#contributions-heatmap",
    domain: "month",
    subdomain: "day",
    start,
    cellSize: 11,
    displayLegend: true,
    cellRadius: 1,
    label: {
        position: "top"
    },
    tooltip: true,
    considerMissingDataAsZero: true,
    legendColors: [
        window.THEME === 'light' ? 'white' : 'black',
        '#18b4b7'
    ],
});

window.onThemeChange(() => {
    cal.setLegend(cal.options.legend, [
        window.THEME === 'light' ? 'white' : 'black',
        '#18b4b7'
    ]);
});

window.Alpine.store('userinfo', {
    username: '',

    async refresh () {

        const loadingTick = window.setInterval(() => {
            this.username += '.';
            if (this.username.length > 3) {
                this.username = '';
            }
        }, 250);

        const res = await window.api('private-info', {
            session: window.SESSION_ID
        });

        window.clearInterval(loadingTick);

        this.username = res['username'];

        const data: any[] = [];

        cal.update(data);
    }
});