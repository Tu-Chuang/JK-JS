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

  const { id } = req.query;
  
  // 记录文档ID，便于调试
  console.log(`尝试获取文档ID: ${id}，时间: ${new Date().toISOString()}`);

  try {
    // 检查文档ID格式
    if (!id || typeof id !== 'string') {
      console.error(`文档ID格式无效: ${id}`);
      return res.status(400).json({ message: '无效的文档ID' });
    }
    
    console.log(`正在请求MeiliSearch文档: ${id}`);
    
    // 首先尝试直接获取文档
    try {
      const document = await client.index('documents').getDocument(id);
      
      if (document) {
        console.log(`成功获取文档: ${id}, 标题: ${document.title?.zh_CN || 'N/A'}`);
        return res.status(200).json(document);
      }
    } catch (directFetchError) {
      console.log(`直接获取文档 ${id} 失败: ${directFetchError.message}`);
      // 如果直接获取失败，继续尝试搜索
    }
    
    // 检查是否是课程ID（形如 01-003）- 通常格式为 XX-XXX(-XXXX)
    const isCourseId = /^\d{2}-\d{3}$/.test(id);
    
    if (isCourseId) {
      try {
        console.log(`检测到课程ID: ${id}，尝试搜索该课程的第一篇文档`);
        
        // 使用前缀搜索查找该课程的所有文档
        const searchResults = await client.index('documents').search('', {
          filter: [`id LIKE "${id}-%"`],
          limit: 10,
          sort: ['id:asc']  // 按ID升序排序，获取第一篇
        });
        
        if (searchResults.hits && searchResults.hits.length > 0) {
          const firstDocument = searchResults.hits[0];
          console.log(`找到课程 ${id} 的第一篇文档: ${firstDocument.id}`);
          
          // 重定向到实际文档
          return res.status(200).json({
            ...firstDocument,
            _redirected: true,
            _originalId: id,
            _message: `自动跳转到课程 ${id} 的第一篇文档`
          });
        } else {
          console.error(`未找到课程 ${id} 的任何文档`);
          return res.status(404).json({ 
            message: `未找到课程 ${id} 的任何文档`,
            courseId: id
          });
        }
      } catch (searchError) {
        console.error(`搜索课程 ${id} 的文档失败:`, searchError);
        return res.status(500).json({ 
          message: `搜索课程 ${id} 的文档失败`, 
          error: searchError.message,
          courseId: id
        });
      }
    }
    
    // 如果不是课程ID且直接获取失败，则返回404
    console.error(`未找到文档: ${id}`);
    return res.status(404).json({ message: '文档不存在', docId: id });
      
  } catch (error) {
    // 处理所有其他未预期的错误
    console.error(`获取文档 ${id} 失败，未预期错误:`, {
      name: error.name,
      message: error.message,
      stack: error.stack?.split('\n')[0] || 'No stack trace'
    });
    
    res.status(500).json({ 
      message: '获取文档失败，服务器内部错误', 
      error: error.message,
      errorType: 'internal_server_error'
    });
  }
} 