# Mock Gateway

本目录是独立的本地开发 Mock 网关仓库，用于模拟 eWallet 依赖的外部接口，避免在主业务仓库中引入临时绕过逻辑。

## 目标

- 本地联调时模拟外部依赖接口（如 EDIP token、Bally validate）。
- 不影响主仓库 `Backend` / `Frontend` 的分支与自动部署。
- 通过环境变量切换是否启用 mock。

## 约定

- 这是一个独立 Git 仓库。
- 默认仅用于本地开发和联调。
- 后续建议仅在本目录下维护 mock 逻辑与示例数据。

