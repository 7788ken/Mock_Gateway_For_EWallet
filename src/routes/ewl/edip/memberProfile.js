function registerMemberProfileRoute({ app, context }) {
  app.post('/ewl/edip/v1/member/profile', (req, res) => {
    const accountNum = context.resolveAccountNum(req.body)

    if (!accountNum) {
      return res.status(200).json({
        status: false,
        errorCode: 'NOT_FOUND',
        message: 'accountNum or playerId is required',
        data: null,
      })
    }

    const memberProfileTemplate = context.cloneJsonValue(context.memberProfileResponseFixture)
    const memberProfileDataTemplate =
      memberProfileTemplate?.data && typeof memberProfileTemplate.data === 'object'
        ? memberProfileTemplate.data
        : {}
    const playerTemplate =
      memberProfileDataTemplate?.player && typeof memberProfileDataTemplate.player === 'object'
        ? memberProfileDataTemplate.player
        : {}
    const attributeTemplate =
      memberProfileDataTemplate?.attribute && typeof memberProfileDataTemplate.attribute === 'object'
        ? memberProfileDataTemplate.attribute
        : {}
    const phoneListTemplate = Array.isArray(memberProfileDataTemplate.phoneList)
      ? memberProfileDataTemplate.phoneList
      : []
    const firstPhoneTemplate =
      phoneListTemplate.length > 0 && phoneListTemplate[0] && typeof phoneListTemplate[0] === 'object'
        ? phoneListTemplate[0]
        : {}

    return res.status(200).json({
      ...memberProfileTemplate,
      status: memberProfileTemplate?.status ?? true,
      errorCode: `${memberProfileTemplate?.errorCode || ''}`,
      message: memberProfileTemplate?.message || 'Mock member profile',
      data: {
        ...memberProfileDataTemplate,
        accountNum,
        playerId: req.body?.data?.playerId || accountNum,
        currentTier: context.mockProfile.tier,
        eBonus: context.mockProfile.eBonus,
        phoneList: [
          {
            ...firstPhoneTemplate,
            phoneNum: context.mockProfile.phoneNum,
            phoneType: firstPhoneTemplate.phoneType || 'Mobile1',
          },
        ],
        player: {
          ...playerTemplate,
          firstName: context.mockProfile.firstName,
          lastName: context.mockProfile.lastName,
          nickName: context.mockProfile.firstName,
          image: context.mockProfile.image,
        },
        attribute: {
          ...attributeTemplate,
          birthday: context.mockProfile.birthday,
          gender: context.mockProfile.gender,
        },
        addressList: Array.isArray(memberProfileDataTemplate.addressList)
          ? memberProfileDataTemplate.addressList
          : [],
        identityList: Array.isArray(memberProfileDataTemplate.identityList)
          ? memberProfileDataTemplate.identityList
          : [],
        emailList: Array.isArray(memberProfileDataTemplate.emailList)
          ? memberProfileDataTemplate.emailList
          : [],
      },
    })
  })
}

module.exports = registerMemberProfileRoute
