const express = require('express')
const bodyParser = require('body-parser')
const get = require('lodash.get')

const logger = require('./logger')
const updateSlackStatus = require('./slack')
const { ZOOM_IN_MEETING_STATUS } = require('./config')

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
app.post('/', async (req, res, next) => {
  logger('ZOOM request', req.body)

  const currentPresenceStatus = get(req, 'body.payload.object.presence_status')
  if (!currentPresenceStatus) {
    return next(new Error('presence_status is not available'))
  }

  try {
    const isInMeeting = currentPresenceStatus === ZOOM_IN_MEETING_STATUS
    await updateSlackStatus(isInMeeting)

    logger(
      'SLACK updated',
      `new slack status '${isInMeeting ? 'in meeting' : 'not in meeting'}'`,
    )
    res.sendStatus(200)
  } catch (error) {
    return next(new Error(error))
  }
})

// this route only exists, so one can check if the server is online and running
app.get('/', (_req, res) => {
  res.send('I am online :)')
})

// global error middleware
app.use(function (error, _req, res, _next) {
  logger('REQUEST error', error.message)
  res.sendStatus(200)
})

module.exports = app
