function registerPlayerEarnRoute({ app, context }) {
  app.post('/ewl/bal/v1/player/earn', (req, res) => {
    const accountNum = context.resolveAccountNum(req.body)
    const casinoCode = req.body?.data?.casinoCode || 'GLP'
    const points = Number(process.env.MOCK_PLAYER_EARN_POINTS || 0)

    return res.status(200).json({
      errorCode: '',
      errorMsg: '',
      accountNum,
      playerEarn: [
        {
          casinoCode,
          points,
          comps: 0,
          ebonus: 0,
          stubs: 0,
          tierPoints: 0,
          mgmtComp: 0,
        },
      ],
      ratingSum: [],
    })
  })
}

module.exports = registerPlayerEarnRoute
