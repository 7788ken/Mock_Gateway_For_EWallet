const crypto = require('node:crypto')
const fs = require('node:fs')
const path = require('node:path')

function createMockContext() {
  const host = process.env.MOCK_GATEWAY_HOST || process.env.HOST || '127.0.0.1'
  const port = Number(process.env.MOCK_GATEWAY_PORT || process.env.PORT || 19090)
  const tokenPeriodSeconds = Number(process.env.MOCK_TOKEN_PERIOD_SECONDS || 3600)
  const defaultValidateResult = process.env.MOCK_VALIDATE_RESULT || 'SUCCESS'
  const configuredFailPins = (process.env.MOCK_VALIDATE_FAIL_PINS || '0000')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
  const failPins = new Set(configuredFailPins)
  const promotionMaxItemsRaw = Number(process.env.MOCK_PROMOTION_MAX_ITEMS || 30)
  const promotionMaxItems =
    Number.isFinite(promotionMaxItemsRaw) && promotionMaxItemsRaw > 0
      ? Math.floor(promotionMaxItemsRaw)
      : 30
  const promotionCaptureFile =
    process.env.MOCK_PROMOTION_CAPTURE_FILE ||
    path.resolve(__dirname, '../../fixtures/promotions.capture.800048718.json')
  const tokenGetFixtureFile =
    process.env.MOCK_TOKEN_GET_FIXTURE_FILE ||
    path.resolve(__dirname, '../../fixtures/token.get.json')
  const memberProfileFixtureFile =
    process.env.MOCK_MEMBER_PROFILE_FIXTURE_FILE ||
    path.resolve(__dirname, '../../fixtures/member.profile.json')

  const teamHierarchyStatus =
    (process.env.MOCK_TEAM_HIERARCHY_STATUS || 'true').toLowerCase() !== 'false'
  const teamHierarchyErrorCode = process.env.MOCK_TEAM_HIERARCHY_ERROR_CODE || ''
  const teamHierarchyMessage = process.env.MOCK_TEAM_HIERARCHY_MESSAGE || 'Mock team hierarchy'
  const teamHierarchyRole = process.env.MOCK_TEAM_HIERARCHY_ROLE || 'SUPPORT'
  const teamHierarchyDepartment = process.env.MOCK_TEAM_HIERARCHY_DEPARTMENT || 'IT'
  const teamHierarchyTags = (process.env.MOCK_TEAM_HIERARCHY_TAGS || 'MOCK')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)

  const prizeRedeemErrorCode = process.env.MOCK_PRIZE_REDEEM_ERROR_CODE || ''
  const prizeRedeemErrorMsg = process.env.MOCK_PRIZE_REDEEM_ERROR_MSG || ''
  const prizeRedeemValue = process.env.MOCK_PRIZE_REDEEM_VALUE || ''

  const pointVoidErrorCode = process.env.MOCK_POINT_VOID_ERROR_CODE || ''
  const pointVoidErrorMsg = process.env.MOCK_POINT_VOID_ERROR_MSG || ''
  const pointVoidResult = (process.env.MOCK_POINT_VOID_RESULT || 'true').toLowerCase() === 'true'

  const redeemedPromotionDetailErrorCode =
    process.env.MOCK_REDEEMED_PROMOTION_DETAIL_ERROR_CODE || ''
  const redeemedPromotionDetailErrorMsg =
    process.env.MOCK_REDEEMED_PROMOTION_DETAIL_ERROR_MSG || ''
  const redeemedPromotionDetailIncludeDefaultRecord =
    (process.env.MOCK_REDEEMED_PROMOTION_DETAIL_INCLUDE_DEFAULT_RECORD || 'true').toLowerCase() !==
    'false'
  const redeemedPromotionDetailVoided =
    (process.env.MOCK_REDEEMED_PROMOTION_DETAIL_VOIDED || 'false').toLowerCase() === 'true'

  const playerPromotionRedeemErrorCode =
    process.env.MOCK_PLAYERPROMOTION_REDEEM_ERROR_CODE || ''
  const playerPromotionRedeemErrorMsg =
    process.env.MOCK_PLAYERPROMOTION_REDEEM_ERROR_MSG || ''
  const playerPromotionRedeemResult =
    (process.env.MOCK_PLAYERPROMOTION_REDEEM_RESULT || 'true').toLowerCase() === 'true'

  const redeemedPromotionVoidErrorCode =
    process.env.MOCK_REDEEMEDPROMOTION_VOID_ERROR_CODE || ''
  const redeemedPromotionVoidErrorMsg =
    process.env.MOCK_REDEEMEDPROMOTION_VOID_ERROR_MSG || ''
  const redeemedPromotionVoidResult =
    (process.env.MOCK_REDEEMEDPROMOTION_VOID_RESULT || 'true').toLowerCase() === 'true'

  const prizeRedemptionsSyncSuccess =
    (process.env.MOCK_PRIZE_REDEMPTIONS_SYNC_SUCCESS || 'true').toLowerCase() !== 'false'
  const prizeRedemptionsSyncMessage =
    process.env.MOCK_PRIZE_REDEMPTIONS_SYNC_MESSAGE || 'Mock prize redemptions sync success'

  const ldapEnabled = (process.env.MOCK_LDAP_ENABLED || 'true').toLowerCase() !== 'false'
  const ldapHost = process.env.MOCK_LDAP_HOST || '0.0.0.0'
  const ldapPort = Number(process.env.MOCK_LDAP_PORT || 1389)
  const ldapBaseDn = process.env.MOCK_LDAP_BASE_DN || 'dc=macausjm-glp,dc=com'
  const ldapManagerDn =
    process.env.MOCK_LDAP_MANAGER_DN || `cn=s-cicd-app,OU=ServiceAccount,${ldapBaseDn}`
  const ldapGroupBaseDn =
    process.env.MOCK_LDAP_GROUP_BASE_DN || `OU=SecurityGroups,OU=GLPUsers,${ldapBaseDn}`
  const ldapManagerPassword = process.env.MOCK_LDAP_MANAGER_PASSWORD || ''
  const ldapAllowAnyUserMode =
    (process.env.MOCK_LDAP_ALLOW_ANY_USER_MODE || 'true').toLowerCase() === 'true'
  const ldapAllowAnyUserOu = process.env.MOCK_LDAP_ALLOW_ANY_USER_OU || 'OU=GLPUsers'
  const ldapAllowAnyUserGroupCn =
    process.env.MOCK_LDAP_ALLOW_ANY_USER_GROUP_CN || 'SG-APP-EWALLET-SUPER-ADMIN'
  const ldapAllowAnyUserMailDomain =
    process.env.MOCK_LDAP_ALLOW_ANY_USER_MAIL_DOMAIN || 'macausjm-glp.com'

  const mockProfile = {
    firstName: process.env.MOCK_MEMBER_FIRST_NAME || 'MOCK',
    lastName: process.env.MOCK_MEMBER_LAST_NAME || 'MEMBER',
    tier: process.env.MOCK_MEMBER_TIER || 'MOCK',
    eBonus: process.env.MOCK_MEMBER_EBONUS || '0',
    phoneNum: process.env.MOCK_MEMBER_PHONE || '12345678',
    birthday: process.env.MOCK_MEMBER_BIRTHDAY || '1990-01-01',
    gender: process.env.MOCK_MEMBER_GENDER || 'M',
    image: process.env.MOCK_MEMBER_IMAGE || '',
  }
  const fallbackEligiblePromotionList = [
    {
      awardUsedLimit: 0,
      awardsCount: 0,
      awardsEligible: 0,
      awardsEntitled: 0,
      awardsRedeemLimit: 999,
      earnedPoints: 0,
      isDirectOffer: false,
      isEligible: true,
      isEntitled: false,
      isOptIn: false,
      isOptedInByPlayer: false,
      isRedeemCompleted: false,
      maxOutcome: 2,
      minOutcome: 2,
      startDate: '2026-01-27T06:00',
      endDate: '2026-04-30T06:00',
      id: 71768004,
      code: 'LP-EE-CNYGS26',
      name: 'CNY Gift Set Earn & Get-2026',
      ruleId: 71768024,
      ruleName: 'CNYGS-188pts-Hennessy VSOP + LCH Dried Scallop',
      ruleNameDesc: 'CNYGS-188pts-Hennessy VSOP + LCH Dried Scallop',
      toEarn1Unit: 188,
      isRedeemAll: false,
      outcomeList: [
        {
          key: 71768069,
          value: 'lp-ee-cnygs26-188pts-hennessyvsop-me',
          isInventoryCheck: null,
          qtyOnHand: null,
        },
        {
          key: 71768070,
          value: 'lp-ee-cnygs26-188pts-lchscallop-me',
          isInventoryCheck: null,
          qtyOnHand: null,
        },
      ],
    },
  ]
  const fallbackTokenGetResponseFixture = {
    errorCode: '',
    errorMsg: '',
    accessToken: '',
    refreshToken: '',
    period: 3600,
  }
  const fallbackMemberProfileResponseFixture = {
    status: true,
    errorCode: '',
    message: 'Mock member profile',
    data: {
      accountNum: '',
      playerId: '',
      isActive: true,
      isDeactive: false,
      isBanned: false,
      currentTier: 'MOCK',
      eBonus: '0',
      clubState: 1,
      primaryHost: 'MOCK HOST',
      primaryHostID: 1000001,
      secondaryHost: 'MOCK SECOND HOST',
      secondaryHostID: 1000002,
      phoneList: [
        {
          phoneNum: '12345678',
          phoneType: 'Mobile1',
        },
      ],
      player: {
        title: 'Mr',
        firstName: 'MOCK',
        lastName: 'MEMBER',
        middleName: '',
        nickName: 'MOCK',
        image: '',
      },
      attribute: {
        birthday: '1990-01-01',
        gender: 'M',
        height: '',
        weight: '',
        smoker: false,
        languageCode: 'en',
      },
      addressList: [],
      identityList: [],
      emailList: [],
    },
  }

  const issuedRefreshTokens = new Set()

  function generateToken(prefix) {
    return `${prefix}_${crypto.randomUUID().replace(/-/g, '')}`
  }

  function resolveAccountNum(requestBody) {
    return requestBody?.data?.accountNum || requestBody?.data?.playerId || ''
  }

  function cloneJsonValue(value) {
    if (value === undefined || value === null) {
      return value
    }

    return JSON.parse(JSON.stringify(value))
  }

  function tokenSuccessResponse() {
    const tokenTemplate = cloneJsonValue(tokenGetResponseFixture)
    const accessToken = generateToken('mock_access')
    const refreshToken = generateToken('mock_refresh')
    issuedRefreshTokens.add(refreshToken)
    const templatePeriod = Number(tokenTemplate?.period)
    const envPeriod =
      Number.isFinite(tokenPeriodSeconds) && tokenPeriodSeconds > 0 ? tokenPeriodSeconds : null
    const resolvedPeriod =
      envPeriod ??
      (Number.isFinite(templatePeriod) && templatePeriod > 0
        ? templatePeriod
        : fallbackTokenGetResponseFixture.period)

    return {
      ...tokenTemplate,
      errorCode: '',
      errorMsg: '',
      accessToken,
      refreshToken,
      period: resolvedPeriod,
    }
  }

  function extractJsonPayload(rawText) {
    const firstJsonCharIndex = rawText.indexOf('{')
    if (firstJsonCharIndex < 0) {
      return null
    }

    const jsonText = rawText.slice(firstJsonCharIndex).trim()
    if (!jsonText) {
      return null
    }

    return JSON.parse(jsonText)
  }

  function normalizeOutcomeList(outcomeList) {
    if (!Array.isArray(outcomeList)) {
      return []
    }

    return outcomeList.map((item) => ({
      key: item?.key ?? null,
      value: item?.value || '',
      isInventoryCheck: item?.isInventoryCheck ?? null,
      qtyOnHand: item?.qtyOnHand ?? null,
    }))
  }

  function normalizePromotionList(promotionList) {
    if (!Array.isArray(promotionList)) {
      return []
    }

    return promotionList.map((item) => ({
      awardUsedLimit: item?.awardUsedLimit ?? 0,
      awardsCount: item?.awardsCount ?? 0,
      awardsEligible: item?.awardsEligible ?? 0,
      awardsEntitled: item?.awardsEntitled ?? 0,
      awardsRedeemLimit: item?.awardsRedeemLimit ?? 0,
      earnedPoints: item?.earnedPoints ?? 0,
      isDirectOffer: item?.isDirectOffer ?? false,
      isEligible: item?.isEligible ?? false,
      isEntitled: item?.isEntitled ?? false,
      isOptIn: item?.isOptIn ?? false,
      isOptedInByPlayer: item?.isOptedInByPlayer ?? false,
      isRedeemCompleted: item?.isRedeemCompleted ?? false,
      maxOutcome: item?.maxOutcome ?? 0,
      minOutcome: item?.minOutcome ?? 0,
      startDate: item?.startDate || '',
      endDate: item?.endDate || '',
      id: item?.id ?? null,
      code: item?.code || '',
      name: item?.name || '',
      ruleId: item?.ruleId ?? null,
      ruleName: item?.ruleName || '',
      ruleNameDesc: item?.ruleNameDesc || '',
      toEarn1Unit: item?.toEarn1Unit ?? 0,
      isRedeemAll: item?.isRedeemAll ?? false,
      outcomeList: normalizeOutcomeList(item?.outcomeList),
    }))
  }

  function buildMockRedeemedPromotionOutcome(requestBody) {
    const now = new Date().toISOString()
    const loginId = requestBody?.data?.loginId || 'mock.user'
    const gamingDate = now.slice(0, 10)

    return {
      gamingDate,
      normalPromo: true,
      postedBy: loginId,
      postedDtm: now,
      casinoCode: requestBody?.data?.casinoCode || 'GLP',
      locationCode: requestBody?.data?.locationCode || 'MOCK',
      computerName: requestBody?.schema?.computerName || 'mock-gateway',
      ipAddress: requestBody?.schema?.ipAddress || host,
      prizeRuleCode: 'MOCK-PRIZE-RULE',
      prizeRuleId: 100001,
      promotionCode: 'MOCK-PROMOTION',
      promotionId: 100002,
      redeemedQty: 1,
      redemptionId: 900001,
      remark: 'Mock redeemed promotion detail',
      outcome: {
        redeemedList: [
          {
            outcomeRemark: 'MOCK-PRIZE-CODE',
            outcomeType: 'PRIZE',
            prizeCategory: 'PROMOTION',
            transId: generateToken('mock_trans'),
          },
        ],
      },
      outcomeAward: null,
      voidedBy: redeemedPromotionDetailVoided ? loginId : '',
      voidedDtm: redeemedPromotionDetailVoided ? now : '',
      voidedGamingDate: redeemedPromotionDetailVoided ? gamingDate : '',
      voidedRemark: redeemedPromotionDetailVoided ? 'Mock voided redeemed promotion' : '',
      displayOnlyPromo: false,
      isVoided: redeemedPromotionDetailVoided,
    }
  }

  function loadPromotionCapture(filePath) {
    if (!filePath || !fs.existsSync(filePath)) {
      return null
    }

    try {
      const rawContent = fs.readFileSync(filePath, 'utf8')
      const parsed = extractJsonPayload(rawContent)
      if (!parsed) {
        return null
      }

      const data = parsed?.data && typeof parsed.data === 'object' ? parsed.data : parsed
      const eligiblePromotionList = normalizePromotionList(data?.eligiblePromotionList)
      const entitledPromotionList = normalizePromotionList(data?.entitledPromotionList)

      if (eligiblePromotionList.length === 0 && entitledPromotionList.length === 0) {
        return null
      }

      console.log(`Loaded promotion fixture from ${filePath}`)
      return {
        eligiblePromotionList,
        entitledPromotionList,
      }
    } catch (error) {
      console.warn(`Failed to load promotion fixture from ${filePath}: ${error.message}`)
      return null
    }
  }

  function loadJsonFixture(filePath, fallbackValue, fixtureName) {
    if (!filePath || !fs.existsSync(filePath)) {
      return cloneJsonValue(fallbackValue)
    }

    try {
      const rawContent = fs.readFileSync(filePath, 'utf8')
      let parsed
      try {
        parsed = JSON.parse(rawContent)
      } catch (error) {
        parsed = extractJsonPayload(rawContent)
      }

      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('fixture must be a JSON object')
      }

      console.log(`Loaded ${fixtureName} fixture from ${filePath}`)
      return parsed
    } catch (error) {
      console.warn(`Failed to load ${fixtureName} fixture from ${filePath}: ${error.message}`)
      return cloneJsonValue(fallbackValue)
    }
  }

  function trimPromotionList(promotionList) {
    return promotionList.slice(0, promotionMaxItems)
  }

  const promotionCapture = loadPromotionCapture(promotionCaptureFile)
  const normalizedFallbackEligiblePromotionList = normalizePromotionList(fallbackEligiblePromotionList)
  const tokenGetResponseFixture = loadJsonFixture(
    tokenGetFixtureFile,
    fallbackTokenGetResponseFixture,
    'token.get',
  )
  const memberProfileResponseFixture = loadJsonFixture(
    memberProfileFixtureFile,
    fallbackMemberProfileResponseFixture,
    'member.profile',
  )

  return {
    host,
    port,
    defaultValidateResult,
    failPins,
    mockProfile,
    teamHierarchyStatus,
    teamHierarchyErrorCode,
    teamHierarchyMessage,
    teamHierarchyRole,
    teamHierarchyDepartment,
    teamHierarchyTags,
    prizeRedeemErrorCode,
    prizeRedeemErrorMsg,
    prizeRedeemValue,
    pointVoidErrorCode,
    pointVoidErrorMsg,
    pointVoidResult,
    redeemedPromotionDetailErrorCode,
    redeemedPromotionDetailErrorMsg,
    redeemedPromotionDetailIncludeDefaultRecord,
    redeemedPromotionDetailVoided,
    playerPromotionRedeemErrorCode,
    playerPromotionRedeemErrorMsg,
    playerPromotionRedeemResult,
    redeemedPromotionVoidErrorCode,
    redeemedPromotionVoidErrorMsg,
    redeemedPromotionVoidResult,
    prizeRedemptionsSyncSuccess,
    prizeRedemptionsSyncMessage,
    ldap: {
      ldapEnabled,
      ldapHost,
      ldapPort,
      ldapBaseDn,
      ldapManagerDn,
      ldapGroupBaseDn,
      ldapManagerPassword,
      ldapAllowAnyUserMode,
      ldapAllowAnyUserOu,
      ldapAllowAnyUserGroupCn,
      ldapAllowAnyUserMailDomain,
    },
    edipForceErrorCode: process.env.MOCK_EDIP_FORCE_ERROR_CODE || '',
    edipForceErrorMsg: process.env.MOCK_EDIP_FORCE_ERROR_MSG || 'Mock EDIP token error',
    edipRefreshTokenMustExist:
      (process.env.MOCK_EDIP_REFRESH_TOKEN_MUST_EXIST || 'false') === 'true',
    promotionCapture,
    normalizedFallbackEligiblePromotionList,
    memberProfileResponseFixture,
    issuedRefreshTokens,
    generateToken,
    resolveAccountNum,
    tokenSuccessResponse,
    trimPromotionList,
    buildMockRedeemedPromotionOutcome,
    cloneJsonValue,
  }
}

module.exports = { createMockContext }
