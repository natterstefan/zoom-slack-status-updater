const moxios = require('moxios')

const mockExampleConfig = require('../../slack-status-config-example')
const updateSlack = require('../slack')

jest.mock('../logger')
jest.mock('../../slack-status-config', () => mockExampleConfig)

describe('updateSlack', () => {
  const DEFAULT_SLACK_RESPONSE = {
    status: 200,
    response: {
      ok: true,
    },
  }

  beforeEach(() => {
    moxios.install()

    // inspired by https://github.com/axios/moxios/issues/34#issuecomment-419119802
    moxios.respondAllWith = function () {
      return Array.from(arguments).reduce((_promise, res, i) => {
        return moxios.requests.at(i).respondWith(res)
      }, null)
    }
  })

  afterEach(() => {
    moxios.uninstall()
  })

  it('invokes slack api for each given workspace', async () => {
    moxios.wait(() => {
      const request = moxios.requests.mostRecent()
      request.respondWith(DEFAULT_SLACK_RESPONSE)
    })

    const result = await updateSlack()
    expect(result).toHaveLength(1)
  })

  it('invokes slack api for multiple workspaces', async () => {
    moxios.wait(() => {
      moxios.respondAllWith(
        {
          status: 200,
          response: {},
        },
        {
          status: 200,
          response: {},
        },
      )
    })

    const result = await updateSlack(false, [
      ...mockExampleConfig,
      ...mockExampleConfig,
    ])
    expect(result).toHaveLength(2)
  })

  it('invokes slack api with proper request config', async () => {
    moxios.wait(() => {
      const request = moxios.requests.mostRecent()
      request.respondWith(DEFAULT_SLACK_RESPONSE)
    })

    const result = await updateSlack()

    expect(result[0].request.config.headers.Authorization).toStrictEqual(
      'Bearer xoxp-xxx-xxx',
    )
    expect(result[0].request.config.url).toStrictEqual(
      'https://slack.com/api/users.profile.set',
    )
  })

  it('invokes slack api with proper request data when user is in meeting', async () => {
    moxios.wait(() => {
      const request = moxios.requests.mostRecent()
      request.respondWith(DEFAULT_SLACK_RESPONSE)
    })

    const result = await updateSlack(true)

    expect(result[0].request.config.data).toStrictEqual(
      '{"profile":{"status_text":"I\'m in a meeting","status_emoji":":warning:","status_expiration":0}}',
    )
  })

  it('invokes slack api with proper request data when user is not in a meeting', async () => {
    moxios.wait(() => {
      const request = moxios.requests.mostRecent()
      request.respondWith(DEFAULT_SLACK_RESPONSE)
    })

    const result = await updateSlack(false)

    expect(result[0].request.config.data).toStrictEqual(
      '{"profile":{"status_text":"","status_emoji":"","status_expiration":0}}',
    )
  })

  describe('error handling', () => {
    it('rejects on error', async () => {
      moxios.wait(() => {
        const request = moxios.requests.mostRecent()
        request.respondWith({
          status: 200,
          response: {
            error: 'some error occured',
          },
        })
      })

      await expect(updateSlack()).rejects.toBeTruthy()
    })

    it('rejects when slack api returns error code', async () => {
      moxios.wait(() => {
        const request = moxios.requests.mostRecent()
        request.respondWith({
          status: 500,
        })
      })

      await expect(updateSlack()).rejects.toBeTruthy()
    })

    it('rejects when any of multiple workspace requests rejects', async () => {
      moxios.wait(() => {
        moxios.respondAllWith(
          {
            status: 500,
            response: {},
          },
          {
            status: 200,
            response: {},
          },
        )
      })

      await expect(
        updateSlack(false, [...mockExampleConfig, ...mockExampleConfig]),
      ).rejects.toBeTruthy()
    })
  })
})
