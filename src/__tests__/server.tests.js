const request = require('supertest')

const app = require('../server')
const logger = require('../logger')
const updateSlackStatus = require('../slack')
const { ZOOM_IN_MEETING_STATUS } = require('../config')

jest.mock('../logger')
jest.mock('../slack', () => jest.fn())

describe('app', () => {
  const doRequest = (response) => {
    const { presence_status = 'Available', email } = response || {}
    return request(app)
      .post('/')
      .send({
        // @see https://marketplace.zoom.us/docs/api-reference/webhook-reference/user-events/presence-status-updated
        payload: {
          object: {
            email,
            presence_status,
          },
        },
      })
  }

  afterEach(() => {
    updateSlackStatus.mockClear()
  })

  it('has index route', async () => {
    const response = await request(app).get('/')
    expect(response.status).toStrictEqual(200)
    expect(response.text).toStrictEqual('I am online :)')
  })

  it('provides an endpoint for the zoom webhook', async () => {
    const response = await doRequest()
    expect(response.status).toStrictEqual(200)
  })

  it.each([{ presence_status: 'Available' }, { presence_status: 'Away' }])(
    'invokes updateSlackStatus to "not in a meeting" with %o',
    async (response) => {
      await doRequest(response)
      expect(updateSlackStatus).toHaveBeenCalledWith({
        isInMeeting: false,
      })
    },
  )

  it.each([{ presence_status: ZOOM_IN_MEETING_STATUS }])(
    'invokes updateSlackStatus to "in a meeting" with %o',
    async (response) => {
      await doRequest(response)
      expect(updateSlackStatus).toHaveBeenCalledWith({
        isInMeeting: true,
      })
    },
  )

  it.each([{ email: 'your-address@mail.com' }, { email: '' }])(
    'invokes updateSlackStatus with proper email with %o',
    async (response) => {
      await doRequest(response)
      expect(updateSlackStatus).toHaveBeenCalledWith({
        isInMeeting: false,
        email: response.email,
      })
    },
  )

  it('zoom webhook handles errors silently', async () => {
    const response = await request(app).post('/').send({
      // in order to test the error, we send a different body
      something: 'else',
    })

    expect(response.status).toStrictEqual(200)
    expect(updateSlackStatus).toHaveBeenCalledTimes(0)
    expect(logger).toHaveBeenLastCalledWith(
      'REQUEST error',
      'presence_status is not available',
    )
  })

  it('zoom webhook handles slack api errors silently', async () => {
    updateSlackStatus.mockImplementation(() => Promise.reject('some error'))
    const response = await doRequest()

    expect(logger).toHaveBeenLastCalledWith('REQUEST error', 'some error')
    expect(response.status).toStrictEqual(200)
  })
})
