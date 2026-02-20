import { contextBridge, ipcRenderer } from 'electron' // Added ipcRenderer
import { electronAPI } from '@electron-toolkit/preload'

// 1. Add your custom bridge function here
const api = {
  // This sends a message to the Main process and waits for the AI result
  askGemini: (prompt) => ipcRenderer.invoke('ask-ai', prompt)
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
