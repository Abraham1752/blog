---
title: mitmproxy 实测：中间人代理、WebSocket 抓包与插件扩展，值得日常工具链收藏
pubDate: 2026-08-10
description: 基于抓包开发实战的 mitmproxy 测评：WebSocket 钩子、addon 插件体系、Windows 证书坑，以及与 Fiddler/Wireshark 的定位差异。
category: 测评
tags: [mitmproxy, 抓包, 工具, 测评]
excerptEn: "A hands-on review of mitmproxy from a real traffic-capture project: WebSocket hooks, the addon system, Windows certificate pitfalls, and how it differs from Fiddler and Wireshark."
---

> 一句话结论：如果你要抓的流量是 **HTTPS 里的 WebSocket**，mitmproxy 是当前最优解——它的插件体系把"抓包"从"事后分析"变成了"实时消费"，值得进日常工具链；但如果只是偶尔看一眼 HTTP 请求，它对你来说可能过重了。

## 为什么需要它

我上一个项目（协议逆向学习）要处理的是网页游戏里的 WebSocket 流量：浏览器 → 服务器是 TLS 加密的 WebSocket，我需要拿到明文消息流，实时解析，再喂给下游状态机。

传统抓包工具在这个场景有三个问题：Wireshark 解不了 TLS（得先导出密钥）；Fiddler 的 WebSocket 面板只能看不能编程处理；charles 闭源且贵。mitmproxy 把三件事都解决了：中间人解密、WebSocket 解帧、Python 插件实时处理。

## 上手体验

安装是 `pip install mitmproxy`，然后：

```bash
mitmdump -s proxy/capture.py --listen-port 8080
```

系统代理指向 127.0.0.1:8080，访问 mitm.it 装证书，游戏流量就全部透明了。我的 addon 只实现了三个钩子就完成了核心功能：

```python
class MajsoulCapture:
    def websocket_start(self, flow): ...      # 识别目标域名，开日志
    def websocket_message(self, flow): ...    # 解析帧，输出 JSONL
addons = [MajsoulCapture()]
```

全程大约半小时从零跑到第一条可解析的帧。之后所有的迭代（帧格式调整、状态机接入）都在消费这份 JSONL 输出，抓包环节再没动过。

## 亮点

1. **WebSocket 一等公民**：`websocket_start / websocket_message / websocket_end` 三个钩子覆盖了完整生命周期，`msg.from_client` 直接区分方向。同类工具要么不支持、要么只能看不能处理。
2. **插件体系是灵魂**：addon 是普通 Python 类，挂上钩子方法即注册。抓包 → 解析 → 落盘 → 报警，全在一条管道里完成，不需要"导出 → 再处理"。
3. **命令行工具链友好**：mitmdump 无头运行，stdout 可以直接管道给下游程序（我的用法：`mitmdump ... | python app.py`），非常适合构建自动化管线。
4. **协议解析的通用解码器思路**：它自带一套 protobuf 解码能力，配合 schema 可以解码任意 protobuf 流量——我项目里 210KB 的协议 schema 就是搭配它验证的。

## 坑

1. **Windows 证书安装有仪式感**：必须走 mitm.it 下载证书装进"受信任的根证书颁发机构"，且安装后要重启浏览器进程，否则不生效。另外**不要**勾选"始终信任"以外的选项，否则部分应用会直接拒连。
2. **TLS 指纹可能暴露代理**：部分客户端有证书 pinning 或 TLS 指纹校验，被抓流量会用无头客户端（requests 等）做额外指纹检测的站点，mitmproxy 默认会被发现。应对方案是修改 `tls_client` 参数，但这是猫鼠游戏，学习项目慎入深水区。
3. **性能不是它的强项**：大流量下载场景下 mitmproxy 的内存占用和处理延迟明显高于纯转发的代理。抓下载类流量用透明代理模式或者干脆用 Wireshark。
4. **addon 调试要靠日志**：插件里没有断点调试体验，异常默认只打一行。开发期我吃了不少亏，建议一上来就配好 loguru 或 structlog。

## 同类对比

| | mitmproxy | Fiddler | Wireshark |
| --- | --- | --- | --- |
| HTTPS 解密 | 内置 | 内置 | 需导出密钥 |
| WebSocket 编程处理 | 钩子原生 | 面板只读 | Lua 脚本，门槛高 |
| 自动化管线 | 命令行管道 | 差 | 中等 |
| GUI 体验 | 弱（web 界面） | 强 | 强 |
| 定位 | 开发工具链 | 调试器 | 网络分析 |

## 适用人群

- 做协议逆向、SDK 对接、WebSocket 联调的后端/爬虫开发者——**强烈推荐**
- 偶尔看一眼 HTTP 请求的普通开发者——Fiddler/浏览器 DevTools 更轻
- 网络层问题排查——Wireshark

## 评分

| 维度 | 评分 |
| --- | --- |
| 抓包能力 | 9/10 |
| 插件扩展 | 9/10 |
| 上手门槛 | 6/10 |
| 稳定性 | 8/10 |
| 文档质量 | 8/10 |

综合：**8.5/10**。缺点集中在学习曲线和边缘场景，核心场景（HTTPS + WebSocket + 自动化）无可替代。
