function registerHealthzRoute({ app, ldapService }) {
  app.get('/healthz', (req, res) => {
    res.json({
      status: 'ok',
      service: 'ewallet-mock-gateway',
      now: new Date().toISOString(),
      ldap: ldapService.getHealthInfo(),
    })
  })
}

module.exports = registerHealthzRoute
