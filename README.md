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

## 本地启动

```bash
cd Mock_Gateway
npm install
cp .env.example .env
npm run start
```

默认监听：`http://127.0.0.1:19090`

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
```
