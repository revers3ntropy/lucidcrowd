export {};

declare global {
    interface Window {
        Alpine: any;

        isSignedIn: () => Promise<boolean>;
        requireAuth: () => Promise<void>;
        api: (path: string, body: {[s: string]: any}) =>
            Promise<{error?: string, res: {[s: string]: any}}>;

        STAGING: boolean;
        DEV: boolean;
        WEB_ROOT: string;
        API_PORT: number;
        SESSION_ID: string;
        SERVER_URL: string;
    }
}

declare const Alpine: any;