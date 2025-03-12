import { MeiliSearch } from 'meilisearch';

// 初始化MeiliSearch客户端
const client = new MeiliSearch({
  host: process.env.NEXT_PUBLIC_MEILI_HOST || 'http://127.0.0.1:7700',
  apiKey: process.env.NEXT_PUBLIC_MEILI_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: '仅支持POST请求' });
  }

  try {
    const { index = 'documents', settings } = req.body;

    // 更新索引设置
    await client.index(index).updateSettings(settings);
    
    res.status(200).json({ message: '索引配置已更新' });
  } catch (error) {
    console.error('更新索引配置失败:', error);
    res.status(500).json({ message: '更新索引配置失败', error: error.message });
  }
} 