'use strict'

import { app, protocol, BrowserWindow, shell, dialog } from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import installExtension, { VUEJS3_DEVTOOLS } from 'electron-devtools-installer'
const isDevelopment = process.env.NODE_ENV !== 'production'

var fs = require("fs")
var { default: srtParser2 } = require("srt-parser-2")
var parser = new srtParser2()
let whisper;
const axios = require('axios')
const { exec } = require('child_process');
const startServer = async () => {
  const express = require('express');
  var bodyParser = require('body-parser');
  const api = express();
  const port = 9861;

  api.use(bodyParser.json());
  // Comment this when in production
  const cors = require('cors');
  api.use(cors())

  api.get('/api/getDir', async function (req, res) {
    let path = await dialog.showOpenDialogSync({
      properties: ['openFile', 'openDirectory']
    })
    if (path) {
      res.send(path)
    } else {
      res.send(false)
    }
  });

  api.post('/api/getFile', async function (req, res) {
    let path = await dialog.showOpenDialogSync({
      defaultPath: req.body.workingDir,
      title: "Select Your File(s)",
      properties: [
        'openFile',
        'multiSelections',
        'createDirectory'
      ],
      filters: [
        // Limit to only audio file extensions
        // Create list of audio file extensions
        { name: 'Audio', extensions: ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'wma', 'aiff', 'au', 'ac3', 'amr', 'ape', 'dts', 'mka', 'mlp', 'tta', 'wv', 'webm', 'opus'] },
        { name: 'Video', extensions: ['mp4', 'mov', 'avi', 'mkv'] },
      ]
    })
    if (path) {
      res.send(path)
    } else {
      res.send(false)
    }
  });

  api.post('/api/openUrl', async function (req, res) {
    if (req.body.url) {
      shell.openExternal(req.body.url)
      res.send('ok')
    } else {
      res.send('No url provided')
    }
  });

  api.post('/api/openFolder', async function (req, res) {
    if (req.body.url) {
      shell.showItemInFolder(req.body.path)
      res.send('ok')
    } else {
      res.send('No url provided')
    }
  });

  api.post('/api/errorMessage', async function (req, res) {
    if (req.body.message && req.body.title) {
      dialog.showErrorBox(req.body.title, req.body.message)
    } else {
      res.send('Invalid message')
    }
  });

  api.post('/api/checkUpdate', async function (req, res) {
    if (req.body.version) {
      let version = req.body.version
      axios.get('https://api.github.com/repos/stianwiu/voiceset-maker/releases')
        .then(async function (response) {
          let latest = response.data[0].tag_name
          if (latest !== version) {
            res.send({ "version": latest })

            let update = await dialog.showMessageBoxSync({
              type: 'question',
              buttons: ['Yes', 'No'],
              title: 'Update Available',
              message: 'A new version of Voiceset Maker is available. Would you like to update it now?'
            })
            if (update === 0) {
              shell.openExternal(response.data[0].html_url)
            }
          }
        }).catch(function (error) {
          console.log(error);
        })
    } else {
      res.send('Invalid version')
    }
  });

  api.post('/api/start', async function (req, res) {
    if (!req.body.filePath) return res.status(400).send({ error: "No file path provided" })
    // Check if filePath is array
    if (Array.isArray(req.body.filePath)) {
      // Make sure all files in the array exist
      for (let i = 0; i < req.body.filePath.length; i++) {
        if (!fs.existsSync(req.body.filePath[i])) {
          res.send('File does not exist')
          return
        }
      }
    }

    if (!req.body.workingDir) return res.status(400).send({ error: "No working directory provided" })
    if (!req.body.whisperFlags) return res.status(400).send({ error: "No flags provided" })
    if (!req.body.modelName) return res.status(400).send({ error: "No model name provided" })
    if (!req.body.cuttingValue || req.body.cuttingValue < 1) return res.status(400).send({ error: "No cuttingValue provided" })

    let loop = 0
    let looping = true
    // Check if filePath is array
    if (Array.isArray(req.body.filePath)) {
      loop = req.body.filePath.length - 1
    }
    while (looping) {
      let filePath = req.body.filePath[loop]
      if (!fs.existsSync(filePath)) return res.status(400).send({ error: "File does not exist" })
      // Replace \\ with / for ffmpeg
      var fileName = filePath.split('\\').pop().split('/').pop()
      var workingDir = req.body.workingDir
      var flags = req.body.whisperFlags
      var modelName = req.body.modelName
      var cuttingValue = req.body.cuttingValue
      // Check if workingDir ends with a / if not add it
      if (workingDir[workingDir.length - 1] != "/") workingDir += "/"

      // First we need to process the file to create the subtitles
      whisper = exec('whisper ' + '"' + filePath + '" ' + flags, (err, stdout, stderr) => {
        if (err) {
          console.error(`exec error: ${err}`);
          res.status(400).send({ error: 'Whisper failed to run, please check whisper options. \n \n \n' + err })
        }
      });
      // Wait until the process is done
      await new Promise((resolve, reject) => {
        whisper.on('close', resolve);
        whisper.on('error', reject);
        // Print stdout
        whisper.stdout.on('data', (data) => {
          console.log(data);
        });
      });

      // Wait 3 seconds for redundancy
      await new Promise(resolve => setTimeout(resolve, 3000));
      var srt = fs.readFileSync(fileName + '.srt', 'utf8')
      var result = parser.fromSrt(srt);

      // Delete the extra files
      fs.unlinkSync(fileName + '.txt')
      fs.unlinkSync(fileName + '.vtt')

      // append the new folder name to the working directory
      workingDir += modelName + "/"

      // Create the new folder
      if (!fs.existsSync(workingDir)) {
        fs.mkdirSync(workingDir)
      }

      // Make sure wavs folder exists
      if (!fs.existsSync(workingDir + 'wavs')) {
        fs.mkdirSync(workingDir + 'wavs')
      }

      // Get the files in the folder
      var files = fs.readdirSync(workingDir + 'wavs')
      let newNumber2 = undefined
      // If there are files in the folder
      if (files.length > 0) {
        // Get the last file in the folder
        var lastFile = files[files.length - 1]
        // Remove everything before the first

        lastFile = lastFile.split("_")[1]

        // Increment the number by 1
        lastFile = parseInt(lastFile) + 1
        // Add the number to the file name
        newNumber2 = lastFile
        newNumber2 = newNumber2.toString()
        // Add 0s to the front of the number
        if (newNumber2.length == 1) newNumber2 = "00" + newNumber2
        if (newNumber2.length == 2) newNumber2 = "0" + newNumber2
      } else {
        // If there are no files in the folder then we can just make it 1
        newNumber2 = "001"
      }

      if (cuttingValue == 1) {
        for (var i = 1; i < result.length; i++) {
          var start = result[i].startTime;
          var end = result[i].endTime;
          var text = result[i].text;

          let newNumber = i.toString()
          if (newNumber.length == 1) newNumber = "0000" + newNumber
          if (newNumber.length == 2) newNumber = "000" + newNumber
          if (newNumber.length == 3) newNumber = "00" + newNumber
          if (newNumber.length == 4) newNumber = "0" + newNumber

          // Make sure file exists
          if (!fs.existsSync(workingDir + modelName + '.txt')) {
            // Create file
            fs.writeFileSync(workingDir + modelName + '.txt', 'wavs/' + modelName + '_' + newNumber2 + '_' + newNumber + '.wav' + '|' + text + "\n");
          } else {
            fs.appendFileSync(workingDir + modelName + '.txt', 'wavs/' + modelName + '_' + newNumber2 + '_' + newNumber + '.wav' + '|' + text + "\n")
          }

          // Make timestamp readable by removing everything behind ,
          start = start.replace(",", ".");
          end = end.replace(",", ".");
          // Calculate duration by turning start and end into seconds and subtracting them
          var startSeconds = start.split(":").reduce((acc, time) => (60 * acc) + +time);
          var endSeconds = end.split(":").reduce((acc, time) => (60 * acc) + +time);
          var duration = endSeconds - startSeconds;
          // MAke sure duration is not 0 seconds
          if (duration == 0) {
            duration = 1;
          }
          // Make sure duration is not negative
          if (duration < 0) {
            dialog.showErrorBox("Error while cutting", "There was a subtitle with negative time value. Skipping it for now.")
            return console.log("Error: Duration is negative");
          }
          console.log(start, end, duration, text);

          // Make sure audio is mono 22.050kHz using exec
          const child = exec('ffmpeg' + ' -i ' + '"' + filePath + '"' + ' -ss ' + start + ' -t ' + duration + ' -ac 1 -ar 22050 ' + '"' + workingDir + '"' + 'wavs/' + '"' + modelName + '"' + '_' + newNumber2 + '_' + newNumber + '.wav', (err, stdout, stderr) => {
            if (err) {
              console.error(`exec error: ${err}`);
            }
          });
          // Wait until the process is done
          await new Promise((resolve, reject) => {
            child.on('close', resolve);
            child.on('error', reject);
          });
        }
      } else {
        for (var i = 1; i < result.length; i++) {
          for (var j = i; j < i + cuttingValue; j++) {
            try {
              var start = result[j].startTime;
              var end = result[j].endTime;
              var text = result[j].text;

              let newNumber = j.toString()
              if (newNumber.length == 1) newNumber = "0000" + newNumber
              if (newNumber.length == 2) newNumber = "000" + newNumber
              if (newNumber.length == 3) newNumber = "00" + newNumber
              if (newNumber.length == 4) newNumber = "0" + newNumber

              // Make sure file exists
              if (!fs.existsSync(workingDir + modelName + '.txt')) {
                // Create file
                fs.writeFileSync(workingDir + modelName + '.txt', 'wavs/' + modelName + '_' + newNumber2 + '_' + newNumber + '.wav' + '|' + text + "\n");
              } else {
                fs.appendFileSync(workingDir + modelName + '.txt', 'wavs/' + modelName + '_' + newNumber2 + '_' + newNumber + '.wav' + '|' + text + "\n")
              }

              // Make timestamp readable by removing everything behind ,
              start = start.replace(",", ".");
              end = end.replace(",", ".");
              // Calculate duration by turning start and end into seconds and subtracting them
              var startSeconds = start.split(":").reduce((acc, time) => (60 * acc) + +time);
              var endSeconds = end.split(":").reduce((acc, time) => (60 * acc) + +time);
              var duration = endSeconds - startSeconds;
              // MAke sure duration is not 0 seconds
              if (duration == 0) {
                duration = 1;
              }
              // Make sure duration is not negative
              if (duration < 0) {
                dialog.showErrorBox("Error while cutting", "There was a subtitle with negative time value. Skipping it for now.")
                return console.log("Error: Duration is negative");
              }
              console.log(start, end, duration, text);

              // Make sure audio is mono 22.050kHz using exec
              const child = exec('ffmpeg' + ' -i ' + '"' + filePath + '"' + ' -ss ' + start + ' -t ' + duration + ' -ac 1 -ar 22050 ' + '"' + workingDir + '"' + 'wavs/' + '"' + modelName + '"' + '_' + newNumber2 + '_' + newNumber + '.wav', (err, stdout, stderr) => {
                if (err) {
                  console.error(`exec error: ${err}`);
                }
              });
            } catch (error) {
              console.log("Finished cutting")
            }
          }
          i = i + cuttingValue - 1;
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }


      fs.unlinkSync(fileName + '.srt')
      shell.showItemInFolder(workingDir);
      loop--;
      if (loop < 0) {
        res.status(200).send('finished')
        looping = false
      }
    }
  });

  api.get('/api/dependencies', async function (req, res) {
    // Check if whisper is installed
    let ffmpeg = undefined;
    let whisper = undefined;

    const child = exec('whisper --help', (err, stdout, stderr) => {
      if (err) {
        whisper = false;
      } else {
        whisper = true;
      }
    });

    // Wait until the process is done
    await new Promise((resolve, reject) => {
      child.on('close', resolve);
      child.on('error', reject);
    });
    // Check if ffmpeg is installed
    const child2 = exec('ffmpeg --help', (err, stdout, stderr) => {
      if (err) {
        ffmpeg = false;
      } else {
        ffmpeg = true;
      }
    });

    // Wait until the process is done
    await new Promise((resolve, reject) => {
      child2.on('close', resolve);
      child2.on('error', reject);
    });
    res.send({ ffmpeg: ffmpeg, whisper: whisper })
  });

  api.listen(port, async function () {
    console.log(`Server listening on port ${port} | ${new Date()}`);
  })
}

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } }
])

async function createWindow() {
  // Create the browser window.
  const win = new BrowserWindow({
    width: 800,
    height: 800,
    webPreferences: {
      // Use pluginOptions.nodeIntegration, leave this alone
      // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
      nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION,
      contextIsolation: !process.env.ELECTRON_NODE_INTEGRATION
    }
  })
  win.setMenuBarVisibility(false)

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    await win.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
    if (!process.env.IS_TEST) win.webContents.openDevTools()
  } else {
    createProtocol('app')
    // Load the index.html when not in development
    win.loadURL('app://./index.html')
  }
}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
    exec('taskkill /F /T /IM whisper.exe');
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    try {
      await installExtension(VUEJS3_DEVTOOLS)
    } catch (e) {
      console.error('Vue Devtools failed to install:', e.toString())
    }
  }
  createWindow()
  startServer()
})

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', (data) => {
      if (data === 'graceful-exit') {
        app.quit()
        exec('taskkill /F /T /IM whisper.exe');
      }
    })
  } else {
    process.on('SIGTERM', () => {
      // Stop python process
      app.quit()
      exec('taskkill /F /T /IM whisper.exe');
    })
  }
}
