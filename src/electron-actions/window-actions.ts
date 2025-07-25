export const minimizeWindow = () => {
  if (window?.api) {
    window?.api.minimizeWindow();
  }
};
export const maximizeWindow = () => {
  if (window?.api) {
    window?.api.maximizeWindow();
  }
};
export const closeWindow = () => {
  if (window?.api) {
    window?.api.closeWindow();
  }
};
