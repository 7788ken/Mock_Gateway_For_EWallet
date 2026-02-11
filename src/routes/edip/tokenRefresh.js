function registerEdipTokenRefreshRoute({ app, context }) {
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

    if (context.edipRefreshTokenMustExist && !context.issuedRefreshTokens.has(refreshToken)) {
      return res.status(200).json({
        errorCode: 'INVALID_REFRESH_TOKEN',
        errorMsg: 'refreshToken not recognized by mock gateway',
        accessToken: '',
        refreshToken: '',
        period: 0,
      })
    }

    return res.status(200).json(context.tokenSuccessResponse())
  })
}

module.exports = registerEdipTokenRefreshRoute
