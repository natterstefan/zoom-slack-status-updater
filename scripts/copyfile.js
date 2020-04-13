const fs = require('fs')
const path = require('path')

const exampleFile = path.join(__dirname, '../slack-status-config-example.js')
const configFile = path.join(__dirname, '../slack-status-config.js')

/**
 * prepare the app config based on the given example config file.
 */
fs.exists(configFile, (exists) => {
  if (exists) {
    console.log('slack-status-config.js exists already.')
    return
  }

  fs.copyFile(exampleFile, configFile, (err) => {
    if (err) {
      throw err
    }

    console.log(
      'slack-status-config-example.js was copied to slack-status-config.js',
    )
  })
})
