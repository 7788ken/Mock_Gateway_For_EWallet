function registerPlayerImageRoute({ app, context }) {
  app.post('/ewl/bal/v1/player/image', (req, res) => {
    const accountNum = context.resolveAccountNum(req.body)
    return res.status(200).json({
      errorCode: '',
      errorMsg: '',
      accountNum,
      image: context.mockProfile.image,
    })
  })
}

module.exports = registerPlayerImageRoute
