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
    contextBridge.exposeInMainWorld('api', api) // This exposes window.api.askGemini
  } catch (error) {
    console.error(error)
  }
} else {
  // Fallback for older/less secure configurations
  window.electron = electronAPI
  window.api = api
}
