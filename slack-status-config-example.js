module.exports = [
  // You can add as many slack workspaces as you want here, just make sure
  // you have created an app for each of them.
  {
    // this name can be anything and is only for you, it is not used in the app
    name: 'Slack Workspace 1',
    // this is the email address of your zoom user
    // events are filtered and slack updates are only done for this user
    // remove, if filtering is not intended
    userMail: 'your-address@mail.com',
    // either copy & paste the token string here or use
    // process.env.SLACK_TOKEN_1 (now secret add SLACK_TOKEN_1 "xoxp-xxx-xxx")
    token: 'xoxp-xxx-xxx',
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
