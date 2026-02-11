# Mock Gateway

本项目是 **独立 Git 仓库** 的本地 Mock 网关，用于模拟 eWallet 后端依赖的 Bally/EDIP 接口，避免在 `Backend` 主代码中持续保留绕过逻辑。

## 已内置的 Mock 接口

- `POST /edip/v1/token/get`
- `POST /edip/v1/token/refresh`
- `POST /ewl/bal/v1/cardpin/validate`
- `POST /ewl/bal/v1/promotion/all`
- `POST /ewl/mkt-rm/v1/team/hierarchy`
- `POST /ewl/bal/v1/prize/redeem`
- `POST /ewl/bal/v1/point/void`
- `POST /ewl/bal/v1/redeemedpromotion/detail`
- `POST /ewl/bal/v1/playerpromotion/redeem`
- `POST /ewl/bal/v1/redeemedpromotion/void`
- `POST /ewl/edip/v1/member/profile`
- `POST /ewl/bal/v1/player/image`
- `POST /ewl/bal/v1/player/earn`
- `POST /api/v1/prize-redemptions/sync`
- `GET /healthz`

## 已内置的 LDAP Mock（新增）

- 协议：LDAPv3
- 默认监听：`ldap://0.0.0.0:1389`
- 支持能力：`Simple Bind` + `Search`

固定行为（与对接约定一致）：

1. manager bind DN：`cn=s-cicd-app,OU=ServiceAccount,dc=macausjm-glp,dc=com`
2. 用户搜索：base `dc=macausjm-glp,dc=com` + filter `(sAMAccountName={username})`
3. 组搜索：base `OU=SecurityGroups,OU=GLPUsers,dc=macausjm-glp,dc=com` + filter `(member={userDn})`
4. 用户条目属性：`sAMAccountName` / `cn` / `mail` / `memberOf`
5. 组条目属性：`cn` / `member`

并且支持用户 DN + 密码直接 bind 成功（基于内置默认用户或 `MOCK_LDAP_USERS_JSON` 配置用户）。

另外默认开启“任意用户名/密码放行”联调模式（`MOCK_LDAP_ALLOW_ANY_USER_MODE=true`）：

- 前端输入任意账号密码都可通过后端 LDAP 认证
- `(sAMAccountName={username})` 会按 `{username}` 动态返回用户条目
- `(member={userDn})` 会返回组条目（默认 `SG-APP-EWALLET-SUPER-ADMIN`）

## 本地启动

```bash
cd Mock_Gateway
npm install
cp .env.example .env
npm run start
```

开发联调建议使用自动重启模式（监听 `src/` 与 `.env` 变更）：

```bash
npm run dev
```

默认监听：`http://127.0.0.1:19090`

LDAP 默认监听：`ldap://0.0.0.0:1389`

## 与 Backend 集成

在 Backend 启动环境中设置：

```bash
MOCK_GATEWAY_BASE_URL=http://127.0.0.1:19090
BALLY_BASE_URL=${MOCK_GATEWAY_BASE_URL}
EDIP_BASE_URL=${MOCK_GATEWAY_BASE_URL}
BALLY_REDEEM_BASE_URL=${MOCK_GATEWAY_BASE_URL}
BALLY_PROMOTION_BASE_URL=${MOCK_GATEWAY_BASE_URL}

# 建议关闭旧的本地 member 直返 mock，改走网关
BALLY_MEMBER_QUERY_LOCAL_MOCK_ENABLED=false
```

## 快速验证

