function registerPlayerPromotionRedeemRoute({ app, context }) {
  app.post('/ewl/bal/v1/playerpromotion/redeem', (req, res) => {
    const accountNum = context.resolveAccountNum(req.body)

    return res.status(200).json({
      errorCode: context.playerPromotionRedeemErrorCode,
      errorMsg: context.playerPromotionRedeemErrorMsg,
      accountNum,
      result: context.playerPromotionRedeemResult,
    })
  })
}

module.exports = registerPlayerPromotionRedeemRoute
