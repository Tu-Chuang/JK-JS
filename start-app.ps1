# 启动Meilisearch服务
Start-Process -FilePath "./frontend/bin/meilisearch.exe" -ArgumentList "--master-key=fBNKHjhvjh16513mkbj13534sdgSDHJTksyk --db-path=./frontend/data/data.ms" -WindowStyle Hidden

# 等待Meilisearch启动
Start-Sleep -Seconds 5

# 启动Next.js应用
Set-Location -Path "./frontend"
npm run dev 