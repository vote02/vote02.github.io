# Pi Network 区块链积分投票应用

## 项目简介

这是一个运行在 Pi Network 区块链生态的轻量级积分投票应用，专为 Pi 浏览器环境设计。用户可以创建投票项目、参与投票并获得积分奖励。

## 功能特性

### 🔐 用户认证
- 集成 Pi Network SDK 登录系统
- 安全的用户身份验证
- 登录状态持久化

### 💰 积分系统
- 参与投票：+10积分/次
- 创建有效项目：+50积分
- 充值/提现功能（模拟）
- 提现手续费：10%

### 🗳️ 投票功能
- 创建投票项目（是/否选项）
- 实时投票统计
- 每个地址限投1次
- 项目截止时间管理

### 📊 项目管理
- 查看所有进行中的项目
- 我创建的项目列表
- 我参与的投票记录
- 项目状态跟踪

## 技术架构

### 前端技术栈
- **HTML5**: 语义化结构
- **CSS3**: 响应式设计，渐变背景
- **JavaScript ES6+**: 模块化开发
- **LocalStorage**: 本地数据持久化

### Pi Network 集成
- **Pi Browser SDK**: 用户认证
- **地址验证**: Pi Network 地址格式校验
- **浏览器适配**: 专为 Pi 浏览器优化

## 项目结构

```
toupiao/
├── index.html          # 主页面
├── styles.css          # 样式文件
├── app.js             # 应用逻辑
├── README.md          # 项目文档
└── package.json       # 项目配置
```

## 数据结构

### 项目数据 (localStorage: 'voting_projects')
```javascript
{
  id: string,              // 项目唯一ID
  title: string,           // 项目标题 (≤12字符)
  description: string,     // 项目描述 (≤100字符)
  endTime: string,         // 截止时间 (ISO格式)
  maxPoints: number,       // 最高投票积分
  creatorId: string,       // 创建者ID
  creatorName: string,     // 创建者名称
  createdAt: string,       // 创建时间
  votes: {
    yes: number,           // "是"票数
    no: number             // "否"票数
  },
  voters: string[],        // 投票者ID列表
  status: string           // 项目状态
}
```

### 投票记录 (localStorage: 'user_votes')
```javascript
{
  projectId: string,       // 项目ID
  userId: string,          // 用户ID
  option: 'yes'|'no',     // 投票选项
  timestamp: string        // 投票时间
}
```

### 用户数据 (localStorage: 'current_user')
```javascript
{
  uid: string,             // 用户唯一ID
  username: string         // 用户名
}
```

## 安装部署

### 本地开发

1. **克隆项目**
```bash
git clone <repository-url>
cd toupiao
```

2. **启动本地服务器**
```bash
# 使用 Python
python -m http.server 8000

# 或使用 Node.js
npx serve .

# 或使用 Live Server (VS Code 扩展)
```

3. **访问应用**
```
http://localhost:8000
```

### GitHub Pages 部署

1. **推送到 GitHub**
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

2. **启用 GitHub Pages**
- 进入仓库设置
- 找到 "Pages" 选项
- 选择 "Deploy from a branch"
- 选择 "main" 分支
- 点击 "Save"

3. **访问部署的应用**
```
https://yourusername.github.io/toupiao
```

### Pi Network 部署

1. **准备 Pi 开发者账户**
- 注册 Pi Network 开发者账户
- 获取应用审核权限

2. **配置 Pi SDK**
```javascript
// 在生产环境中替换模拟 SDK
const piSDK = window.piBrowserSDK;
```

3. **提交应用审核**
- 按照 Pi Network 官方流程提交应用
- 等待审核通过

## 使用指南

### 基本操作

1. **登录系统**
   - 点击 "登录" 按钮
   - 通过 Pi Network 认证
   - 登录成功后按钮变为 "退出"

2. **创建投票项目**
   - 展开 "创建项目" 卡片
   - 填写项目信息
   - 设置投票积分（需要足够余额）
   - 提交创建

3. **参与投票**
   - 在 "所有项目" 中选择项目
   - 点击 "投票" 按钮
   - 选择 "是" 或 "否"
   - 确认投票

4. **查看我的项目**
   - 展开 "我的项目" 卡片
   - 切换 "我创建的" / "我参与的" 标签
   - 查看项目状态和投票结果

### 积分管理

1. **充值积分**
   - 点击 "充值" 按钮
   - 查看收币地址
   - 按照教程操作

2. **提现积分**
   - 点击 "提现" 按钮
   - 输入提币地址
   - 输入提现金额
   - 确认提现（扣除10%手续费）

## 开发规范

### 代码风格
- 使用 ES6+ 语法
- 采用模块化设计
- 遵循语义化命名
- 添加详细注释

### 数据安全
- 所有数据存储在本地
- 不调用外部API
- 地址格式验证
- 输入数据校验

### 性能优化
- 最小化DOM操作
- 事件委托处理
- 数据懒加载
- 响应式设计

## 浏览器兼容性

- **主要支持**: Pi Browser (Chromium 内核)
- **测试兼容**: Chrome 90+, Safari 14+, Firefox 88+
- **移动端**: iOS Safari, Android Chrome

## 常见问题

### Q: 为什么登录失败？
A: 确保在 Pi 浏览器环境中运行，或检查 SDK 初始化状态。

### Q: 投票后积分没有增加？
A: 检查是否已经投过票，每个项目限投一次。

### Q: 创建项目时提示积分不足？
A: 创建项目需要冻结相应积分，确保余额充足。

### Q: 数据丢失怎么办？
A: 数据存储在浏览器本地，清除缓存会导致数据丢失。

## 更新日志

### v1.0.0 (2024-01-XX)
- ✨ 初始版本发布
- 🔐 Pi Network SDK 集成
- 🗳️ 基础投票功能
- 💰 积分系统实现
- 📱 响应式UI设计

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 联系方式

- 项目链接: [https://github.com/yourusername/toupiao](https://github.com/yourusername/toupiao)
- 问题反馈: [Issues](https://github.com/yourusername/toupiao/issues)

## 致谢

- [Pi Network](https://minepi.com/) - 提供区块链基础设施
- [Pi Developer Platform](https://developers.minepi.com/) - 开发者文档和工具

---

**注意**: 这是一个演示应用，仅用于学习和开发测试。在生产环境中使用前，请确保通过 Pi Network 官方审核。