# 检索系统

基于Meilisearch的文档检索系统，支持简体/繁体中文切换，黑白主题切换，以及高级筛选功能。

## 功能特点

- 🔍 全文检索：基于Meilisearch的高性能全文搜索
- 🌓 主题切换：支持黑暗模式和亮色模式
- 🔤 语言切换：支持简体中文和繁体中文
- 🎨 现代UI：玻璃磨砂效果、渐变色、阴影等现代设计元素
- 📱 响应式设计：适配不同屏幕尺寸
- 🔎 高级筛选：支持按文档编号、年份等条件筛选

## 系统架构

- 前端：Next.js + React + Styled Components
- API：Next.js API Routes
- 搜索引擎：Meilisearch

## 目录结构

```
jk-search/
├── frontend/            # Next.js应用
│   ├── public/         # 静态资源
│   ├── src/           # 源代码
│   │   ├── components/ # React组件
│   │   ├── pages/     # Next.js页面和API路由
│   │   │   ├── api/   # API路由
│   │   │   └── ...    # 页面组件
│   │   ├── scripts/   # 工具脚本（如数据导入）
│   │   ├── services/  # API服务
│   │   └── styles/    # 全局样式
│   ├── .env.local     # 环境变量配置
│   └── package.json   # 依赖配置
│
└── Doc/               # 文档数据
    └── json/         # JSON格式的文档数据
```

## 安装与运行

### 前提条件

- Node.js 14.x 或更高版本
- Meilisearch 服务器 (可以使用Docker安装)

### 安装Meilisearch

使用Docker安装Meilisearch:

```bash
docker run -p 7700:7700 -v $(pwd)/meili_data:/meili_data getmeili/meilisearch:latest
```

### 应用设置

1. 克隆仓库:

```bash
git clone <repository-url>
cd jk-search
```

2. 安装依赖:

```bash
cd frontend
npm install
```

3. 配置环境变量:

创建 `frontend/.env.local` 文件:

```
NEXT_PUBLIC_MEILI_HOST=http://127.0.0.1:7700
NEXT_PUBLIC_MEILI_KEY=your_master_key_here
PORT=5500
```

4. 导入数据:

```bash
cd frontend/src/scripts
node import.js
```

5. 启动应用:

Windows:
```bash
.\start-app.ps1
```

Linux/macOS:
```bash
./start-app.sh
```

6. 在浏览器中访问:

```
http://localhost:5500
```

## 使用说明

1. **首页搜索**: 在首页输入关键词进行搜索
2. **浏览目录**: 点击"浏览目录"查看所有文档分类
3. **搜索结果**: 搜索后可以使用左侧筛选面板进行高级筛选
4. **主题切换**: 点击界面上的主题按钮切换黑白主题
5. **语言切换**: 点击界面上的语言按钮在简体/繁体中文之间切换

## 部署

### 构建应用

```bash
cd frontend
npm run build
```

### 启动生产环境

```bash
npm start
```

## 许可证

ISC

cd jk-search
Windows: .\start-app.ps1
Linux/macOS: ./start-app.sh