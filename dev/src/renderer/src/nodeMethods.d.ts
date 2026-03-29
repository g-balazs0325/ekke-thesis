export interface Dialog {
  showError: (title: string, message: string) => void
}

declare global {
  interface Window {
    dialog: Dialog
  }
}
