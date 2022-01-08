export {};

declare global {
    interface Window {
        Alpine: any;

        isSignedIn: () => Promise<boolean>;
        api: (path: string, body: {[s: string]: any}) => Promise<{error?: string, res: {[s: string]: any}}>;

        STAGING: boolean;
        WEB_ROOT: string;
        API_PORT: number;
        SESSION_ID: string;
    }
}