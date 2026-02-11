require('dotenv').config()

const crypto = require('node:crypto')
const fs = require('node:fs')
const path = require('node:path')
const express = require('express')
const ldap = require('ldapjs')

const app = express()
app.use(express.json({ limit: '2mb' }))

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
  path.resolve(__dirname, '../fixtures/promotions.capture.800048718.json')
const teamHierarchyStatus = (process.env.MOCK_TEAM_HIERARCHY_STATUS || 'true').toLowerCase() !== 'false'
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

const redeemedPromotionVoidErrorCode = process.env.MOCK_REDEEMEDPROMOTION_VOID_ERROR_CODE || ''
const redeemedPromotionVoidErrorMsg = process.env.MOCK_REDEEMEDPROMOTION_VOID_ERROR_MSG || ''
const redeemedPromotionVoidResult =
  (process.env.MOCK_REDEEMEDPROMOTION_VOID_RESULT || 'true').toLowerCase() === 'true'

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

const issuedRefreshTokens = new Set()

function generateToken(prefix) {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, '')}`
}

function resolveAccountNum(requestBody) {
  return requestBody?.data?.accountNum || requestBody?.data?.playerId || ''
}

function tokenSuccessResponse() {
  const accessToken = generateToken('mock_access')
  const refreshToken = generateToken('mock_refresh')
  issuedRefreshTokens.add(refreshToken)

  return {
    errorCode: '',
    errorMsg: '',
    accessToken,
    refreshToken,
    period: tokenPeriodSeconds,
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

function trimPromotionList(promotionList) {
  return promotionList.slice(0, promotionMaxItems)
}

const promotionCapture = loadPromotionCapture(promotionCaptureFile)
const normalizedFallbackEligiblePromotionList = normalizePromotionList(fallbackEligiblePromotionList)

function normalizeDn(value) {
  const raw = `${value || ''}`.trim()
  if (!raw) {
    return ''
  }

  try {
    return ldap.parseDN(raw).toString().toLowerCase()
  } catch (error) {
    return raw.toLowerCase()
  }
}

function splitDnList(value) {
  if (Array.isArray(value)) {
    return value
      .map((entry) => `${entry || ''}`.trim())
      .filter(Boolean)
  }

  if (typeof value !== 'string') {
    return []
  }

  return value
    .split(';')
    .map((entry) => entry.trim())
    .filter(Boolean)
}

function dedupeDnValues(values) {
  const seen = new Set()
  const result = []

  for (const value of values) {
    const normalized = normalizeDn(value)
    if (!normalized || seen.has(normalized)) {
      continue
    }
    seen.add(normalized)
    result.push(value)
  }

  return result
}

function extractCnFromDn(dn) {
  const input = `${dn || ''}`.trim()
  if (!input) {
    return ''
  }

  const firstPart = input.split(',')[0] || ''
  const match = /^cn=([^,]+)$/i.exec(firstPart.trim())
  return match ? match[1] : ''
}

function buildDefaultLdapUser() {
  const username =
    process.env.MOCK_LDAP_USER_USERNAME ||
    process.env.MOCK_LDAP_DEFAULT_USER_SAMACCOUNTNAME ||
    'mock.user'
  const dn =
    process.env.MOCK_LDAP_USER_DN ||
    process.env.MOCK_LDAP_DEFAULT_USER_DN ||
    `cn=${username},OU=GLPUsers,${ldapBaseDn}`
  const memberOfRaw =
    process.env.MOCK_LDAP_USER_MEMBER_OF ||
    process.env.MOCK_LDAP_DEFAULT_USER_MEMBER_OF ||
    process.env.MOCK_LDAP_USER_GROUPS ||
    `cn=${ldapAllowAnyUserGroupCn},${ldapGroupBaseDn}`
  const memberOf = dedupeDnValues(splitDnList(memberOfRaw))

  return {
    dn,
    sAMAccountName: username,
    cn:
      process.env.MOCK_LDAP_USER_CN ||
      process.env.MOCK_LDAP_DEFAULT_USER_CN ||
      'Mock User',
    mail:
      process.env.MOCK_LDAP_USER_MAIL ||
      process.env.MOCK_LDAP_DEFAULT_USER_MAIL ||
      'mock.user@macausjm-glp.com',
    password:
      process.env.MOCK_LDAP_USER_PASSWORD ||
      process.env.MOCK_LDAP_DEFAULT_USER_PASSWORD ||
      'MockUser@123',
    memberOf,
  }
}

function normalizeLdapUser(item, fallbackUser) {
  const username = `${item?.sAMAccountName || item?.username || ''}`.trim()
  if (!username) {
    return null
  }

  const dn = `${item?.dn || `cn=${username},OU=GLPUsers,${ldapBaseDn}`}`.trim()
  if (!dn) {
    return null
  }

  const memberOfRaw = item?.memberOf || item?.groups || fallbackUser.memberOf
  const memberOf = dedupeDnValues(splitDnList(memberOfRaw))

  return {
    dn,
    sAMAccountName: username,
    cn: `${item?.cn || username}`.trim(),
    mail: `${item?.mail || `${username}@macausjm-glp.com`}`.trim(),
    password: `${item?.password || fallbackUser.password}`,
    memberOf,
  }
}

function buildLdapUsers() {
  const fallbackUser = buildDefaultLdapUser()
  const rawUsersJson = process.env.MOCK_LDAP_USERS_JSON

  if (!rawUsersJson) {
    return [fallbackUser]
  }

  try {
    const parsed = JSON.parse(rawUsersJson)
    if (!Array.isArray(parsed)) {
      return [fallbackUser]
    }

    const users = parsed
      .map((item) => normalizeLdapUser(item, fallbackUser))
      .filter((item) => Boolean(item))

    return users.length > 0 ? users : [fallbackUser]
  } catch (error) {
    console.error(`Failed to parse MOCK_LDAP_USERS_JSON: ${error.message}`)
    return [fallbackUser]
  }
}

function normalizeGroupEntry(entry) {
  if (!entry || typeof entry !== 'object') {
    return null
  }

  const dn = `${entry.dn || ''}`.trim()
  if (!dn) {
    return null
  }

  const member = dedupeDnValues(splitDnList(entry.member || []))
  const cn = `${entry.cn || extractCnFromDn(dn) || 'UNKNOWN'}`.trim()

  return {
    dn,
    cn,
    member,
  }
}

function buildLdapGroups(users) {
  const groupMap = new Map()

  for (const user of users) {
    for (const groupDn of user.memberOf) {
      const normalizedGroupDn = normalizeDn(groupDn)
      if (!normalizedGroupDn) {
        continue
      }

      if (!groupMap.has(normalizedGroupDn)) {
        groupMap.set(normalizedGroupDn, {
          dn: groupDn,
          cn: extractCnFromDn(groupDn) || 'UNKNOWN',
          member: [],
        })
      }

      const group = groupMap.get(normalizedGroupDn)
      if (!group.member.some((value) => normalizeDn(value) === normalizeDn(user.dn))) {
        group.member.push(user.dn)
      }
    }
  }

  const rawGroupsJson = process.env.MOCK_LDAP_GROUPS_JSON
  if (rawGroupsJson) {
    try {
      const parsedGroups = JSON.parse(rawGroupsJson)
      if (Array.isArray(parsedGroups)) {
        for (const item of parsedGroups) {
          const group = normalizeGroupEntry(item)
          if (!group) {
            continue
          }

          const normalizedDn = normalizeDn(group.dn)
          if (!groupMap.has(normalizedDn)) {
            groupMap.set(normalizedDn, group)
            continue
          }

          const existing = groupMap.get(normalizedDn)
          existing.cn = group.cn || existing.cn
          existing.member = dedupeDnValues([...existing.member, ...group.member])
        }
      }
    } catch (error) {
      console.error(`Failed to parse MOCK_LDAP_GROUPS_JSON: ${error.message}`)
    }
  }

  return [...groupMap.values()]
}

const ldapUsers = buildLdapUsers()
const ldapGroups = buildLdapGroups(ldapUsers)
const ldapUsersByDn = new Map(ldapUsers.map((user) => [normalizeDn(user.dn), user]))
const normalizedManagerDn = normalizeDn(ldapManagerDn)

function getDnDepth(value) {
  const normalized = normalizeDn(value)
  if (!normalized) {
    return 0
  }

  try {
    return ldap.parseDN(normalized).rdns.length
  } catch (error) {
    return normalized.split(',').length
  }
}

function isDnInScope(entryDn, baseDn, scope) {
  const normalizedEntryDn = normalizeDn(entryDn)
  const normalizedBaseDn = normalizeDn(baseDn)

  if (!normalizedEntryDn || !normalizedBaseDn) {
    return false
  }

  if (scope === 'base') {
    return normalizedEntryDn === normalizedBaseDn
  }

  if (scope === 'one') {
    if (!normalizedEntryDn.endsWith(`,${normalizedBaseDn}`)) {
      return false
    }

    return getDnDepth(normalizedEntryDn) === getDnDepth(normalizedBaseDn) + 1
  }

  return (
    normalizedEntryDn === normalizedBaseDn ||
    normalizedEntryDn.endsWith(`,${normalizedBaseDn}`)
  )
}

function resolveSearchBase(searchBase) {
  const raw = `${searchBase || ''}`.trim()
  if (!raw) {
    return ldapBaseDn
  }

  const normalizedRaw = normalizeDn(raw)
  const normalizedBase = normalizeDn(ldapBaseDn)

  if (!normalizedRaw) {
    return ldapBaseDn
  }

  if (normalizedRaw === normalizedBase || normalizedRaw.endsWith(`,${normalizedBase}`)) {
    return raw
  }

  if (!/dc=/i.test(raw)) {
    return `${raw},${ldapBaseDn}`
  }

  return raw
}

function buildUserAttributes(user) {
  return {
    objectClass: ['top', 'person', 'organizationalPerson', 'user'],
    distinguishedName: user.dn,
    sAMAccountName: user.sAMAccountName,
    cn: user.cn,
    mail: user.mail,
    memberOf: user.memberOf,
  }
}

function buildGroupAttributes(group) {
  return {
    objectClass: ['top', 'group'],
    distinguishedName: group.dn,
    cn: group.cn,
    member: group.member,
  }
}

function matchesFilter(filter, attributes) {
  try {
    return filter.matches(attributes)
  } catch (error) {
    return false
  }
}

function dedupeStringValues(values) {
  const seen = new Set()
  const result = []

  for (const value of values) {
    const normalized = `${value || ''}`.trim().toLowerCase()
    if (!normalized || seen.has(normalized)) {
      continue
    }
    seen.add(normalized)
    result.push(`${value || ''}`.trim())
  }

  return result
}

function extractEqFilterValues(filter, attributeName, result = []) {
  if (!filter || typeof filter !== 'object') {
    return result
  }

  const attr = `${filter.attribute || ''}`.trim().toLowerCase()
  if (attr === `${attributeName}`.toLowerCase()) {
    const rawValue = filter.value
    const value = Buffer.isBuffer(rawValue)
      ? rawValue.toString('utf8').trim()
      : `${rawValue || ''}`.trim()

    if (value) {
      result.push(value)
    }
  }

  if (Array.isArray(filter.filters)) {
    for (const childFilter of filter.filters) {
      extractEqFilterValues(childFilter, attributeName, result)
    }
  }

  return result
}

function sanitizeSamAccountName(value) {
  return `${value || ''}`
    .trim()
    .replace(/[\0-\x1f\x7f,=+<>#;"\\]/g, '')
}

function buildAnyModeUser(username) {
  const normalizedUsername = sanitizeSamAccountName(username)
  if (!normalizedUsername) {
    return null
  }

  const defaultGroupDn = `cn=${ldapAllowAnyUserGroupCn},${ldapGroupBaseDn}`
  const configuredGroupDns = ldapGroups.map((group) => group.dn)
  const memberOf = dedupeDnValues(
    configuredGroupDns.length > 0 ? configuredGroupDns : [defaultGroupDn],
  )

  return {
    dn: `cn=${normalizedUsername},${ldapAllowAnyUserOu},${ldapBaseDn}`,
    sAMAccountName: normalizedUsername,
    cn: normalizedUsername,
    mail: `${normalizedUsername}@${ldapAllowAnyUserMailDomain}`,
    memberOf,
  }
}

function buildAnyModeGroups(memberDn) {
  const normalizedMemberDn = `${memberDn || ''}`.trim()
  if (!normalizedMemberDn) {
    return []
  }

  if (ldapGroups.length === 0) {
    return [
      {
        dn: `cn=${ldapAllowAnyUserGroupCn},${ldapGroupBaseDn}`,
        cn: ldapAllowAnyUserGroupCn,
        member: [normalizedMemberDn],
      },
    ]
  }

  return ldapGroups.map((group) => ({
    dn: group.dn,
    cn: group.cn,
    member: [normalizedMemberDn],
  }))
}

function handleLdapBind(req, res, next) {
  const bindDn = req.dn?.toString() || ''
  const normalizedBindDn = normalizeDn(bindDn)
  const credentials = `${req.credentials || ''}`

  if (!normalizedBindDn) {
    return next(new ldap.InvalidCredentialsError())
  }

  if (ldapAllowAnyUserMode) {
    res.end()
    return next()
  }

  if (normalizedBindDn === normalizedManagerDn) {
    if (!ldapManagerPassword || credentials === ldapManagerPassword) {
      res.end()
      return next()
    }
    return next(new ldap.InvalidCredentialsError())
  }

  const user = ldapUsersByDn.get(normalizedBindDn)
  if (!user || credentials !== `${user.password}`) {
    return next(new ldap.InvalidCredentialsError())
  }

  res.end()
  return next()
}

function handleLdapSearch(req, res, next) {
  const searchBase = resolveSearchBase(req.dn?.toString())
  const scope = req.scope || 'sub'

  if (ldapAllowAnyUserMode) {
    let hasAnyModeResult = false
    const usernames = dedupeStringValues(extractEqFilterValues(req.filter, 'sAMAccountName'))
    const memberDns = dedupeDnValues(extractEqFilterValues(req.filter, 'member'))

    for (const username of usernames) {
      const anyModeUser = buildAnyModeUser(username)
      if (!anyModeUser || !isDnInScope(anyModeUser.dn, searchBase, scope)) {
        continue
      }

      const attributes = buildUserAttributes(anyModeUser)
      if (!matchesFilter(req.filter, attributes)) {
        continue
      }

      hasAnyModeResult = true
      res.send({
        dn: anyModeUser.dn,
        attributes,
      })
    }

    for (const memberDn of memberDns) {
      for (const anyModeGroup of buildAnyModeGroups(memberDn)) {
        if (!isDnInScope(anyModeGroup.dn, searchBase, scope)) {
          continue
        }

        const attributes = buildGroupAttributes(anyModeGroup)
        if (!matchesFilter(req.filter, attributes)) {
          continue
        }

        hasAnyModeResult = true
        res.send({
          dn: anyModeGroup.dn,
          attributes,
        })
      }
    }

    if (hasAnyModeResult) {
      res.end()
      return next()
    }
  }

  for (const user of ldapUsers) {
    if (!isDnInScope(user.dn, searchBase, scope)) {
      continue
    }

    const attributes = buildUserAttributes(user)
    if (matchesFilter(req.filter, attributes)) {
      res.send({
        dn: user.dn,
        attributes,
      })
    }
  }

  for (const group of ldapGroups) {
    if (!isDnInScope(group.dn, searchBase, scope)) {
      continue
    }

    const attributes = buildGroupAttributes(group)
    if (matchesFilter(req.filter, attributes)) {
      res.send({
        dn: group.dn,
        attributes,
      })
    }
  }

  res.end()
  return next()
}

function startLdapServer() {
  if (!ldapEnabled) {
    return null
  }

  const ldapServer = ldap.createServer()
  ldapServer.bind(ldapBaseDn, handleLdapBind)
  ldapServer.bind('', handleLdapBind)
  ldapServer.search(ldapBaseDn, handleLdapSearch)
  ldapServer.search('', handleLdapSearch)

  ldapServer.on('error', (error) => {
    console.error(`LDAP server error: ${error.message}`)
  })

  ldapServer.listen(ldapPort, ldapHost, () => {
    console.log(
      `Mock LDAP listening on ldap://${ldapHost}:${ldapPort} (base=${ldapBaseDn}, users=${ldapUsers.length}, groups=${ldapGroups.length})`,
    )
  })

  return ldapServer
}

