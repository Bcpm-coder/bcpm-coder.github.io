---
id: sovd-websocket-https
title: "方案一：WebSocket＋HTTPS"
excerpt: "使用 WSS 长连接承载车云双向诊断消息，并通过认证、心跳、退避重连和任务恢复保障连接可靠性。"
date: "2026-07-27"
category: "学习"
tags: ["SOVD", "WebSocket", "HTTPS", "T-Box", "车云连接"]
---

## 方案：WebSocket＋HTTPS

### 方案说明

- T-Box主动建立WSS长连接，云端和T-Box通过同一连接双向发送消息。
- 云端请求封装成WebSocket消息
- T-Box解析任务，将返回结果封装成WebSocket消息返回云


```mermaid
sequenceDiagram
    participant C as 云端连接管理服务
    participant T as 车端 T-Box

    Note over C,T: 一、建立车云安全连接

    T->>C: TLS 1.3握手（提交设备证书）
    T->>C: 建立WSS连接（vehicleId、Token、能力信息）
    C->>C: 校验证书、车辆身份、Token和访问权限

    alt 认证失败
        C-->>T: 关闭连接并返回认证失败原因
    else 认证成功
        C->>C: 创建sessionId并绑定车辆与WebSocket连接
        C-->>T: 返回连接成功消息（sessionId、心跳周期）
    end
```

```mermaid
sequenceDiagram
    participant C as 云端连接管理服务
    participant T as 车端 T-Box

    Note over C,T: 二、连接保持与状态维护

    loop 连接有效期间
        C->>T: WebSocket Ping
        T-->>C: WebSocket Pong
        T->>C: 上报业务心跳（sessionId、车辆状态）
        C->>C: 更新车辆在线状态和最后心跳
    end

    Note over C,T: 三、连接中断检测

    C-xT: 4G/5G网络中断或WebSocket连接异常
    C->>C: 连续多个心跳周期未收到响应，标记为心跳超时
    C->>C: 暂停旧连接，将未发送任务保存在云端任务队列
```

```mermaid
sequenceDiagram
    participant C as 云端连接管理服务
    participant T as 车端 T-Box

    Note over C,T: 四、T-Box退避重连

    T->>T: 等待5秒后尝试重连
    T-xC: 第一次重连失败
    T->>T: 按10秒、30秒上限继续退避
    T->>C: TLS 1.3重新握手成功
    T->>C: 建立新WSS连接并提交恢复信息

    C->>C: 重新校验车辆身份和证书、关闭旧连接
    C->>C: 绑定到新连接、核对云车任务状态
    C-->>T: 返回新sessionId和任务恢复指令

    Note over C,T: 五、连接与任务状态恢复

    alt 存在已完成但未上传的结果
        T->>C: 通过HTTPS补传完整结果
        C-->>T: 返回结果保存成功
        T-->>C: WebSocket通知任务完成
        C->>C: 更新任务状态
    else 存在正在执行的任务
        T-->>C: WebSocket上报当前任务状态
        C->>C: 恢复任务进度跟踪
    else 存在未确认的待执行任务
        C->>C: 重新校验任务有效期和权限
        C->>T: WebSocket重新发送未确认任务
        T->>T: 根据taskId进行幂等检查
        T-->>C: 返回任务确认或已有任务状态
    else 控制任务状态不明确
        C->>T: WebSocket查询原任务执行状态
        T-->>C: 返回未执行/执行中/已完成
        C->>C: 标记为待确认，不自动重复执行
    end

    C->>C: 将车辆状态更新为已恢复连接
```

### 优点

- WebSocket原生双向通信，云端实时下发诊断、控制任务
- 任务、确认、进度和小型结果可以通过同一连接传输
- 不需要单独部署MQTT Broker

### 缺点

- 无MQTT原生的QoS、持久会话和离线消息能力
- 消息确认、重试、超时、幂等和任务补偿需要应用层自行实现
- 车辆数量增加后需要建设WebSocket连接集群、会话路由和负载均衡
- 服务节点故障后，车辆需要重新连接并恢复会话
