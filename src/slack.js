const axios = require('axios')

const slackWorkspaces = require('../slack-status-config')
const logger = require('./logger')

const { ENDPOINT } = require('./config')

/**
 * Update slack status
 *
 * @param {string} text for the status update, an empty string resets it
 * @param {string} emooji for the slack status, an empty string resets it
 *
 * @see https://api.slack.com/docs/presence-and-status
 */
const updateSlackStatus = async ({ token, text, emoji }) => {
  try {
    const response = await axios.post(
      ENDPOINT,
      {
        profile: {
          status_text: text || '',
          status_emoji: emoji || '',
          status_expiration: 0,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    )
    if (response.data.error) {
      throw new Error(response.data.error)
    }

    return response
  } catch (error) {
    throw new Error(error)
  }
}

/**
 * update each configured slack workspace
 *
 * ATTENTION: If any of the passed-in promises reject, Promise.all
 * asynchronously rejects with the value of the promise that rejected, whether
 * or not the other promises have resolved.
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all
 */
module.exports = (isInMeeting = false, workspaces = slackWorkspaces, eventUserMail = '') =>
  axios.all(
    workspaces.map((slackWorkspace) => {
      if (slackWorkspace.userMail === undefined || slackWorkspace.userMail === eventUserMail) {
          const status = isInMeeting ? 'meetingStatus' : 'noMeetingStatus'
          return updateSlackStatus({
                  token: slackWorkspace.token,
                  text: slackWorkspace[status].text,
                  emoji: slackWorkspace[status].emoji,
                })
        }else{
            logger("not updating workspace because of email filter", slackWorkspace.name)
          return false
        }
      }),
    )