# 停止现有服务
taskkill /IM meilisearch.exe /F 2>&1 | Out-Null

# 启动新服务
Start-Process .\meilisearch.exe -ArgumentList @(
    '--master-key="MASHL3PEZuMZR3xwXw5XK9kKEY"',
    '--env="development"',
    '--http-addr=127.0.0.1:7700',
    '--db-path=.\meili_data',
    '--log-file=meilisearch.log'  # 显式指定日志文件路径
) -NoNewWindow

# 启动前端
Set-Location frontend
npm run dev 



# 1. 停止所有服务
taskkill /IM meilisearch.exe /F
taskkill /IM node.exe /F

# 2. 清理数据库
Remove-Item -Recurse -Force .\meili_data\
New-Item -ItemType Directory -Path .\meili_data

# 3. 启动服务
# 修改启动参数
Start-Process .\meilisearch.exe -ArgumentList @(
    '--master-key="MASHL3PEZuMZR3xwXw5XK9kKEY"',
    '--env="development"',
    '--http-addr=127.0.0.1:7700',
    '--db-path=.\meili_data',
    '--log-file=meilisearch.log'  # 显式指定日志文件路径
) -NoNewWindow

# 4. 等待服务启动
Start-Sleep -Seconds 10

# 5. 导入数据
node import-data.cjs

# 6. 启动前端
Set-Location frontend
npm run dev