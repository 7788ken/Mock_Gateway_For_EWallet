function registerEdipTokenGetRoute({ app, context }) {
  app.post('/edip/v1/token/get', (req, res) => {
    if (context.edipForceErrorCode) {
      return res.status(200).json({
        errorCode: context.edipForceErrorCode,
        errorMsg: context.edipForceErrorMsg,
        accessToken: '',
        refreshToken: '',
        period: 0,
      })
    }

    return res.status(200).json(context.tokenSuccessResponse())
  })
}

module.exports = registerEdipTokenGetRoute
