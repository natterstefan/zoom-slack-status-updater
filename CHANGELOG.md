# Zoom Slack Status Updater

All notable changes to this project will be documented here. The format is based
on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/) and this project
adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## 0.2.0 (2020-05-24)

### Features

- optimised server error handling
- workspace config can contain `email` (optional). Only when `email` matches the
  response the slack status is updated
  (resolves [#1](https://github.com/natterstefan/zoom-slack-status-updater/issues/1))

### Chore

- added travis and tests
- added `now.json` to `.gitignore` as it should be possible to customize it
  without creating a diff

## 0.1.0 (2020-04-12)

### Features

- initial setup with multiple slack workspaces support and now.sh deployment
