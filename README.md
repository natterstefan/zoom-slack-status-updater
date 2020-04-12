# Zoom Slack Status Updater

![now](https://img.shields.io/badge/deploy%20on-now.sh-green?logo=zeit&style=flat)
![GitHub release (latest SemVer including pre-releases)](https://img.shields.io/github/v/release/natterstefan/zoom-slack-status-updater?include_prereleases)
![GitHub](https://img.shields.io/github/license/natterstefan/zoom-slack-status-updater)

Update your Slack status automatically when you join a Zoom meeting.

## Requirements

- Zoom App
- Slack App
- ZEIT account

First, make sure you have `now` and all dependencies installed.

```bash
npm install -g now
yarn # or npm i
```

## Setup & Deployment

### Step 1 - Setup now.sh

1. Create a [ZEIT account](https://zeit.co/signup)
2. Run `now login` (login with your now account) in your terminal

### Step 2 - Setup Slack

1. Create a [Slack App](https://api.slack.com/apps) for your workspace(s)
2. Grant each app the `users.profile:write` privilege in `User Token Scopes`
   in the `OAuth Tokens & Redirect URLs` view, before clicking on the "Install
   App" button.
3. Copy and paste each `OAuth Access Token` into the configuration file created
   in the subsequent step.

### Step 3 - Configure App

1. Duplicate the [example config](./slack-status-config-example.js) and rename
   it to `slack-status-config.js`.
2. Create a config object for each slack workspace you want to update when a
   Zoom meeting starts.

You can either use `now secret` for the token values, or copy the string into
the config.

#### now secrets

When working with `now secret` you need to do the following for _each_ secret:

```bash
# Step 1 - create a secret
now secret add SLACK_TOKEN_1 "xoxp-xxx-xxx"

# Step 2 - add secret to `now.json`
#   "env": {
#    "SLACK_TOKEN_1": "@slack_token_1"
#  },
#

# Step 3 - add `process.env.NAME` to your configuration file
#  {
#    name: 'Slack Workspace 1',
#    token: process.env.SLACK_TOKEN_1,
#    ...
#  }
```

#### Example configuration

```js
module.exports = [
  {
    // this name can be anything and is only for you, it is not used in the app
    name: 'Slack Workspace 1',
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
```

### Step 4 - Deploy App to now.sh

```bash
now
```

Remember the created now.sh URL, you gonna need it in the next step for the ZOOM
app.

#### Step 5 - Zoom

[Create a new (or use an existing) "Webhook Only" app](https://marketplace.zoom.us/develop/create)
on Zoom with your Zoom account.

Fill out the required information and activate `Event Subscriptions`. Add
`User’s presence status has been updated` and add the generated now.sh domain
for `Event notification endpoint URL`.

You can read more about it setting up the App [here](https://marketplace.zoom.us/docs/api-reference/webhook-reference/user-events/presence-status-updated).

### Step 6 - Test :)

Now, open both Zoom and Slack and watch the status change when you start or
join a meeting.

## now commands

```bash
# deploy to now
now

# remove previous deployments from now.sh
now your-app --safe --yes
# deploy and remove previous builds
now && now rm your-app --safe --yes

# list all deployments
now ls
```

## Other solutions

- https://github.com/cmmarslender/zoom-status
- https://github.com/mivok/slack_status_updater

## References

- [now.sh examples](https://github.com/zeit/now/tree/master/examples)
- [ZEIT ▲ now for GitHub](https://zeit.co/docs/v2/git-integrations/zeit-now-for-github)
- [Easily Deploy a Serverless Node App with ZEIT Now](https://scotch.io/tutorials/easily-deploy-a-serverless-node-app-with-zeit-now#toc-deploy-application-using-now)
- [Deploying Node.js microservices to ZEIT ▲ Now](https://nodesource.com/blog/deploying-nodejs-microservices-to-ZEIT)
- [Securing persistent environment variables using ZEIT Now](https://humanwhocodes.com/blog/2019/09/securing-persistent-environment-variables-zeit-now/)
- [How to set a Slack status from other apps](https://medium.com/slack-developer-blog/how-to-set-a-slack-status-from-other-apps-ab4eef871339)

## License

[MIT](License)

## Contributors ✨

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tr>
    <td align="center"><a href="http://twitter.com/natterstefan"><img src="https://avatars2.githubusercontent.com/u/1043668?v=4" width="100px;" alt=""/><br /><sub><b>Stefan Natter</b></sub></a><br /><a href="#ideas-natterstefan" title="Ideas, Planning, & Feedback">🤔</a> <a href="https://github.com/natterstefan/zoom-slack-status-updater/commits?author=natterstefan" title="Code">💻</a></td>
  </tr>
</table>

<!-- markdownlint-enable -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!
