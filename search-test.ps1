# 设置编码
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$headers = @{
    "Authorization" = "Bearer MASHL3PEZuMZR3xwXw5XK9kKEY"
    "Content-Type" = "application/json; charset=utf-8"
}

$searchBody = @{
    q = "佛"
    limit = 10
    attributesToHighlight = @("*")
} | ConvertTo-Json -Depth 10

$response = Invoke-RestMethod -Uri "http://localhost:7700/indexes/documents/search" `
    -Headers $headers `
    -Method Post `
    -Body ([System.Text.Encoding]::UTF8.GetBytes($searchBody))

Write-Host "搜索结果:"
$response.hits | ForEach-Object {
    Write-Host "----------------------------------------"
    Write-Host "标题: $($_.metadata.zh_CN.display.title)"
    Write-Host "讲者: $($_.metadata.zh_CN.display.speaker)"
    Write-Host "内容: $($_.content.sections[0].paragraphs[0].text.Substring(0, [Math]::Min(100, $_.content.sections[0].paragraphs[0].text.Length)))"
    Write-Host "----------------------------------------`n"
}
