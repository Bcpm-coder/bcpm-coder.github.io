---
id: sovd-mqtt-https
title: "方案三：MQTT＋HTTPS"
excerpt: "使用 MQTT 承载车辆连接、任务通知与进度消息，使用 HTTPS 获取任务详情并上传完整诊断结果。"
date: "2026-07-27"
category: "学习"
tags: ["SOVD", "MQTT", "HTTPS", "弱网", "车云连接"]
---

## 方案：MQTT＋HTTPS

### 方案说明

- T-Box主动与云MQTT Broker建立长连接。
- MQTT负责车辆上线、连接保持、诊断任务通知、业务确认、执行进度和完成通知。
- HTTPS负责获取完整任务计划，以及上传完整诊断结果、日志和大型文件。
- MQTT Broker部署在云端，负责车辆连接、Topic路由、QoS投递和会话管理。
- T-Box中设置SOVD Gateway模块，负责MQTT连接、任务解析、SOVD请求转换、结果上传和断线恢复。



```mermaid
sequenceDiagram
    participant C as 云端连接管理服务（含MQTT Broker）
    participant T as 车端 T-Box

    Note over C,T: 一、建立车云安全连接

    T->>C: MQTT/TLS连接（设备证书、vehicleId、Token）
    C->>C: 校验车辆身份、证书和Topic权限

    alt 认证失败
        C-->>T: 拒绝连接并返回失败原因
    else 认证成功
        C-->>T: 返回连接成功
        T->>C: 订阅车辆任务Topic
        C->>C: 创建sessionId并标记车辆在线
    end

    Note over C,T: 二、连接保持

    loop 连接有效期间
        T->>C: MQTT Keep Alive及车辆状态
        C->>C: 更新最后心跳和在线状态
    end
```

```mermaid
sequenceDiagram
    participant C as 云端连接管理服务（含MQTT Broker）
    participant T as 车端 T-Box

    Note over C,T: 三、连接中断

    C-xT: 4G/5G网络中断或连接异常
    C->>C: Keep Alive超时
    C->>C: 将车辆标记为离线
    C->>C: 保存未发送的诊断任务

    Note over C,T: 四、退避重连

    T->>T: 按5秒、10秒、30秒间隔重试
    T->>C: 重新建立MQTT/TLS连接
    C->>C: 重新校验车辆身份并恢复会话
    C-->>T: 返回连接恢复成功

    T->>C: 上报当前taskId和任务状态
    C->>C: 核对未完成任务和待上传结果
    C-->>T: 返回继续执行、补传结果或取消任务
    C->>C: 将车辆状态更新为已连接
```

```mermaid
sequenceDiagram
    participant C as 云端连接管理服务（含MQTT Broker）
    participant T as 车端 T-Box

    C->>C: 创建诊断任务并生成taskId
    C->>T: MQTT QoS 1下发任务通知（taskId、taskUrl、expiresAt）
    T->>T: 校验taskId和任务有效期
    T-->>C: MQTT返回任务通知已收到

    T->>C: HTTPS获取完整任务计划（taskUrl）
    C-->>T: 返回SOVD请求方法、URL和参数
    T->>T: 校验执行权限和任务内容
    T-->>C: MQTT返回任务已接受

    T->>T: 调用车内SOVD Server执行诊断
    T-->>C: MQTT上报执行进度

    T->>C: HTTPS上传完整诊断结果
    C->>C: 保存结果并将任务标记为完成
    C-->>T: 返回结果保存成功
```

#### 优点

- 保留MQTT在弱网、心跳和长连接方面的优势。
- **大规模和弱网能力最好**
- HTTPS上传成功后直接完成任务，减少重复完成通知。
- 后续仍可扩展为更完整的Topic和任务恢复机制。
- **强调弱网、离线消息和规模扩展**

#### 不足

- **需在云端部署MQTT Broker。**
- **需要同时开发MQTT任务消息和HTTPS结果接口。**
- SOVD请求需要封装成MQTT任务。
- 诊断任务参数过大时，仍需改为通过HTTPS获取。
