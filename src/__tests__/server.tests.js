const request = require('supertest')

const app = require('../server')
const logger = require('../logger')
const updateSlackStatus = require('../slack')
const { ZOOM_IN_MEETING_STATUS } = require('../config')

jest.mock('../logger')
jest.mock('../slack', () => jest.fn())

describe('app', () => {
  const doRequest = (status = 'Available') =>
    request(app)
      .post('/')
      .send({
        // @see https://marketplace.zoom.us/docs/api-reference/webhook-reference/user-events/presence-status-updated
        payload: {
          object: {
            presence_status: status,
          },
        },
      })

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

  it.each(['Available', 'Away'])(
    'updateSlackStatus to "not in a meeting" when presence_status is %s',
    async (status) => {
      await doRequest(status)
      expect(updateSlackStatus).toHaveBeenCalledWith(false)
    },
  )

  it.each([ZOOM_IN_MEETING_STATUS])(
    'updateSlackStatus to "in a meeting" when presence_status is %s',
    async (status) => {
      await doRequest(status)
      expect(updateSlackStatus).toHaveBeenCalledWith(true)
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
