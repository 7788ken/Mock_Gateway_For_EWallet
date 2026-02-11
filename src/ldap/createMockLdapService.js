const ldap = require('ldapjs')

function createMockLdapService({ ldapConfig }) {
  const {
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
  } = ldapConfig

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
      `cn=${username},${ldapAllowAnyUserOu},${ldapBaseDn}`
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

    const dn = `${item?.dn || `cn=${username},${ldapAllowAnyUserOu},${ldapBaseDn}`}`.trim()
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

  let ldapServer = null

  function start() {
    if (!ldapEnabled) {
      return null
    }

    if (ldapServer) {
      return ldapServer
    }

    ldapServer = ldap.createServer()
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

  function getHealthInfo() {
    return {
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
    }
  }

  return {
    start,
    getHealthInfo,
  }
}

module.exports = { createMockLdapService }
