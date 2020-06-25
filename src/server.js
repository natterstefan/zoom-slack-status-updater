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
  logger('REQUEST', req.body)

  const currentPresenceStatus = get(req, 'body.payload.object.presence_status')
  const currentEmail = get(req, 'body.payload.object.email')
  const verificationToken = get(req, 'headers.authorization')

  if (!currentPresenceStatus) {
    return next(new Error('presence_status is not available'))
  }

  try {
    await updateSlackStatus({
      presenceStatus: currentPresenceStatus,
      email: currentEmail,
      verificationToken,
    })
    res.sendStatus(200)
  } catch (error) {
    return next(new Error(error))
  }
})

// this route only exists, so one can check if the server is online and running
app.get('/', (_req, res) => {
  res.send('I am online :)')
})

/**
 * global error middleware, catches any uncatched errors thrown in app routes.
 * Logs the error to the console.
 */
app.use(function (error, _req, res, _next) {
  logger('REQUEST error', error.message)
  res.sendStatus(200)
})

module.exports = app
