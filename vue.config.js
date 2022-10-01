const { defineConfig } = require('@vue/cli-service')
module.exports = {
  pluginOptions: {
    electronBuilder: {
      builderOptions: {
        productName: "Voiceset Maker",
        appId: 'VoiceSetMaker',
        win: {
          "target": [
            "nsis"
          ],
          icon: 'public/icon.png',
        },
        "nsis": {
          "installerIcon": "public/favicon.ico",
          "uninstallerIcon": "public/favicon.ico",
          "uninstallDisplayName": "Voiceset Maker",
          "license": "public/license",
          "oneClick": false,
          "allowToChangeInstallationDirectory": true
        }
      },
    },
  },
}
