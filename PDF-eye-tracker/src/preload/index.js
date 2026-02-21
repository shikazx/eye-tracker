import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  askAI: (prompt, images) =>
    ipcRenderer.invoke('ask-ai', prompt, images),
  captureScreen: (rect) => ipcRenderer.invoke('capture-screen', rect),
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {

  window.electron = electronAPI
  window.api = api
}
