const crypto = require('node:crypto')
const express = require('express')

const app = express()
app.use(express.json({ limit: '2mb' }))

const host = process.env.MOCK_GATEWAY_HOST || process.env.HOST || '127.0.0.1'
const port = Number(process.env.MOCK_GATEWAY_PORT || process.env.PORT || 19090)
const tokenPeriodSeconds = Number(process.env.MOCK_TOKEN_PERIOD_SECONDS || 3600)
const defaultValidateResult = process.env.MOCK_VALIDATE_RESULT || 'SUCCESS'
const configuredFailPins = (process.env.MOCK_VALIDATE_FAIL_PINS || '0000')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean)
const failPins = new Set(configuredFailPins)

const mockProfile = {
  firstName: process.env.MOCK_MEMBER_FIRST_NAME || 'MOCK',
  lastName: process.env.MOCK_MEMBER_LAST_NAME || 'MEMBER',
  tier: process.env.MOCK_MEMBER_TIER || 'MOCK',
  eBonus: process.env.MOCK_MEMBER_EBONUS || '0',
  phoneNum: process.env.MOCK_MEMBER_PHONE || '12345678',
  birthday: process.env.MOCK_MEMBER_BIRTHDAY || '1990-01-01',
  gender: process.env.MOCK_MEMBER_GENDER || 'M',
  image: process.env.MOCK_MEMBER_IMAGE || '',
}

const issuedRefreshTokens = new Set()

function generateToken(prefix) {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, '')}`
}

function resolveAccountNum(requestBody) {
  return requestBody?.data?.accountNum || requestBody?.data?.playerId || ''
}

function tokenSuccessResponse() {
  const accessToken = generateToken('mock_access')
  const refreshToken = generateToken('mock_refresh')
  issuedRefreshTokens.add(refreshToken)

  return {
    errorCode: '',
    errorMsg: '',
    accessToken,
    refreshToken,
    period: tokenPeriodSeconds,
  }
}

app.get('/healthz', (req, res) => {
  res.json({
    status: 'ok',
    service: 'ewallet-mock-gateway',
    now: new Date().toISOString(),
  })
})

app.post('/edip/v1/token/get', (req, res) => {
  const forceErrorCode = process.env.MOCK_EDIP_FORCE_ERROR_CODE || ''
  if (forceErrorCode) {
    return res.status(200).json({
      errorCode: forceErrorCode,
      errorMsg: process.env.MOCK_EDIP_FORCE_ERROR_MSG || 'Mock EDIP token error',
      accessToken: '',
      refreshToken: '',
      period: 0,
    })
  }

  return res.status(200).json(tokenSuccessResponse())
})

app.post('/edip/v1/token/refresh', (req, res) => {
  const refreshToken = req.body?.data?.refreshToken
  if (!refreshToken) {
    return res.status(200).json({
      errorCode: 'MISSING_REFRESH_TOKEN',
      errorMsg: 'refreshToken is required',
      accessToken: '',
      refreshToken: '',
      period: 0,
    })
  }

  const mustExist = (process.env.MOCK_EDIP_REFRESH_TOKEN_MUST_EXIST || 'false') === 'true'
  if (mustExist && !issuedRefreshTokens.has(refreshToken)) {
    return res.status(200).json({
      errorCode: 'INVALID_REFRESH_TOKEN',
      errorMsg: 'refreshToken not recognized by mock gateway',
      accessToken: '',
      refreshToken: '',
      period: 0,
    })
  }

  return res.status(200).json(tokenSuccessResponse())
})

app.post('/ewl/bal/v1/cardpin/validate', (req, res) => {
  const accountNum = resolveAccountNum(req.body)
  const pin = `${req.body?.data?.pin || ''}`

  if (failPins.has(pin)) {
    return res.status(200).json({
      errorCode: 'INVALID_PIN',
      errorMsg: 'Mock validation failed',
      accountNum,
      result: 'FAIL',
    })
  }

  return res.status(200).json({
    errorCode: '',
    errorMsg: '',
    accountNum,
    result: defaultValidateResult,
  })
})

app.post('/ewl/edip/v1/member/profile', (req, res) => {
  const accountNum = resolveAccountNum(req.body)

  if (!accountNum) {
    return res.status(200).json({
      status: false,
      errorCode: 'NOT_FOUND',
      message: 'accountNum or playerId is required',
      data: null,
    })
  }

  return res.status(200).json({
    status: true,
    errorCode: '',
    message: 'Mock member profile',
    data: {
      accountNum,
      playerId: req.body?.data?.playerId || accountNum,
      isActive: true,
      isDeactive: false,
      isBanned: false,
      currentTier: mockProfile.tier,
      eBonus: mockProfile.eBonus,
      clubState: 1,
      primaryHost: 'MOCK HOST',
      primaryHostID: 1000001,
      secondaryHost: 'MOCK SECOND HOST',
      secondaryHostID: 1000002,
      phoneList: [
        {
          phoneNum: mockProfile.phoneNum,
          phoneType: 'Mobile1',
        },
      ],
      player: {
        title: 'Mr',
        firstName: mockProfile.firstName,
        lastName: mockProfile.lastName,
        middleName: '',
        nickName: mockProfile.firstName,
        image: mockProfile.image,
      },
      attribute: {
        birthday: mockProfile.birthday,
        gender: mockProfile.gender,
        height: '',
        weight: '',
        smoker: false,
        languageCode: 'en',
      },
      addressList: [],
      identityList: [],
      emailList: [],
    },
  })
})

app.post('/ewl/bal/v1/player/image', (req, res) => {
  const accountNum = resolveAccountNum(req.body)
  return res.status(200).json({
    errorCode: '',
    errorMsg: '',
    accountNum,
    image: mockProfile.image,
  })
})

app.post('/ewl/bal/v1/player/earn', (req, res) => {
  const accountNum = resolveAccountNum(req.body)
  const casinoCode = req.body?.data?.casinoCode || 'GLP'
  const points = Number(process.env.MOCK_PLAYER_EARN_POINTS || 0)

  return res.status(200).json({
    errorCode: '',
    errorMsg: '',
    accountNum,
    playerEarn: [
      {
        casinoCode,
        points,
        comps: 0,
        ebonus: 0,
        stubs: 0,
        tierPoints: 0,
        mgmtComp: 0,
      },
    ],
    ratingSum: [],
  })
})

app.use((req, res) => {
  res.status(404).json({
    error: 'NOT_MOCKED',
    message: `No mock configured for ${req.method} ${req.path}`,
  })
})

app.listen(port, host, () => {
  console.log(`Mock gateway listening on http://${host}:${port}`)
})
