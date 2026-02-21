import { app, shell, BrowserWindow, ipcMain, desktopCapturer, screen } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import dotenv from 'dotenv'

import OpenAI from 'openai'

dotenv.config();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

const openrouter = OPENROUTER_API_KEY ? new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: OPENROUTER_API_KEY,
}) : null;



function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    fullscreen: true,
    resizable: false,    // Disables dragging the corners to resize
    maximizable: false,  // Disables the maximize button
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      plugins: true,
      webSecurity: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  ipcMain.handle('ask-ai', async (event, prompt, images) => {
    console.log("--- AI HANDLER TRIGGERED ---");
    console.log("Received prompt:", prompt ? "Yes" : "No");
    console.log("Received images:", Array.isArray(images) ? `Yes, count: ${images.length}` : "No");
    if (Array.isArray(images) && images.length > 0) {
      console.log("First image MIME type:", images[0].mimeType);
    }

    if (!openrouter) {
      return "Error: OpenRouter Client not initialized.";
    }

    try {
      const messageContent = [{ type: 'text', text: prompt }];

      if (Array.isArray(images) && images.length > 0) {
        for (const image of images) {
          if (image.data && image.mimeType) {
            const imageUrl = `data:${image.mimeType};base64,${image.data}`;
            messageContent.push({
              type: 'image_url',
              image_url: { url: imageUrl },
            });
          }
        }
      }

      console.log(`Sending payload with ${messageContent.length - 1} image(s) to OpenRouter...`);
      const response = await openrouter.chat.completions.create({
        model: "anthropic/claude-3.5-sonnet",
        messages: [{ role: 'user', content: messageContent }],
      });

      return response.choices[0].message.content;

    } catch (error) {
      console.error("OpenRouter IPC Handler Error:", error);
      return `Error from AI service: ${error.message}`;
    }
  });




  ipcMain.handle('capture-screen', async (event, rect = null) => {
    try {
      const senderWindow = BrowserWindow.fromWebContents(event.sender);
      if (!senderWindow) {
        throw new Error('Could not find the browser window that sent the request.');
      }

      const currentDisplay = screen.getDisplayMatching(senderWindow.getBounds());

      const sources = await desktopCapturer.getSources({
        types: ['screen'],
        thumbnailSize: currentDisplay.size,
      });

      const targetSource = sources.find(
        (source) => source.display_id === currentDisplay.id.toString()
      );

      if (!targetSource) {
        throw new Error(`Could not find a capture source for the current display (ID: ${currentDisplay.id})`);
      }

      let capturedImage = targetSource.thumbnail;
      let croppedImage = null;
      if (rect && typeof rect === 'object' && rect.width > 0 && rect.height > 0) {
        const cropRect = {
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        };

        croppedImage = capturedImage.crop(cropRect);
      }

      const dataUrlCaptured = capturedImage.toDataURL();

      if (!croppedImage){
        return [dataUrlCaptured];
      }
      else{
        const dataUrlCropped = croppedImage.toDataURL();

        return [dataUrlCaptured, dataUrlCropped];
      }


    } catch (error) {
      console.error('Failed to capture screen:', error);
      return null;
    }
  });



  createWindow()

  app.on('activate', async function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
