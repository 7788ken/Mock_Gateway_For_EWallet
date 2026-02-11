# Mock Gateway

本项目是 **独立 Git 仓库** 的本地 Mock 网关，用于模拟 eWallet 后端依赖的 Bally/EDIP 接口，避免在 `Backend` 主代码中持续保留绕过逻辑。

## 已内置的 Mock 接口

- `POST /edip/v1/token/get`
- `POST /edip/v1/token/refresh`
- `POST /ewl/bal/v1/cardpin/validate`
- `POST /ewl/edip/v1/member/profile`
- `POST /ewl/bal/v1/player/image`
- `POST /ewl/bal/v1/player/earn`
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

## LDAP 相关环境变量

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
