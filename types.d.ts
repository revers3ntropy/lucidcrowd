export {};

declare global {
    interface Window {
        Alpine: any;

        isSignedIn: () => Promise<boolean>;
        api: (path: string, body: {[s: string]: any}) => Promise<{error?: string, res: {[s: string]: any}}>;
    }
}