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
    const { query, index = 'documents', limit = 10, offset = 0, filter } = req.query;
    
    // 准备搜索选项
    const searchOptions = {
      limit: parseInt(limit),
      offset: parseInt(offset),
    };
    
    // 添加筛选条件（如果有）
    if (filter) {
      try {
        searchOptions.filter = JSON.parse(filter);
      } catch (e) {
        console.warn('解析筛选条件失败', e);
      }
    }
    
    const results = await client.index(index).search(query, searchOptions);
    
    res.status(200).json(results);
  } catch (error) {
    console.error('搜索错误:', error);
    res.status(500).json({ message: '搜索服务出错', error: error.message });
  }
} 