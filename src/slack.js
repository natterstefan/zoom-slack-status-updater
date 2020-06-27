const axios = require('axios')
const qs = require('qs')

const slackWorkspaces = require('../slack-status-config')
const logger = require('./logger')

const { ZOOM_IN_MEETING_STATUS } = require('./config')

/**
 * Update slack status
 *
 * @param {*} workspace
 * @param {string} options contains token (string), text (string) and emoji (string)
 *
 * @see https://api.slack.com/docs/presence-and-status
 */
const updateSlackStatus = async (workspace, { token, text, emoji }) => {
  try {
    const response = await axios.post(
      'https://slack.com/api/users.profile.set',
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

    logger('SLACK', `workspace ${workspace.name} status updated`)
    return response
  } catch (error) {
    throw new Error(error)
  }
}

/**
 * Update slack's dnd status
 *
 * @param {*} workspace
 * @param {*} options contains token (string), numMinutes (number) and snooze (boolean)
 *
 * @see https://api.slack.com/methods/dnd.setSnooze
 * @see https://api.slack.com/methods/dnd.endSnooze
 */
const updateSlackDndStatus = async (
  workspace,
  { token, numMinutes, snooze },
) => {
  try {
    let config = {}

    switch (snooze) {
      case true:
        config = {
          url: 'https://slack.com/api/dnd.setSnooze',
          data: qs.stringify({
            num_minutes: numMinutes,
          }),
        }
        break

      default:
        config = {
          url: 'https://slack.com/api/dnd.endSnooze',
        }
        break
    }

    const response = await axios({
      method: 'post',
      headers: {
        Authorization: `Bearer ${token}`,
        'content-type': 'application/x-www-form-urlencoded',
      },
      ...config,
    })

    if (response.data.error) {
      throw new Error(response.data.error)
    }

    logger('SLACK', `workspace ${workspace.name} dnd updated`)
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

    return axios.all(
      [
        updateSlackStatus(workspaceToUpdate, {
          token: workspaceToUpdate.token,
          text: workspaceToUpdate[status].text,
          emoji: workspaceToUpdate[status].emoji,
        }),
        // only change DnD when workspace configured dndNumMinutes
        workspaceToUpdate.dndNumMinutes > 0 &&
          updateSlackDndStatus(workspaceToUpdate, {
            numMinutes: workspaceToUpdate.dndNumMinutes,
            snooze: isInMeeting,
            token: workspaceToUpdate.token,
          }),
      ].filter(Boolean),
    )
  } else {
    logger(
      'SLACK',
      `${workspaceToUpdate.name} was not updated because email does not match`,
    )
    throw new Error('workspace was not updated because email does not match')
  }
}
