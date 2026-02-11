function registerCardpinValidateRoute({ app, context }) {
  app.post('/ewl/bal/v1/cardpin/validate', (req, res) => {
    const accountNum = context.resolveAccountNum(req.body)
    const pin = `${req.body?.data?.pin || ''}`

    if (context.failPins.has(pin)) {
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
      result: context.defaultValidateResult,
    })
  })
}

module.exports = registerCardpinValidateRoute
