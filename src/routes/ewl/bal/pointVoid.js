function registerPointVoidRoute({ app, context }) {
  app.post('/ewl/bal/v1/point/void', (req, res) => {
    return res.status(200).json({
      errorCode: context.pointVoidErrorCode,
      errorMsg: context.pointVoidErrorMsg,
      result: context.pointVoidResult,
    })
  })
}

module.exports = registerPointVoidRoute
