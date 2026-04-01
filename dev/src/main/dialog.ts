import { BrowserWindow, dialog, ipcMain } from 'electron/main'

ipcMain.on('dialog-show-error', (event, title: string, message: string) => {
  const window = BrowserWindow.fromWebContents(event.sender)
  dialog.showMessageBox(window, {
    type: 'error',
    title: title,
    message: message
  })
})

ipcMain.on('dialog-show-info', (event, title: string, message: string) => {
  const window = BrowserWindow.fromWebContents(event.sender)
  dialog.showMessageBox(window, {
    type: 'info',
    title: title,
    message: message
  })
})
