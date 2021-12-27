/*
 * Add this script to every page. Only link required for CSS, scripts and JQuery etc.
 * Imports other scripts with the 'scripts' attribute, separated by comma.
 * Import CSS with 'styles' attribute.
 */

const
    urlParams = new URLSearchParams(window.location.search),
    numbers = '0123456789',
    letters = 'abcdefghijklmnopqrstuvwxyz',
    CHARSETS = {
        numeric: numbers,
        hex: numbers + 'abcdef',
        alphalower: letters,
        alpha: letters + letters.toUpperCase(),
        alphanumeric: numbers + letters + letters.toUpperCase(),
        base64: numbers + letters + letters.toUpperCase() + '+/',
        url: numbers + letters + letters.toUpperCase() + '-_'
    },
    SITE_ROOT = 'http://localhost:63342/lucidcrowd/public_html', //`https://lucidcrowd.ai`,
    session = sessionStorage.getItem(`session-id`) || -1,
    SERVER_PORT = 12346,
    thisScript = document.getElementsByTagName('script')[0],
    cacheBust = 0; // (Math.random() + 1).toString(36).substring(7);

if (!localStorage.getItem("theme"))
    localStorage.setItem('theme', 'light');
let DARK_MODE = localStorage.getItem("theme") === "dark";

const LIGHT_THEME_ICON = `
    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000">
        <rect fill="none" height="24" width="24"/>
        <path d="M12,9c1.65,0,3,1.35,3,3s-1.35,3-3,3s-3-1.35-3-3S10.35,9,12,9 M12,7c-2.76,0-5,2.24-5,5s2.24,5,5,5s5-2.24,5-5 S14.76,7,12,7L12,7z M2,13l2,0c0.55,0,1-0.45,1-1s-0.45-1-1-1l-2,0c-0.55,0-1,0.45-1,1S1.45,13,2,13z M20,13l2,0c0.55,0,1-0.45,1-1 s-0.45-1-1-1l-2,0c-0.55,0-1,0.45-1,1S19.45,13,20,13z M11,2v2c0,0.55,0.45,1,1,1s1-0.45,1-1V2c0-0.55-0.45-1-1-1S11,1.45,11,2z M11,20v2c0,0.55,0.45,1,1,1s1-0.45,1-1v-2c0-0.55-0.45-1-1-1C11.45,19,11,19.45,11,20z M5.99,4.58c-0.39-0.39-1.03-0.39-1.41,0 c-0.39,0.39-0.39,1.03,0,1.41l1.06,1.06c0.39,0.39,1.03,0.39,1.41,0s0.39-1.03,0-1.41L5.99,4.58z M18.36,16.95 c-0.39-0.39-1.03-0.39-1.41,0c-0.39,0.39-0.39,1.03,0,1.41l1.06,1.06c0.39,0.39,1.03,0.39,1.41,0c0.39-0.39,0.39-1.03,0-1.41 L18.36,16.95z M19.42,5.99c0.39-0.39,0.39-1.03,0-1.41c-0.39-0.39-1.03-0.39-1.41,0l-1.06,1.06c-0.39,0.39-0.39,1.03,0,1.41 s1.03,0.39,1.41,0L19.42,5.99z M7.05,18.36c0.39-0.39,0.39-1.03,0-1.41c-0.39-0.39-1.03-0.39-1.41,0l-1.06,1.06 c-0.39,0.39-0.39,1.03,0,1.41s1.03,0.39,1.41,0L7.05,18.36z"/>
    </svg>
`;

const DARK_THEME_ICON = `
    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000">
        <rect fill="none" height="24" width="24"/>
        <path d="M9.37,5.51C9.19,6.15,9.1,6.82,9.1,7.5c0,4.08,3.32,7.4,7.4,7.4c0.68,0,1.35-0.09,1.99-0.27C17.45,17.19,14.93,19,12,19 c-3.86,0-7-3.14-7-7C5,9.07,6.81,6.55,9.37,5.51z M12,3c-4.97,0-9,4.03-9,9s4.03,9,9,9s9-4.03,9-9c0-0.46-0.04-0.92-0.1-1.36 c-0.98,1.37-2.58,2.26-4.4,2.26c-2.98,0-5.4-2.42-5.4-5.4c0-1.81,0.89-3.42,2.26-4.4C12.92,3.04,12.46,3,12,3L12,3z"/>
    </svg>
`;