```bash
curl -s http://127.0.0.1:19090/healthz

curl -s -X POST http://127.0.0.1:19090/edip/v1/token/get \
  -H 'Content-Type: application/json' \
  -d '{"schema":{},"data":{"account":"a","password":"b","key":"k","secret":"s"}}'

curl -s -X POST http://127.0.0.1:19090/ewl/bal/v1/cardpin/validate \
  -H 'Content-Type: application/json' \
  -d '{"schema":{},"data":{"accountNum":"810006843","pin":"1234"}}'

curl -s -X POST http://127.0.0.1:19090/ewl/bal/v1/promotion/all \
  -H 'Content-Type: application/json' \
  -d '{"schema":{},"data":{"accountNum":"800048718"}}'

curl -s -X POST http://127.0.0.1:19090/ewl/mkt-rm/v1/team/hierarchy \
  -H 'Content-Type: application/json' \
  -d '{"schema":{"terminalCode":"MOCK-PC"},"data":{"userName":"mock.user","staffId":"M000001"}}'

curl -s -X POST http://127.0.0.1:19090/ewl/bal/v1/prize/redeem \
  -H 'Content-Type: application/json' \
  -d '{"schema":{},"data":{"accountNum":"800048718","prizeCode":"MOCK"}}'

curl -s -X POST http://127.0.0.1:19090/api/v1/prize-redemptions/sync \
  -H 'Content-Type: application/json' \
  -d '{"schema":{},"data":{"correlationId":"mock-correlation-id"}}'

curl -s -X POST http://127.0.0.1:19090/ewl/bal/v1/point/void \
  -H 'Content-Type: application/json' \
  -d '{"schema":{},"data":{"transId":"mock-redeem-id"}}'

curl -s -X POST http://127.0.0.1:19090/ewl/bal/v1/redeemedpromotion/detail \
  -H 'Content-Type: application/json' \
  -d '{"schema":{},"data":{"accountNum":"800048718"}}'

curl -s -X POST http://127.0.0.1:19090/ewl/bal/v1/playerpromotion/redeem \
  -H 'Content-Type: application/json' \
  -d '{"schema":{},"data":{"accountNum":"800048718","promotionId":100002}}'

curl -s -X POST http://127.0.0.1:19090/ewl/bal/v1/redeemedpromotion/void \
  -H 'Content-Type: application/json' \
  -d '{"schema":{},"data":{"redeemedId":900001}}'

# LDAP manager bind（默认 manager 密码可留空，便于 Backend 只改 LDAP_URL）
ldapsearch -x -H ldap://127.0.0.1:1389 \
  -D "cn=s-cicd-app,OU=ServiceAccount,dc=macausjm-glp,dc=com" \
  -w "any-password" \
  -b "dc=macausjm-glp,dc=com" \
  "(sAMAccountName=mock.user)" sAMAccountName cn mail memberOf

# LDAP user bind（DN + 密码）
ldapsearch -x -H ldap://127.0.0.1:1389 \
  -D "cn=mock.user,OU=GLPUsers,dc=macausjm-glp,dc=com" \
  -w "mock-user-password" \
  -b "OU=SecurityGroups,OU=GLPUsers,dc=macausjm-glp,dc=com" \
  "(member=cn=mock.user,OU=GLPUsers,dc=macausjm-glp,dc=com)" cn member

# 建议把默认组名设置成 Backend 角色表已有 code（如 `SG-APP-EWALLET-SUPER-ADMIN`），更容易看到非空 permissions
```

## 页面数据模板（JSON）

- `fixtures/token.get.json`：`/edip/v1/token/get` 成功响应模板
- `fixtures/member.profile.json`：`/ewl/edip/v1/member/profile` 成功响应模板
- `fixtures/promotions.capture.800048718.json`：`/ewl/bal/v1/promotion/all` 抓包模板

说明：

- 以上模板用于维护响应“静态骨架”
- 动态字段仍由网关运行时覆盖（如 `accessToken`、`refreshToken`、`accountNum`、`playerId`、以及 LDAP 用户相关字段）

## 代码结构（已拆分）

- `src/server.js`：仅保留启动、路由装配、404 与 LDAP 启动
- `src/ldap/createMockLdapService.js`：LDAP 相关逻辑独立维护
- `src/context/createMockContext.js`：共享配置、fixture 加载、通用工具函数
- `src/routes/**`：每个接口路径一个独立文件（便于新增与变更）

## 常用环境变量

