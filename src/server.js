require('dotenv').config()

const express = require('express')

const { createMockContext } = require('./context/createMockContext')
const { createMockLdapService } = require('./ldap/createMockLdapService')
const { registerRoutes } = require('./routes/registerRoutes')

const app = express()
app.use(express.json({ limit: '2mb' }))

const context = createMockContext()
const ldapService = createMockLdapService({ ldapConfig: context.ldap })

registerRoutes({ app, context, ldapService })

app.use((req, res) => {
  res.status(404).json({
    error: 'NOT_MOCKED',
    message: `No mock configured for ${req.method} ${req.path}`,
  })
})

app.listen(context.port, context.host, () => {
  console.log(`Mock gateway listening on http://${context.host}:${context.port}`)
})

ldapService.start()
