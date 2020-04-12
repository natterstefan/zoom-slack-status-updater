require('dotenv').config()

const express = require('express')
const bodyParser = require('body-parser')

const logger = require('./logger')
const updateSlackStatus = require('./slack')

const { PORT, ZOOM_IN_MEETING_STATUS } = require('./config')

const app = express()
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

/**
 * Webhook Endpoint called when "User’s presence status has been updated"
 * happens.
 *
 * Docs
 * @see https://marketplace.zoom.us/docs/api-reference/webhook-reference/user-events/presence-status-updated
 */
app.post('/', async (req, res) => {
  logger('ZOOM request', req.body)

  try {
    const isInMeeting =
      req.body.payload.object.presence_status === ZOOM_IN_MEETING_STATUS
    await updateSlackStatus(isInMeeting)

    logger(
      'SLACK updated',
      `new slack status '${isInMeeting ? 'in meeting' : 'not in meeting'}'`,
    )
  } catch (error) {
    // right now we just ignore it and only log the error
    logger('SLACK error', error)
  } finally {
    res.sendStatus(200)
  }
})

app.get('/', (_req, res) => {
  res.send('I am online :)')
})

app.listen(PORT, () => {
  logger('App', `listening on port ${PORT}!`)
})
