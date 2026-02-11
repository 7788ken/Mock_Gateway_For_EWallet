function registerPrizeRedemptionsSyncRoute({ app, context }) {
  app.post('/api/v1/prize-redemptions/sync', (req, res) => {
    const correlationId =
      req.body?.data?.correlationId || req.body?.correlationId || req.body?.schema?.correlationId || ''

    return res.status(200).json({
      success: context.prizeRedemptionsSyncSuccess,
      message: context.prizeRedemptionsSyncMessage,
      data: {
        correlationId,
      },
    })
  })
}

module.exports = registerPrizeRedemptionsSyncRoute
