export {};

declare global {
    interface Window {
        Alpine: any;

        isSignedIn: () => Promise<boolean>;
        requireAuth: () => Promise<void>;
        api: (path: string, body: {[s: string]: any}) =>
            Promise<{error?: string, res: {[s: string]: any}}>;

        STAGING: boolean;
        WEB_ROOT: string;
        API_PORT: number;
        SESSION_ID: string;
        SERVER_URL: string;
    }
}

declare const Alpine: any;

declare const isSignedIn: () => Promise<boolean>;
declare const requireAuth: () => Promise<void>;

declare function api (path: string, body: {[s: string]: any}):
    Promise<{error?: string, res: {}} | {[s: string]: any}>;

declare const STAGING: boolean;
declare const WEB_ROOT: string;
declare const API_PORT: number;
declare const SESSION_ID: string;
declare const SERVER_URL: string;