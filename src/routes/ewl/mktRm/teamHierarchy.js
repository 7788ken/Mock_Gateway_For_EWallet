function registerTeamHierarchyRoute({ app, context }) {
  app.post('/ewl/mkt-rm/v1/team/hierarchy', (req, res) => {
    const requestedUserName = `${req.body?.data?.userName || 'mock.user'}`.trim() || 'mock.user'
    const requestedStaffId = `${req.body?.data?.staffId || 'M000001'}`.trim() || 'M000001'
    const resolvedTags = context.teamHierarchyTags.length > 0 ? context.teamHierarchyTags : ['MOCK']
    const teamMember = {
      name: requestedUserName,
      userName: requestedUserName,
      mail: `${requestedUserName}@macausjm-glp.com`,
      description: 'Mock team member',
      staffId: requestedStaffId,
      teamRole: context.teamHierarchyRole,
      tags: resolvedTags,
    }
    const supportTeam = {
      teamName: 'Mock Support Team',
      description: 'Mock support team',
      department: context.teamHierarchyDepartment,
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
      status: context.teamHierarchyStatus,
      errorCode: context.teamHierarchyErrorCode,
      message: context.teamHierarchyMessage,
      data: {
        userName: requestedUserName,
        staffId: requestedStaffId,
        name: requestedUserName,
        mail: `${requestedUserName}@macausjm-glp.com`,
        teamRole: context.teamHierarchyRole,
        tags: resolvedTags,
        teams: [
          {
            teamName: 'Mock Team',
            description: 'Mock team hierarchy',
            department: context.teamHierarchyDepartment,
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
}

module.exports = registerTeamHierarchyRoute
