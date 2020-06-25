const axios = require('axios')

const slackWorkspaces = require('../slack-status-config')
const logger = require('./logger')

const { ENDPOINT, ZOOM_IN_MEETING_STATUS } = require('./config')

/**
 * Update slack status
 *
 * @param {string} text for the status update, an empty string resets it
 * @param {string} emooji for the slack status, an empty string resets it
 *
 * @see https://api.slack.com/docs/presence-and-status
 */
const updateSlackStatus = async (workspace, { token, text, emoji }) => {
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

    logger('SLACK', `workspace ${workspace.name} updated`)
    return response
  } catch (error) {
    throw new Error(error)
  }
}

/**
 * Update the slack workspace matching the present verificationToken.
 *
 * @returns true when update was successfull
 * @returns false when update was not successfull
 */
module.exports = async (options) => {
  const {
    presenceStatus,
    email = '',
    verificationToken,
    workspaces = slackWorkspaces,
  } = options || {}
  const workspaceToUpdate = workspaces.find(
    (workspace) => workspace.zoomVerificationToken === verificationToken,
  )

  if (!workspaceToUpdate) {
    throw new Error(
      'verification token does not match any configured workspace',
    )
  }

  const hasConfiguredMail = !!workspaceToUpdate.email
  const configuredMailsMatch = workspaceToUpdate.email === email

  if (!hasConfiguredMail || (hasConfiguredMail && configuredMailsMatch)) {
    const isInMeeting = presenceStatus === ZOOM_IN_MEETING_STATUS
    const status = isInMeeting ? 'meetingStatus' : 'noMeetingStatus'

    return await updateSlackStatus(workspaceToUpdate, {
      token: workspaceToUpdate.token,
      text: workspaceToUpdate[status].text,
      emoji: workspaceToUpdate[status].emoji,
    })
  } else {
    logger(
      'SLACK',
      `${workspaceToUpdate.name} was not updated because email does not match`,
    )
    throw new Error('workspace was not updated because email does not match')
  }
}