const ALERT_BANNER = document.createElement('div');
ALERT_BANNER.style = {
    ...ALERT_BANNER.style,
    display: 'none',
    padding: '20px',
    color: 'var(--text-colour)',
    backgroundColor:'var(--border-lighter)',
    position: 'absolute',
    right: '50%',
    transition: 'opacity 0.5s',
    borderRadius: '10px',
};

document.body.appendChild(ALERT_BANNER);

function alertBanner(msg) {
    ALERT_BANNER.style.display = 'flex';
    ALERT_BANNER.innerHTML = `
            ${msg}
            <span class="closebtn" onclick="this.parentElement.style.display='none';">&times;</span>
        `;
    setTimeout(() => {
        ALERT_BANNER.style.display = "none";
    }, 3000);
}

// src: https://stackoverflow.com/questions/400212/how-do-i-copy-to-the-clipboard-in-javascript
function fallbackCopyTextToClipboard(text) {
    const textArea = document.createElement("textarea");
    textArea.value = text;

    // Avoid scrolling to bottom
    textArea.style.opacity = '0';
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
        var successful = document.execCommand('copy');
        alertBanner(successful ? 'Copied Successfully!' : 'Copy failed');
    } catch (err) {
        console.error('Fallback: Oops, unable to copy', err);
    }

    document.body.removeChild(textArea);
}
function copy(text) {
    if (!navigator.clipboard) {
        fallbackCopyTextToClipboard(text);
        return;
    }
    navigator.clipboard.writeText(text).then(function() {
        alertBanner('Copied Successfully!');
    }, (err) => {
        alertBanner('Copy failed: ' + err);
    });
}

function loadScript(url, isModule=true) {
    return new Promise((resolve) => {
        const script = document.createElement( "script");
        if (isModule)
            script.setAttribute('type', 'module');
        if (script.readyState) {
            script.onreadystatechange = function() {
                if (script.readyState === "loaded" || script.readyState === "complete") {
                    script.onreadystatechange = null;
                    resolve();
                }
            };
        } else
            script.onload = resolve;

        script.src = url;
        document.getElementsByTagName( "head" )[0].appendChild( script );
    });
}

function loadURLParamScripts () {
    return new Promise(async resolve => {

        const scripts = thisScript.getAttribute('scripts');
        if (scripts)
            for (const url of scripts.split(','))
                await loadScript(url + '?x=' + cacheBust);

        resolve();
    });
}

function addNavAndFooter () {
    return new Promise(resolve => {
        $("nav").load(`${SITE_ROOT}/nav.html?x=${cacheBust}`, () => {
            $("footer").load(`${SITE_ROOT}/footer.html?x=${cacheBust}`, () => {
                resolve();
            });
        });
    });
}

// --- Load CSS ----
/**
 * @param url
 */
function loadStyle (url) {
    return new Promise(resolve => {
        const head = document.getElementsByTagName('head')[0];
        const s = document.createElement('link');
        s.setAttribute('rel', 'stylesheet');
        s.setAttribute('href', `${url}?x=${cacheBust}`);
        head.appendChild(s);
        s.onload = resolve;
    });
}

// --- Backend API --
/**
 * Make sure the connection is open and throw appropriate error if it not.
 * Wont redirect if url parameter 'doNetworkError' is 0
 */
function networkError () {
    console.log(`Can't connect to the server!`);
    if (thisScript.getAttribute('doNetworkError') == '0') return;
    let location = window.location.href;
    window.location.href = SITE_ROOT + '/error?type=serverConnection&cb=' + encodeURIComponent(location);
}

/**
 * Make request to backend API. No '/' required at start.
 * @param {string} handler
 * @param {object} body
 * @return {Promise<object>}
 */
window.request = async function request (handler, body={}) {

    let response = await fetch(`https://lucidcrowd.ai:${SERVER_PORT}/${handler}`, {
        method: 'POST',
        body: JSON.stringify({
            ...body,
            session
        })
    })
        .catch(networkError);

    try {
        return await response.json();
    } catch (e) {
        console.log(`request to '${handler}' failed: ${e}`);
        return {};
    }
}

