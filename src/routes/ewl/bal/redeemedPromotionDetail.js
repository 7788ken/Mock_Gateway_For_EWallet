function registerRedeemedPromotionDetailRoute({ app, context }) {
  app.post('/ewl/bal/v1/redeemedpromotion/detail', (req, res) => {
    const accountNum = context.resolveAccountNum(req.body)
    const outcomeList = context.redeemedPromotionDetailIncludeDefaultRecord
      ? [context.buildMockRedeemedPromotionOutcome(req.body)]
      : []

    return res.status(200).json({
      errorCode: context.redeemedPromotionDetailErrorCode,
      errorMsg: context.redeemedPromotionDetailErrorMsg,
      accountNum,
      outcomeList,
    })
  })
}

module.exports = registerRedeemedPromotionDetailRoute
