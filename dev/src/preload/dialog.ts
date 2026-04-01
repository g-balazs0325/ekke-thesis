import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('dialog', {
  showError(title: string, message: string) {
    ipcRenderer.send('dialog-show-error', title, message)
  },
  showInfo(title: string, message: string) {
    ipcRenderer.send('dialog-show-info', title, message)
  }
})
