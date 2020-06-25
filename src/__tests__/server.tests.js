const request = require('supertest')

const app = require('../server')
const logger = require('../logger')
const updateSlackStatus = require('../slack')
const { ZOOM_IN_MEETING_STATUS } = require('../config')

jest.mock('../logger')
jest.mock('../slack', () => jest.fn())

describe('app', () => {
  const doRequest = (response) => {
    const {
      presence_status = 'Available',
      email,
      authorization = 'Vivamusultricies',
    } = response || {}
    return request(app)
      .post('/')
      .set('authorization', authorization)
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

  it.each([
    { presence_status: 'Available' },
    { presence_status: 'Away' },
    { presence_status: ZOOM_IN_MEETING_STATUS },
  ])('invokes updateSlackStatus with %o presenceStatus', async (response) => {
    await doRequest(response)
    expect(updateSlackStatus).toHaveBeenCalledWith({
      email: undefined,
      presenceStatus: response.presence_status,
      verificationToken: 'Vivamusultricies',
    })
  })

  it.each([{ email: 'your-address@mail.com' }, { email: '' }])(
    'invokes updateSlackStatus with %o email',
    async (response) => {
      await doRequest(response)
      expect(updateSlackStatus).toHaveBeenCalledWith({
        email: response.email,
        presenceStatus: 'Available',
        verificationToken: 'Vivamusultricies',
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
