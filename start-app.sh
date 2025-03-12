#!/bin/bash

# 进入项目目录
cd /var/www/jk-search/jk-search

# 启动Meilisearch服务
systemctl start meilisearch

# 等待Meilisearch启动
sleep 5

# 检查Meilisearch是否成功启动
if curl -s "http://127.0.0.1:7700/health" > /dev/null; then
    echo "MeiliSearch is running"
else
    echo "MeiliSearch failed to start"
    exit 1
fi

# 进入前端目录
cd frontend

# 检查是否已经有运行的实例
pm2 describe jk-search > /dev/null
if [ $? -eq 0 ]; then
    echo "Restarting existing jk-search instance"
    pm2 restart jk-search
else
    echo "Starting new jk-search instance"
    pm2 start npm --name "jk-search" -- start
fi

# 保存 PM2 进程列表
pm2 save

echo "All services started successfully!"
echo "You can access the application at http://jiansuo.insightai.top"
echo "To check status, use: pm2 status"
echo "To view logs, use: pm2 logs jk-search"

# 创建 systemd 服务文件
cat > /etc/systemd/system/jk-search-all.service << EOF
[Unit]
Description=JK Search Full Stack
After=network.target

[Service]
Type=oneshot
RemainAfterExit=yes
ExecStart=/var/www/jk-search/jk-search/start-server.sh
User=root
Group=root

[Install]
WantedBy=multi-user.target
EOF

# 重新加载 systemd
systemctl daemon-reload

# 启用服务
systemctl enable jk-search-all

# 启动服务
systemctl start jk-search-all