app.get('/healthz', (req, res) => {
  res.json({
    status: 'ok',
    service: 'ewallet-mock-gateway',
    now: new Date().toISOString(),
    ldap: {
      enabled: ldapEnabled,
      allowAnyUserMode: ldapAllowAnyUserMode,
      url: `ldap://${ldapHost}:${ldapPort}`,
      managerDn: ldapManagerDn,
      baseDn: ldapBaseDn,
      users: ldapUsers.map((user) => ({
        sAMAccountName: user.sAMAccountName,
        dn: user.dn,
      })),
      groups: ldapGroups.map((group) => ({
        cn: group.cn,
        dn: group.dn,
      })),
    },
  })
})

app.post('/edip/v1/token/get', (req, res) => {
  const forceErrorCode = process.env.MOCK_EDIP_FORCE_ERROR_CODE || ''
  if (forceErrorCode) {
    return res.status(200).json({
      errorCode: forceErrorCode,
      errorMsg: process.env.MOCK_EDIP_FORCE_ERROR_MSG || 'Mock EDIP token error',
      accessToken: '',
      refreshToken: '',
      period: 0,
    })
  }

  return res.status(200).json(tokenSuccessResponse())
})

app.post('/edip/v1/token/refresh', (req, res) => {
  const refreshToken = req.body?.data?.refreshToken
  if (!refreshToken) {
    return res.status(200).json({
      errorCode: 'MISSING_REFRESH_TOKEN',
      errorMsg: 'refreshToken is required',
      accessToken: '',
      refreshToken: '',
      period: 0,
    })
  }

  const mustExist = (process.env.MOCK_EDIP_REFRESH_TOKEN_MUST_EXIST || 'false') === 'true'
  if (mustExist && !issuedRefreshTokens.has(refreshToken)) {
    return res.status(200).json({
      errorCode: 'INVALID_REFRESH_TOKEN',
      errorMsg: 'refreshToken not recognized by mock gateway',
      accessToken: '',
      refreshToken: '',
      period: 0,
    })
  }

  return res.status(200).json(tokenSuccessResponse())
})

