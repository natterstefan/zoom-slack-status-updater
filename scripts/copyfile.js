const fs = require('fs')
const path = require('path')

const exampleFiles = [
  path.join(__dirname, '../slack-status-config-example.js'),
  path.join(__dirname, '../.env.example'),
]
const configFiles = [
  path.join(__dirname, '../slack-status-config.js'),
  path.join(__dirname, '../.env'),
]

/**
 * prepare the app config based on the given example config file.
 */

configFiles.forEach((configFile, i) => {
  fs.exists(configFile, (exists) => {
    if (exists) {
      console.log(configFile + ' exists already.')
      return
    }

    fs.copyFile(exampleFiles[i], configFile, (err) => {
      if (err) {
        throw err
      }

      console.log(configFile + ' copied')
    })
  })
})
