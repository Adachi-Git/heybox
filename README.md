# heybox · 小黑盒每日签到（轻量 fork）

> fork 自 [yowiv08/heybox](https://github.com/yowiv08/heybox)。
> 本 fork 只保留「每日签到 + 分享任务」，去掉了领券、抽奖、抢券这类重操作，并补上 Cookie 提取和运行脚本，适合挂在服务器、NAS、Termux 或 DSH 自动化任务里无人值守。

## 这个 fork 改了什么

- 只执行签到和 task `1` / `19` / `31` / `33`（分享帖子、分享游戏详情、分享游戏评价、限时任务）
- **不执行** task `24`（游戏评价）——它会在你的账号留下公开评价
- 不做领券、抽奖、抢券；`heybox_claim.js` / `heybox_rush.js` / `heybox_roll.js` 虽然还在仓库里，但本 fork 不维护、不保证可用
- 签到状态回查最多 4 次、间隔 2 秒，避免服务端延迟被误判为失败
- 新增 `extract.js`、`run.sh`、`account.env.example`、`.gitignore`

## 目录

| 文件 | 作用 |
| --- | --- |
| `heybox_sign.js` | 签到 + 分享任务，主入口 |
| `extract.js` | 从抓包文本提取 Cookie，生成 `account.env` |
| `run.sh` | 读取 `account.env` 并运行签到 |
| `account.env.example` | 配置模板 |
| `src/` | 账号、签名、请求与任务实现 |
| `heybox_claim.js` 等 | 上游保留脚本，本 fork 不使用 |

## 快速开始

需要 Node.js 22 或以上。

```bash
npm install
```

### 1. 抓一次 Cookie

保持小黑盒已登录，用 Reqable 或 mitmproxy 抓包，进入 **我 → 我的任务 → 我的钱包 → 明细**，找到任意一个 `api.xiaoheihe.cn` 请求。

把**完整请求 URL** 和**请求头里的 Cookie** 两行写进 `raw.txt`：

```text
https://api.xiaoheihe.cn/task/list_v2/?heybox_id=...&imei=...&device_info=...
pkey=...;x_xhh_tokenid=...
```

然后解析：

```bash
node extract.js
```

会生成 `account.env`（权限 0600），包含 `pkey`、`x_xhh_tokenid`、`imei`、`device_info`、`os_version`、`dw`、`channel`。

### 2. 运行

```bash
./run.sh
```

成功时输出类似：

```text
签到: 已完成 (+60经验 +60H币 +1盒电)
分享任意帖子到社交平台: 已完成 (+30经验 +300H币 +1盒电)
当前总H币: 1720
```

## 配置字段

| 字段 | 来源 | 说明 |
| --- | --- | --- |
| `pkey` | 请求头 Cookie | 登录态，必需 |
| `x_xhh_tokenid` | 请求头 Cookie | 登录态，必需 |
| `imei` | URL 查询参数 | 设备标识，必需 |
| `device_info` | URL 查询参数 | 设备型号，必需 |
| `os_version` | URL 查询参数 | 系统版本，必需 |
| `dw` | URL 查询参数 | 屏幕宽度，必需 |
| `channel` | URL 查询参数 | 渠道，可选 |

也可以不用 `extract.js`，直接写环境变量：

```bash
export heybox_ck='pkey=xxx;x_xhh_tokenid=xxx;imei=xxx;device_info=xxx;os_version=16;dw=411;channel=heybox_xiaomi;'
node heybox_sign.js
```

多账号用换行或 `&` 分隔，每个账号带自己的设备字段。

## 定时运行

cron：

```cron
0 9 * * * cd /path/to/heybox && ./run.sh >> sign.log 2>&1
```

DSH 自动化任务里则直接执行 `cd /path/to/heybox && ./run.sh`，把关键行汇报出来即可。

签到时间建议固定在早上，避免刚过零点接口状态还没刷新。

## 输出与退出码

- 退出码 `0`：签到已完成（含「今日已签到」）
- 退出码 `1`：签到失败、登录态失效或请求异常，最后几行会写明原因
- 接口异常时会打印完整响应 body，不截断、不脱敏，注意日志里可能含账号信息

## 安全与风险

- `account.env` 里的 `pkey` 等价于你的账号登录态，泄露即可被登录。文件已是 0600，`.gitignore` 也排除了它，**不要提交、不要发给别人**。
- 签名依赖第三方服务 `hkey.qcciii.com`，会收到 `imei`、`heybox_id`、`os_version`，不含 Cookie。可在环境变量 `heybox_hkey_api` 里换成自己的实现。
- 这是非官方接口，平台可能随时调整签名或风控。账号有被限流、禁言甚至封禁的可能，请自行权衡，不要用主号高频运行。
- 本 fork 只做签到和模拟分享，不发布公开内容；但模拟分享仍属于自动化行为。

## 与上游差异

| 项目 | 上游 | 本 fork |
| --- | --- | --- |
| 每日签到 | ✅ | ✅ |
| 分享任务 | ✅ | ✅ |
| 游戏评价（公开） | ✅ | ❌ |
| 领券 / 抽奖 / 抢券 | ✅ | ❌ 不维护 |
| Cookie 提取 | 手动 | `extract.js` |
| 一键运行 | ❌ | `run.sh` |

## 致谢

接口与签名来自 [yowiv08/heybox](https://github.com/yowiv08/heybox)，其上游为 [WenfuRainbow/heybox](https://github.com/WenfuRainbow/heybox)。保留原 MIT 许可证。

## License

MIT