// test network connection
async function testConnection () {
    try {
        const ping = await request('ping')
            .catch(networkError);
        if (!ping.ok)
            networkError();
    } catch (E) {
        networkError();
    }
}

function loadURLParamStyles () {
    return new Promise(async resolve => {

        const styles = thisScript.getAttribute('styles');
        if (styles)
            for (const url of styles.split(','))
                await loadStyle(url);

        resolve();
    });
}

async function isSignedIn () {
    if (!localStorage.id) return false;
    return await (await fetch('https://revers3ntropy.com/accounts/backend/user-id-valid.php?id=' + localStorage.id)).text() === "1";
}

function timeConnection () {
    (async function () {
        const start = performance.now();
        const iterations = 20;
        for (let i = 0; i < iterations; i++)
            await request('ping');
        const total = performance.now() - start;

        console.log(`Server Ping: ${(total/iterations).toFixed(1)}ms (avg of ${iterations})`)
    })();
}

let cachedTheme;
function detectColorScheme(MODE_BUTTON) {
    // default to light
    let theme = "light";

    // local storage is used to override OS theme settings
    if (DARK_MODE) {
        theme = "dark";
    } else if (!window.matchMedia) {
        // matchMedia method not supported
        return false;
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        // OS theme setting detected as dark
        theme = "dark";
    }

    if (MODE_BUTTON) {
        MODE_BUTTON.innerHTML = DARK_MODE ? DARK_THEME_ICON : LIGHT_THEME_ICON;
    }

    // slow down the transition to make it look cooler
    if (cachedTheme && cachedTheme !== theme) {
        document.documentElement.setAttribute("data-transitioning", "yes");
        setTimeout(() => {
            document.documentElement.setAttribute("data-transitioning", "no");
        }, 500);
    }

    cachedTheme = theme;
    document.documentElement.setAttribute("data-theme", theme);
}

async function setAccountNavStuff () {
    const accountsNav = document.getElementById("account-nav");
    if (await isSignedIn()) {
        accountsNav.innerHTML = `
            <a href="${SITE_ROOT}/@" id="accountLink1" class="icon">
                <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM7.07 18.28c.43-.9 3.05-1.78 4.93-1.78s4.51.88 4.93 1.78C15.57 19.36 13.86 20 12 20s-3.57-.64-4.93-1.72zm11.29-1.45c-1.43-1.74-4.9-2.33-6.36-2.33s-4.93.59-6.36 2.33C4.62 15.49 4 13.82 4 12c0-4.41 3.59-8 8-8s8 3.59 8 8c0 1.82-.62 3.49-1.64 4.83zM12 6c-1.94 0-3.5 1.56-3.5 3.5S10.06 13 12 13s3.5-1.56 3.5-3.5S13.94 6 12 6zm0 5c-.83 0-1.5-.67-1.5-1.5S11.17 8 12 8s1.5.67 1.5 1.5S12.83 11 12 11z"/></svg>
            </a>
            <span class="label">Me</span>
        `;

    } else {
        accountsNav.innerHTML = `
             <a href="${SITE_ROOT}/sign-in" class="icon">
                <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><g><rect fill="none" height="24" width="24"/></g><g><path d="M11,7L9.6,8.4l2.6,2.6H2v2h10.2l-2.6,2.6L11,17l5-5L11,7z M20,19h-8v2h8c1.1,0,2-0.9,2-2V5c0-1.1-0.9-2-2-2h-8v2h8V19z"/></g></svg>
            </a>
            <span class="label">Sign In</span>
        `;

        accountsNav.insertAdjacentHTML('afterend', `
            <li>
                <a href="${SITE_ROOT}/signup" class="icon">
                    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0-6c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm0 8c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4zm-6 4c.22-.72 3.31-2 6-2 2.7 0 5.8 1.29 6 2H9zm-3-3v-3h3v-2H6V7H4v3H1v2h3v3z"/></svg>
                </a>
                <span class="label">New Account</span>
            </li>
        `);
    }
}

async function main () {
    await loadStyle(SITE_ROOT + '/index.css')
    await loadURLParamStyles();
    // await testConnection()
    await loadScript(SITE_ROOT + '/$.js', false)
    await addNavAndFooter();
    await loadURLParamScripts();
    await setAccountNavStuff();
}

window.onload = main;