module.exports = [
  /**
   * You can add as many slack workspaces as you want here, just make sure
   * you have created an app for each of them.
   */
  {
    // this name can be anything and is only for you, it is not used in the app
    name: 'Slack Workspace 1',
    /**
     * this is the email address of your zoom user. Events are filtered
     * and slack updates are only done for this user.
     *
     * optional: remove, if filtering is not intended
     */
    email: 'your-address@mail.com',
    /**
     * Add this as an Enviroment variable on Vercel and in the local `.env` file
     */
    token: process.env.SLACK_TOKEN,
    /**
     * Zoom Verification Token
     *
     * A verification token will be generated in the Feature page after you
     * enable and save the event subscription.
     *
     * @see https://marketplace.zoom.us/docs/api-reference/webhook-reference#headers
     *
     * Add this as an Enviroment variable on Vercel and in the local `.env` file
     */
    zoomVerificationToken: process.env.ZOOM_TOKEN,
    /**
     * Slack DnD Status
     *
     * Turns on Do Not Disturb mode for the current user. Number of minutes,
     * from now, to snooze until.
     *
     * @see https://api.slack.com/methods/dnd.setSnooze
     */
    dndNumMinutes: 60,
    meetingStatus: {
      text: "I'm in a meeting",
      emoji: ':warning:', // emoji code
    },
    noMeetingStatus: {
      text: '',
      emoji: '',
    },
  },
]