app.post('/ewl/bal/v1/cardpin/validate', (req, res) => {
  const accountNum = resolveAccountNum(req.body)
  const pin = `${req.body?.data?.pin || ''}`

  if (failPins.has(pin)) {
    return res.status(200).json({
      errorCode: 'INVALID_PIN',
      errorMsg: 'Mock validation failed',
      accountNum,
      result: 'FAIL',
    })
  }

  return res.status(200).json({
    errorCode: '',
    errorMsg: '',
    accountNum,
    result: defaultValidateResult,
  })
})

app.post('/ewl/mkt-rm/v1/team/hierarchy', (req, res) => {
  const requestedUserName = `${req.body?.data?.userName || 'mock.user'}`.trim() || 'mock.user'
  const requestedStaffId = `${req.body?.data?.staffId || 'M000001'}`.trim() || 'M000001'
  const resolvedTags = teamHierarchyTags.length > 0 ? teamHierarchyTags : ['MOCK']
  const teamMember = {
    name: requestedUserName,
    userName: requestedUserName,
    mail: `${requestedUserName}@macausjm-glp.com`,
    description: 'Mock team member',
    staffId: requestedStaffId,
    teamRole: teamHierarchyRole,
    tags: resolvedTags,
  }
  const supportTeam = {
    teamName: 'Mock Support Team',
    description: 'Mock support team',
    department: teamHierarchyDepartment,
    hierarchy: [
      {
        name: 'Support',
        priority: 1,
        members: [teamMember],
        tags: resolvedTags,
      },
    ],
    supportTeams: [],
  }

  return res.status(200).json({
    status: teamHierarchyStatus,
    errorCode: teamHierarchyErrorCode,
    message: teamHierarchyMessage,
    data: {
      userName: requestedUserName,
      staffId: requestedStaffId,
      name: requestedUserName,
      mail: `${requestedUserName}@macausjm-glp.com`,
      teamRole: teamHierarchyRole,
      tags: resolvedTags,
      teams: [
        {
          teamName: 'Mock Team',
          description: 'Mock team hierarchy',
          department: teamHierarchyDepartment,
          hierarchy: [
            {
              name: 'Main Team',
              priority: 1,
              members: [teamMember],
              tags: resolvedTags,
            },
          ],
          supportTeams: [supportTeam],
        },
      ],
    },
  })
})

