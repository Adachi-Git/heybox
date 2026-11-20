// 从抓包文本里提取账号配置，生成 account.env
// 用法：把请求的完整 URL 和 Cookie 两行粘进 raw.txt，然后 node extract.js
const fs = require("fs");
const path = require("path");

const rawPath = process.argv[2] || path.join(__dirname, "raw.txt");
let raw;
try {
  raw = fs.readFileSync(rawPath, "utf8");
} catch {
  console.error("读不到 raw.txt。先把请求 URL 和 Cookie 两行粘进 raw.txt。");
  process.exit(1);
}

const urlMatch = raw.match(/https?:\/\/[^\s"'<>]+/);
if (!urlMatch) {
  console.error("raw.txt 里没找到请求 URL。");
  process.exit(1);
}
let url;
try {
  url = new URL(urlMatch[0]);
} catch {
  console.error("URL 解析失败，请贴完整的请求地址。");
  process.exit(1);
}

// Cookie：优先找 "Cookie:" 行；否则找含 pkey= 的片段
let cookie = "";
const cookieLine = raw.match(/cookie\s*[:：]\s*(.+)/i);
if (cookieLine) {
  cookie = cookieLine[1].trim();
} else {
  const idx = raw.indexOf("pkey=");
  if (idx >= 0) cookie = raw.slice(idx).split(/\r?\n/)[0].trim();
}

function pickCookie(name) {
  const m = cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return m ? m[1].trim() : "";
}

const q = url.searchParams;
const pkey = pickCookie("pkey");
const tokenid = pickCookie("x_xhh_tokenid");
const imei = q.get("imei") || "";
const channel = q.get("channel") || "";
const deviceInfo = q.get("device_info") || "";
const osVersion = q.get("os_version") || "";
const dw = q.get("dw") || "";

const missing = [];
if (!pkey) missing.push("pkey（Cookie 里）");
if (!tokenid) missing.push("x_xhh_tokenid（Cookie 里）");
if (!imei) missing.push("imei（URL 查询参数里）");
if (!deviceInfo) missing.push("device_info（URL 查询参数里）");
if (!osVersion) missing.push("os_version（URL 查询参数里）");
if (!dw) missing.push("dw（URL 查询参数里）");

if (missing.length) {
  console.error("缺少字段：" + missing.join("、"));
  console.error("请确认贴的是 api.xiaoheihe.cn 的请求 URL 和同一个请求的 Cookie。");
  process.exit(1);
}

const ck = [
  `pkey=${pkey}`,
  `x_xhh_tokenid=${tokenid}`,
  `imei=${imei}`,
  deviceInfo ? `device_info=${deviceInfo}` : "",
  `os_version=${osVersion}`,
  `dw=${dw}`,
  channel ? `channel=${channel}` : "",
].filter(Boolean).join(";") + ";";

const out = path.join(__dirname, "account.env");
fs.writeFileSync(out, `heybox_ck='${ck.replace(/'/g, "'\\''")}'\n`, { mode: 0o600 });
console.log(`已写入 ${out}`);
console.log(`账号字段：pkey=${pkey.slice(0, 4)}… token=${tokenid.slice(0, 4)}… imei=${imei.slice(0, 4)}…`);
console.log("下一步：node check_cookie.js 或 ./run.sh 测试签到。");
