function registerPrizeRedeemRoute({ app, context }) {
  app.post('/ewl/bal/v1/prize/redeem', (req, res) => {
    return res.status(200).json({
      errorCode: context.prizeRedeemErrorCode,
      errorMsg: context.prizeRedeemErrorMsg,
      redeemPrize: context.prizeRedeemValue || context.generateToken('mock_redeem_prize'),
    })
  })
}

module.exports = registerPrizeRedeemRoute
