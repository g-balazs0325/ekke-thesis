import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('dialog', {
  showError(title: string, message: string) {
    ipcRenderer.send('dialog-show-error', title, message)
  }
})
