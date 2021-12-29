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
        url: numbers + letters + letters.toUpperCase() + '- '
    },
    SITE_ROOT = 'https://lucidcrowd.uk',
    session = sessionStorage.getItem(`session-id`) || -1,
    SERVER_PORT = 12346,
    thisScript = document.getElementsByTagName('script')[0],
    cacheBust = 0; // (Math.random() + 1).toString(36).substring(7);

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
    return await (await fetch(
        SITE_ROOT + '/api/user-id-valid.php?id=' + localStorage.id
    )).text() === "1";
}

async function setAccountNavStuff () {
    const accountsNav = document.getElementById("account-nav");
    if (await isSignedIn()) {
        accountsNav.innerHTML = `
            <a href="${SITE_ROOT}/me" id="accountLink1" class="icon">
                <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM7.07 18.28c.43-.9 3.05-1.78 4.93-1.78s4.51.88 4.93 1.78C15.57 19.36 13.86 20 12 20s-3.57-.64-4.93-1.72zm11.29-1.45c-1.43-1.74-4.9-2.33-6.36-2.33s-4.93.59-6.36 2.33C4.62 15.49 4 13.82 4 12c0-4.41 3.59-8 8-8s8 3.59 8 8c0 1.82-.62 3.49-1.64 4.83zM12 6c-1.94 0-3.5 1.56-3.5 3.5S10.06 13 12 13s3.5-1.56 3.5-3.5S13.94 6 12 6zm0 5c-.83 0-1.5-.67-1.5-1.5S11.17 8 12 8s1.5.67 1.5 1.5S12.83 11 12 11z"/></svg>
            </a>
            <span class="label">Me</span>
        `;

    } else {
        accountsNav.innerHTML = `
            <li>
                <a href="${SITE_ROOT}/signup" class="icon">
                    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0-6c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm0 8c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4zm-6 4c.22-.72 3.31-2 6-2 2.7 0 5.8 1.29 6 2H9zm-3-3v-3h3v-2H6V7H4v3H1v2h3v3z"/></svg>
                </a>
                <span class="label">New Account</span>
            </li>
        `;
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