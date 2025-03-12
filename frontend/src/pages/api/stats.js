import { MeiliSearch } from 'meilisearch';

// 初始化MeiliSearch客户端
const client = new MeiliSearch({
  host: process.env.NEXT_PUBLIC_MEILI_HOST || 'http://127.0.0.1:7700',
  apiKey: process.env.NEXT_PUBLIC_MEILI_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: '仅支持GET请求' });
  }

  try {
    const { index = 'documents' } = req.query;
    
    // 获取索引统计信息
    const stats = await client.index(index).getStats();
    
    res.status(200).json(stats);
  } catch (error) {
    console.error('获取索引统计失败:', error);
    res.status(500).json({ message: '获取索引统计失败', error: error.message });
  }
} 