export {};

declare global {
  interface Window {
    api: {
      minimizeWindow: () => void;
      maximizeWindow: () => void;
      closeWindow: () => void;
      checkWindows: () => void;
      onFunctionFinished: (callback: (message: string) => void) => void;
    };
  }
}
