function registerPromotionAllRoute({ app, context }) {
  app.post('/ewl/bal/v1/promotion/all', (req, res) => {
    const accountNum = context.resolveAccountNum(req.body)

    if (!accountNum) {
      return res.status(200).json({
        errorCode: 'MISSING_ACCOUNT_NUM',
        errorMsg: 'accountNum or playerId is required',
        accountNum: '',
        eligiblePromotionList: [],
        entitledPromotionList: [],
      })
    }

    const eligiblePromotionList =
      context.promotionCapture?.eligiblePromotionList?.length > 0
        ? context.promotionCapture.eligiblePromotionList
        : context.normalizedFallbackEligiblePromotionList
    const entitledPromotionList =
      context.promotionCapture?.entitledPromotionList?.length > 0
        ? context.promotionCapture.entitledPromotionList
        : []

    return res.status(200).json({
      errorCode: '',
      errorMsg: '',
      accountNum,
      eligiblePromotionList: context.trimPromotionList(eligiblePromotionList),
      entitledPromotionList: context.trimPromotionList(entitledPromotionList),
    })
  })
}

module.exports = registerPromotionAllRoute