- `MOCK_PROMOTION_CAPTURE_FILE`：promotion 抓包文件路径（默认读取仓库内 `./fixtures/promotions.capture.800048718.json`）
- `MOCK_PROMOTION_MAX_ITEMS`：promotion 返回上限（eligible/entitled 各自限制，默认 `30`）
- `MOCK_TOKEN_GET_FIXTURE_FILE`：`/edip/v1/token/get` JSON 模板文件路径（默认 `./fixtures/token.get.json`）
- `MOCK_MEMBER_PROFILE_FIXTURE_FILE`：`/ewl/edip/v1/member/profile` JSON 模板文件路径（默认 `./fixtures/member.profile.json`）
- `MOCK_TEAM_HIERARCHY_STATUS`：`team/hierarchy` 的 `status`（默认 `true`）
- `MOCK_TEAM_HIERARCHY_ERROR_CODE` / `MOCK_TEAM_HIERARCHY_MESSAGE`：`team/hierarchy` 错误模拟
- `MOCK_TEAM_HIERARCHY_ROLE` / `MOCK_TEAM_HIERARCHY_DEPARTMENT` / `MOCK_TEAM_HIERARCHY_TAGS`：`team/hierarchy` 返回字段
- `MOCK_PRIZE_REDEEM_ERROR_CODE` / `MOCK_PRIZE_REDEEM_ERROR_MSG` / `MOCK_PRIZE_REDEEM_VALUE`：`prize/redeem` 返回控制（`MOCK_PRIZE_REDEEM_VALUE` 留空时自动生成交易号）
- `MOCK_POINT_VOID_ERROR_CODE` / `MOCK_POINT_VOID_ERROR_MSG` / `MOCK_POINT_VOID_RESULT`：`point/void` 返回控制
- `MOCK_REDEEMED_PROMOTION_DETAIL_ERROR_CODE` / `MOCK_REDEEMED_PROMOTION_DETAIL_ERROR_MSG`：`redeemedpromotion/detail` 返回控制
- `MOCK_REDEEMED_PROMOTION_DETAIL_INCLUDE_DEFAULT_RECORD`：是否返回默认一条 `outcomeList`（默认 `true`）
- `MOCK_REDEEMED_PROMOTION_DETAIL_VOIDED`：默认记录是否标记已作废（默认 `false`）
- `MOCK_PLAYERPROMOTION_REDEEM_ERROR_CODE` / `MOCK_PLAYERPROMOTION_REDEEM_ERROR_MSG` / `MOCK_PLAYERPROMOTION_REDEEM_RESULT`：`playerpromotion/redeem` 返回控制
- `MOCK_REDEEMEDPROMOTION_VOID_ERROR_CODE` / `MOCK_REDEEMEDPROMOTION_VOID_ERROR_MSG` / `MOCK_REDEEMEDPROMOTION_VOID_RESULT`：`redeemedpromotion/void` 返回控制
- `MOCK_PRIZE_REDEMPTIONS_SYNC_SUCCESS` / `MOCK_PRIZE_REDEMPTIONS_SYNC_MESSAGE`：`/api/v1/prize-redemptions/sync` 返回控制
- `MOCK_LDAP_ENABLED`：是否启用 LDAP mock（默认 `true`）
- `MOCK_LDAP_HOST`：LDAP 监听地址（默认 `0.0.0.0`）
- `MOCK_LDAP_PORT`：LDAP 监听端口（默认 `1389`）
- `MOCK_LDAP_BASE_DN`：LDAP 基础 DN（默认 `dc=macausjm-glp,dc=com`）
- `MOCK_LDAP_MANAGER_DN`：manager bind DN（默认 `cn=s-cicd-app,OU=ServiceAccount,dc=macausjm-glp,dc=com`）
- `MOCK_LDAP_GROUP_BASE_DN`：组搜索 base（默认 `OU=SecurityGroups,OU=GLPUsers,dc=macausjm-glp,dc=com`）
- `MOCK_LDAP_ALLOW_ANY_USER_MODE`：任意用户名/密码放行模式（默认 `true`）
- `MOCK_LDAP_ALLOW_ANY_USER_OU`：动态用户 DN 的 OU 段（默认 `OU=GLPUsers`）
- `MOCK_LDAP_ALLOW_ANY_USER_GROUP_CN`：动态用户默认组名（默认 `SG-APP-EWALLET-SUPER-ADMIN`）
- `MOCK_LDAP_ALLOW_ANY_USER_MAIL_DOMAIN`：动态用户邮箱域名（默认 `macausjm-glp.com`）
- `MOCK_LDAP_MANAGER_PASSWORD`：manager bind 密码；留空时允许任意密码（便于仅改 `LDAP_URL` 联调）
- `MOCK_LDAP_DEFAULT_USER_*`：默认单用户 mock 配置
- `MOCK_LDAP_USERS_JSON`：JSON 数组，多用户覆盖配置
