const moxios = require('moxios')

const mockExampleConfig = require('../../slack-status-config-example')
const updateSlack = require('../slack')

jest.mock('../logger')
jest.mock('../../slack-status-config', () => mockExampleConfig)

const baseOptions = { verificationToken: 'Vivamusultricies' }

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
        if (moxios.requests.at(i)) {
          return moxios.requests.at(i).respondWith(res)
        }
      }, null)
    }
  })

  afterEach(() => {
    moxios.uninstall()
  })

  it('invokes slack api for workspace with matching verificationToken', async () => {
    moxios.wait(() => {
      const request = moxios.requests.mostRecent()
      request.respondWith(DEFAULT_SLACK_RESPONSE)
    })

    const result = await updateSlack(baseOptions)
    expect(result).toBeTruthy()
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

    const result = await updateSlack({
      ...baseOptions,
      workspaces: [...mockExampleConfig, ...mockExampleConfig],
    })
    expect(result).toBeTruthy()
  })

  it('invokes slack api with proper request config', async () => {
    moxios.wait(() => {
      const request = moxios.requests.mostRecent()
      request.respondWith(DEFAULT_SLACK_RESPONSE)
    })

    const result = await updateSlack(baseOptions)

    expect(result.request.config.headers.Authorization).toStrictEqual(
      'Bearer xoxp-xxx-xxx',
    )
    expect(result.request.config.url).toStrictEqual(
      'https://slack.com/api/users.profile.set',
    )
  })

  it('invokes slack api with proper request data when user is in meeting', async () => {
    moxios.wait(() => {
      const request = moxios.requests.mostRecent()
      request.respondWith(DEFAULT_SLACK_RESPONSE)
    })

    const result = await updateSlack({
      ...baseOptions,
      presenceStatus: 'Do_Not_Disturb',
    })

    expect(result.request.config.data).toStrictEqual(
      '{"profile":{"status_text":"I\'m in a meeting","status_emoji":":warning:","status_expiration":0}}',
    )
  })

  it('invokes slack api with proper request data when user is not in a meeting', async () => {
    moxios.wait(() => {
      const request = moxios.requests.mostRecent()
      request.respondWith(DEFAULT_SLACK_RESPONSE)
    })

    const result = await updateSlack({
      ...baseOptions,
      presenceStatus: 'Available',
    })

    expect(result.request.config.data).toStrictEqual(
      '{"profile":{"status_text":"","status_emoji":"","status_expiration":0}}',
    )
  })

  it('invokes slack api with proper request data when user is in meeting and mail matches', async () => {
    moxios.wait(() => {
      const request = moxios.requests.mostRecent()
      request.respondWith(DEFAULT_SLACK_RESPONSE)
    })

    const result = await updateSlack({
      ...baseOptions,
      presenceStatus: 'Do_Not_Disturb',
      workspaces: [
        {
          ...mockExampleConfig[0],
          email: 'your-address@mail.com',
        },
      ],
      email: 'your-address@mail.com',
    })

    expect(result.request.config.data).toStrictEqual(
      '{"profile":{"status_text":"I\'m in a meeting","status_emoji":":warning:","status_expiration":0}}',
    )
  })

  describe('error handling', () => {
    it('does not invoke slack api when mail does not match', () => {
      expect(
        updateSlack({
          ...baseOptions,
          presenceStatus: 'Do_Not_Disturb',
          workspaces: [
            {
              ...mockExampleConfig[0],
              email: 'another-address@mail.com',
            },
          ],
          email: 'your-address@mail.com',
        }),
      ).rejects.toBeTruthy()
    })

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

      await expect(updateSlack(baseOptions)).rejects.toBeTruthy()
    })

    it('rejects when slack api returns error code', async () => {
      moxios.wait(() => {
        const request = moxios.requests.mostRecent()
        request.respondWith({
          status: 500,
        })
      })

      await expect(updateSlack(baseOptions)).rejects.toBeTruthy()
    })
  })

  it('rejects when no workspace matches verificationToken', async () => {
    moxios.wait(() => {
      const request = moxios.requests.mostRecent()
      request.respondWith(DEFAULT_SLACK_RESPONSE)
    })

    expect(updateSlack({ verificationToken: 'other' })).rejects.toBeTruthy()
  })
})
