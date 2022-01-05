// TS
import './types.d.ts';

// LESS
import './styles/main.less';
import './styles/fonts.less';
import './styles/animation.less';

// ALPINE
// alpine types. Alpine object is already a property of window
import Alpine from 'alpinejs';
import 'alpinejs';

const STAGING = !!window.location.href.match(/https:\/\/staging.lucidcrowd.uk(\/.*)*$/)

const WEB_ROOT = `https://${STAGING ? 'staging.' : ''}lucidcrowd.uk`;
const API_PORT = STAGING ? 56787 : 56786;

const SESSION_ID = sessionStorage.getItem('session-id');

Alpine.store('theme', {
    init () {
        localStorage.theme ??= 'dark';
    },
    value: localStorage.theme,
    toggle () {
        localStorage.theme = this.value === 'dark' ? 'light' : 'dark';
        this.value = localStorage.theme;
    }
});

Alpine.store('general', {
    WEB_ROOT,
    API_PORT,
    SESSION_ID
});

Alpine.store('icons', {
    get lightTheme () { return `
        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000">
            <rect fill="none" height="24" width="24"/>
            <path d="M12,9c1.65,0,3,1.35,3,3s-1.35,3-3,3s-3-1.35-3-3S10.35,9,12,9 M12,7c-2.76,0-5,2.24-5,5s2.24,5,5,5s5-2.24,5-5 S14.76,7,12,7L12,7z M2,13l2,0c0.55,0,1-0.45,1-1s-0.45-1-1-1l-2,0c-0.55,0-1,0.45-1,1S1.45,13,2,13z M20,13l2,0c0.55,0,1-0.45,1-1 s-0.45-1-1-1l-2,0c-0.55,0-1,0.45-1,1S19.45,13,20,13z M11,2v2c0,0.55,0.45,1,1,1s1-0.45,1-1V2c0-0.55-0.45-1-1-1S11,1.45,11,2z M11,20v2c0,0.55,0.45,1,1,1s1-0.45,1-1v-2c0-0.55-0.45-1-1-1C11.45,19,11,19.45,11,20z M5.99,4.58c-0.39-0.39-1.03-0.39-1.41,0 c-0.39,0.39-0.39,1.03,0,1.41l1.06,1.06c0.39,0.39,1.03,0.39,1.41,0s0.39-1.03,0-1.41L5.99,4.58z M18.36,16.95 c-0.39-0.39-1.03-0.39-1.41,0c-0.39,0.39-0.39,1.03,0,1.41l1.06,1.06c0.39,0.39,1.03,0.39,1.41,0c0.39-0.39,0.39-1.03,0-1.41 L18.36,16.95z M19.42,5.99c0.39-0.39,0.39-1.03,0-1.41c-0.39-0.39-1.03-0.39-1.41,0l-1.06,1.06c-0.39,0.39-0.39,1.03,0,1.41 s1.03,0.39,1.41,0L19.42,5.99z M7.05,18.36c0.39-0.39,0.39-1.03,0-1.41c-0.39-0.39-1.03-0.39-1.41,0l-1.06,1.06 c-0.39,0.39-0.39,1.03,0,1.41s1.03,0.39,1.41,0L7.05,18.36z"/>
        </svg>
    `;},
    get darkTheme () { return `
        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000">
            <rect fill="none" height="24" width="24"/>
            <path d="M9.37,5.51C9.19,6.15,9.1,6.82,9.1,7.5c0,4.08,3.32,7.4,7.4,7.4c0.68,0,1.35-0.09,1.99-0.27C17.45,17.19,14.93,19,12,19 c-3.86,0-7-3.14-7-7C5,9.07,6.81,6.55,9.37,5.51z M12,3c-4.97,0-9,4.03-9,9s4.03,9,9,9s9-4.03,9-9c0-0.46-0.04-0.92-0.1-1.36 c-0.98,1.37-2.58,2.26-4.4,2.26c-2.98,0-5.4-2.42-5.4-5.4c0-1.81,0.89-3.42,2.26-4.4C12.92,3.04,12.46,3,12,3L12,3z"/>
        </svg>
    `;},
    get account () { return `
        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000">
            <path d="M0 0h24v24H0V0z" fill="none"/>
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM7.07 18.28c.43-.9 3.05-1.78 4.93-1.78s4.51.88 4.93 1.78C15.57 19.36 13.86 20 12 20s-3.57-.64-4.93-1.72zm11.29-1.45c-1.43-1.74-4.9-2.33-6.36-2.33s-4.93.59-6.36 2.33C4.62 15.49 4 13.82 4 12c0-4.41 3.59-8 8-8s8 3.59 8 8c0 1.82-.62 3.49-1.64 4.83zM12 6c-1.94 0-3.5 1.56-3.5 3.5S10.06 13 12 13s3.5-1.56 3.5-3.5S13.94 6 12 6zm0 5c-.83 0-1.5-.67-1.5-1.5S11.17 8 12 8s1.5.67 1.5 1.5S12.83 11 12 11z"/>
        </svg>
    `;},
});

window.api = async (path, body) => {
    console.log(API_PORT);
    try {
        const fetchRes = await fetch(`${WEB_ROOT}:${API_PORT}/${path}`, {
            method: 'POST',
            body: JSON.stringify(body)
        });

        const res = await fetchRes.text();

        return {
            error: '',
            res: JSON.parse(res)
        };
    } catch (e: any) {
        return {
            error: e.toString(),
            res: {}
        };
    }
}

window.isSignedIn = async () => {
    if (!SESSION_ID) {
        return false;
    }

    const res = await window.api('valid-session', {
        'session-id': SESSION_ID
    });

    if (typeof res.res['valid'] !== 'boolean') {
        return false;
    }

    return res.res['valid'];
}


Alpine.start();