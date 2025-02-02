$MEILI_URL = "http://localhost:7700"
$API_KEY = "MASHL3PEZuMZR3xwXw5XK9kKEY"
$INDEX_NAME = "documents"

$headers = @{
    "Authorization" = "Bearer $API_KEY"
    "Content-Type" = "application/json"
}

# 遍历所有JSON文件
Get-ChildItem -Path "document\01-001\json\*.json" | ForEach-Object {
    $filePath = $_.FullName
    Write-Host "正在导入: $filePath"
    
    try {
        $jsonContent = Get-Content $filePath -Raw | ConvertFrom-Json
        $response = Invoke-RestMethod `
            -Uri "$MEILI_URL/indexes/$INDEX_NAME/documents" `
            -Method POST `
            -Headers $headers `
            -Body ($jsonContent | ConvertTo-Json -Depth 10)
        
        Write-Host "成功导入: $($_.Name) → 文档ID: $($response.taskUid)"
    }
    catch {
        Write-Host "导入失败: $($_.Name) → 错误: $($_.Exception.Message)" -ForegroundColor Red
    }
} 