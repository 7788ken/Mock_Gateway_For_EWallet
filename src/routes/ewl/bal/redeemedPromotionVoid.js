function registerRedeemedPromotionVoidRoute({ app, context }) {
  app.post('/ewl/bal/v1/redeemedpromotion/void', (req, res) => {
    return res.status(200).json({
      errorCode: context.redeemedPromotionVoidErrorCode,
      errorMsg: context.redeemedPromotionVoidErrorMsg,
      result: context.redeemedPromotionVoidResult,
    })
  })
}

module.exports = registerRedeemedPromotionVoidRoute