app.post('/ewl/edip/v1/member/profile', (req, res) => {
  const accountNum = resolveAccountNum(req.body)

  if (!accountNum) {
    return res.status(200).json({
      status: false,
      errorCode: 'NOT_FOUND',
      message: 'accountNum or playerId is required',
      data: null,
    })
  }

  return res.status(200).json({
    status: true,
    errorCode: '',
    message: 'Mock member profile',
    data: {
      accountNum,
      playerId: req.body?.data?.playerId || accountNum,
      isActive: true,
      isDeactive: false,
      isBanned: false,
      currentTier: mockProfile.tier,
      eBonus: mockProfile.eBonus,
      clubState: 1,
      primaryHost: 'MOCK HOST',
      primaryHostID: 1000001,
      secondaryHost: 'MOCK SECOND HOST',
      secondaryHostID: 1000002,
      phoneList: [
        {
          phoneNum: mockProfile.phoneNum,
          phoneType: 'Mobile1',
        },
      ],
      player: {
        title: 'Mr',
        firstName: mockProfile.firstName,
        lastName: mockProfile.lastName,
        middleName: '',
        nickName: mockProfile.firstName,
        image: mockProfile.image,
      },
      attribute: {
        birthday: mockProfile.birthday,
        gender: mockProfile.gender,
        height: '',
        weight: '',
        smoker: false,
        languageCode: 'en',
      },
      addressList: [],
      identityList: [],
      emailList: [],
    },
  })
})

