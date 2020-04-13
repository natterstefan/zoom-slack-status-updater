require('dotenv').config()

const { PORT } = require('./config')
const logger = require('./logger')
const app = require('./server')

app.listen(PORT, () => {
  logger('App', `listening on port ${PORT}!`)
})
