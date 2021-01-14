const path = require('path')
const moxios = require('moxios')

const mockExampleConfig = require('../../slack-status-config-example')
const updateSlack = require('../slack')

require('dotenv').config()

jest.mock('../logger')
jest.mock('../../slack-status-config', () => mockExampleConfig)

const baseOptions = {
  verificationToken: process.env.VERIFICATION_TOKEN,
  presenceStatus: 'Do_Not_Disturb',
}

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
      moxios.respondAllWith(
        // updateSlack
        DEFAULT_SLACK_RESPONSE,
        // updateSlackDndStatus
        DEFAULT_SLACK_RESPONSE,
      )
    })

    const result = await updateSlack(baseOptions)
    expect(result).toBeTruthy()
  })

  it('invokes slack api for multiple workspaces', async () => {
    moxios.wait(() => {
      moxios.respondAllWith(
        // workspace 1
        DEFAULT_SLACK_RESPONSE,
        DEFAULT_SLACK_RESPONSE,
        // workspace 2
        DEFAULT_SLACK_RESPONSE,
        DEFAULT_SLACK_RESPONSE,
      )
    })

    const result = await updateSlack({
      ...baseOptions,
      workspaces: [...mockExampleConfig, ...mockExampleConfig],
    })
    expect(result).toBeTruthy()
  })

  it('invokes both updateSlackStatus and updateSlackDndStatus', async () => {
    moxios.wait(() => {
      moxios.respondAllWith(DEFAULT_SLACK_RESPONSE, DEFAULT_SLACK_RESPONSE)
    })

    const result = await updateSlack(baseOptions)
    expect(result).toHaveLength(2)
  })

  it('invokes only updateSlackStatus when dndNumMinutes is not configured for workspace', async () => {
    moxios.wait(() => {
      moxios.respondAllWith(DEFAULT_SLACK_RESPONSE)
    })

    const result = await updateSlack({
      ...baseOptions,
      workspaces: [{ ...mockExampleConfig[0], dndNumMinutes: 0 }],
    })
    expect(result).toHaveLength(1)
  })

  describe('updateSlackStatus', () => {
    it('invokes slack api with proper request header', async () => {
      moxios.wait(() => {
        moxios.respondAllWith(DEFAULT_SLACK_RESPONSE, DEFAULT_SLACK_RESPONSE)
      })

      const result = await updateSlack(baseOptions)

      expect(result[0].request.config.headers.Authorization).toStrictEqual(
        'Bearer ' + process.env.SLACK_TOKEN,
      )
    })

    it('sets proper slack status when user is in Do_Not_Disturb mode', async () => {
      moxios.wait(() => {
        moxios.respondAllWith(DEFAULT_SLACK_RESPONSE, DEFAULT_SLACK_RESPONSE)
      })

      const result = await updateSlack(baseOptions)

      expect(result[0].request.config.data).toStrictEqual(
        '{"profile":{"status_text":"I\'m in a meeting","status_emoji":":warning:","status_expiration":0}}',
      )
    })

    it('sets proper slack status when user is is not in Do_Not_Disturb mode', async () => {
      moxios.wait(() => {
        moxios.respondAllWith(DEFAULT_SLACK_RESPONSE, DEFAULT_SLACK_RESPONSE)
      })

      const result = await updateSlack({
        ...baseOptions,
        presenceStatus: 'Available',
      })

      expect(result[0].request.config.data).toStrictEqual(
        '{"profile":{"status_text":"","status_emoji":"","status_expiration":0}}',
      )
    })

    it('sets proper slack status when user is is in Do_Not_Disturb mode and mail matches', async () => {
      moxios.wait(() => {
        moxios.respondAllWith(DEFAULT_SLACK_RESPONSE, DEFAULT_SLACK_RESPONSE)
      })

      const result = await updateSlack({
        ...baseOptions,
        workspaces: [
          {
            ...mockExampleConfig[0],
            email: 'your-address@mail.com',
          },
        ],
        email: 'your-address@mail.com',
      })

      expect(result[0].request.config.data).toStrictEqual(
        '{"profile":{"status_text":"I\'m in a meeting","status_emoji":":warning:","status_expiration":0}}',
      )
    })

    it.each([
      {
        status: 200,
        response: {
          error: 'some error occured',
        },
      },
      {
        status: 500,
      },
    ])('rejects on error with the %o response', async (response) => {
      moxios.wait(() => {
        moxios.respondAllWith(response)
      })
      await expect(updateSlack(baseOptions)).rejects.toBeTruthy()
    })
  })

  describe('updateSlackDndStatus', () => {
    it('invokes slack api with proper request header', async () => {
      moxios.wait(() => {
        moxios.respondAllWith(DEFAULT_SLACK_RESPONSE, DEFAULT_SLACK_RESPONSE)
      })

      const result = await updateSlack(baseOptions)
      expect(result[1].request.config.headers.Authorization).toStrictEqual(
        'Bearer ' + process.env.SLACK_TOKEN,
      )
    })

    it.each`
      presenceStatus      | expected
      ${'Do_Not_Disturb'} | ${'https://slack.com/api/dnd.setSnooze'}
      ${'Available'}      | ${'https://slack.com/api/dnd.endSnooze'}
      ${'Away'}           | ${'https://slack.com/api/dnd.endSnooze'}
    `(
      'sets proper dnd status when user is in $presenceStatus mode',
      async ({ presenceStatus, expected }) => {
        moxios.wait(() => {
          moxios.respondAllWith(DEFAULT_SLACK_RESPONSE, DEFAULT_SLACK_RESPONSE)
        })

        let result = await updateSlack({ ...baseOptions, presenceStatus })
        expect(result[1].request.config.url).toStrictEqual(expected)
        expect(result[1].request.config.headers['Content-Type']).toStrictEqual(
          'application/x-www-form-urlencoded',
        )
      },
    )

    it.each([
      {
        status: 200,
        response: {
          error: 'some error occured',
        },
      },
      {
        status: 500,
      },
    ])('rejects on error with the %o response', async (response) => {
      moxios.wait(() => {
        moxios.respondAllWith(DEFAULT_SLACK_RESPONSE, response)
      })
      await expect(updateSlack(baseOptions)).rejects.toBeTruthy()
    })
  })

  describe('error handling', () => {
    it('rejects when no options were provided', async () => {
      expect(updateSlack()).rejects.toBeTruthy()
    })

    it('does not invoke slack api when mail does not match', () => {
      expect(
        updateSlack({
          ...baseOptions,
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

    it('rejects when no workspace matches verificationToken', async () => {
      moxios.wait(() => {
        moxios.respondAllWith(DEFAULT_SLACK_RESPONSE)
      })

      expect(updateSlack({ verificationToken: 'other' })).rejects.toBeTruthy()
    })
  })
})