app.post('/ewl/bal/v1/promotion/all', (req, res) => {
  const accountNum = resolveAccountNum(req.body)

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
    promotionCapture?.eligiblePromotionList?.length > 0
      ? promotionCapture.eligiblePromotionList
      : normalizedFallbackEligiblePromotionList
  const entitledPromotionList =
    promotionCapture?.entitledPromotionList?.length > 0 ? promotionCapture.entitledPromotionList : []

  return res.status(200).json({
    errorCode: '',
    errorMsg: '',
    accountNum,
    eligiblePromotionList: trimPromotionList(eligiblePromotionList),
    entitledPromotionList: trimPromotionList(entitledPromotionList),
  })
})

app.post('/ewl/bal/v1/player/image', (req, res) => {
  const accountNum = resolveAccountNum(req.body)
  return res.status(200).json({
    errorCode: '',
    errorMsg: '',
    accountNum,
    image: mockProfile.image,
  })
})

app.post('/ewl/bal/v1/player/earn', (req, res) => {
  const accountNum = resolveAccountNum(req.body)
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

app.post('/ewl/bal/v1/prize/redeem', (req, res) => {
  return res.status(200).json({
    errorCode: prizeRedeemErrorCode,
    errorMsg: prizeRedeemErrorMsg,
    redeemPrize: prizeRedeemValue || generateToken('mock_redeem_prize'),
  })
})

app.post('/ewl/bal/v1/point/void', (req, res) => {
  return res.status(200).json({
    errorCode: pointVoidErrorCode,
    errorMsg: pointVoidErrorMsg,
    result: pointVoidResult,
  })
})

app.post('/ewl/bal/v1/redeemedpromotion/detail', (req, res) => {
  const accountNum = resolveAccountNum(req.body)
  const outcomeList = redeemedPromotionDetailIncludeDefaultRecord
    ? [buildMockRedeemedPromotionOutcome(req.body)]
    : []

  return res.status(200).json({
    errorCode: redeemedPromotionDetailErrorCode,
    errorMsg: redeemedPromotionDetailErrorMsg,
    accountNum,
    outcomeList,
  })
})

app.post('/ewl/bal/v1/playerpromotion/redeem', (req, res) => {
  const accountNum = resolveAccountNum(req.body)

  return res.status(200).json({
    errorCode: playerPromotionRedeemErrorCode,
    errorMsg: playerPromotionRedeemErrorMsg,
    accountNum,
    result: playerPromotionRedeemResult,
  })
})

app.post('/ewl/bal/v1/redeemedpromotion/void', (req, res) => {
  return res.status(200).json({
    errorCode: redeemedPromotionVoidErrorCode,
    errorMsg: redeemedPromotionVoidErrorMsg,
    result: redeemedPromotionVoidResult,
  })
})

app.use((req, res) => {
  res.status(404).json({
    error: 'NOT_MOCKED',
    message: `No mock configured for ${req.method} ${req.path}`,
  })
})

app.listen(port, host, () => {
  console.log(`Mock gateway listening on http://${host}:${port}`)
})

startLdapServer()
