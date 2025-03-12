import { MeiliSearch } from 'meilisearch';

// 定义变量
let meiliClient;
const DEFAULT_INDEX = 'documents';

// 确保只在客户端环境中初始化
if (typeof window !== 'undefined') {
  meiliClient = new MeiliSearch({
    host: process.env.NEXT_PUBLIC_MEILI_HOST || 'http://127.0.0.1:7700',
    apiKey: process.env.NEXT_PUBLIC_MEILI_KEY || 'fBNKHjhvjh16513mkbj13534sdgSDHJTksyk',
  });
}

// 搜索文档
export const searchDocuments = async (query, options = {}) => {
  // 确保meiliClient已初始化
  if (!meiliClient) {
    throw new Error('MeiliSearch客户端未初始化，只能在客户端环境中使用');
  }
  
  try {
    const {
      language = 'zh_CN',
      limit = 10,
      offset = 0,
      filter = {},
      index = DEFAULT_INDEX
    } = options;
    
    // 只获取当前页需要的结果
    const searchResult = await meiliClient.index(index).search(query, {
      limit: limit + 1, // 多获取一条结果用于判断是否有下一页
      offset,
      attributesToSearchOn: [
        language === 'zh_CN' ? 'paragraphs.zh_CN' : 'paragraphs.zh_TW',
        language === 'zh_CN' ? 'title.zh_CN' : 'title.zh_TW'
      ]
    });

    // 过滤出实际匹配的结果
    const validHits = searchResult.hits.filter(hit => {
      if (!hit.paragraphs || !Array.isArray(hit.paragraphs)) return false;
      const langKey = language === 'zh_CN' ? 'zh_CN' : 'zh_TW';
      
      // 检查段落是否匹配
      return hit.paragraphs.some(p => {
        if (!p || typeof p !== 'object') return false;
        const text = p[langKey];
        return typeof text === 'string' && new RegExp(query, 'i').test(text);
      });
    });

    // 判断是否有下一页
    const hasNextPage = validHits.length > limit;
    // 如果多获取了一条结果，需要将其移除
    const currentPageHits = hasNextPage ? validHits.slice(0, limit) : validHits;
    
    return {
      hits: currentPageHits,
      hasNextPage,
      processingTimeMs: searchResult.processingTimeMs
    };
  } catch (error) {
    console.error('搜索文档失败:', error);
    throw error;
  }
};

// 获取单个文档
export const getDocument = async (id, index = DEFAULT_INDEX) => {
  // 确保meiliClient已初始化
  if (!meiliClient) {
    throw new Error('MeiliSearch客户端未初始化，只能在客户端环境中使用');
  }
  
  try {
    const document = await meiliClient.index(index).getDocument(id);
    return document;
  } catch (error) {
    console.error('获取文档失败:', error);
    throw error;
  }
};

// 获取索引统计信息
export const getIndexStats = async (index = DEFAULT_INDEX) => {
  // 确保meiliClient已初始化
  if (!meiliClient) {
    throw new Error('MeiliSearch客户端未初始化，只能在客户端环境中使用');
  }
  
  try {
    const stats = await meiliClient.index(index).getStats();
    return stats;
  } catch (error) {
    console.error('获取索引统计失败:', error);
    throw error;
  }
};

// 获取所有文档
export const getAllDocuments = async (limit = 100, offset = 0, index = DEFAULT_INDEX) => {
  // 确保meiliClient已初始化
  if (!meiliClient) {
    throw new Error('MeiliSearch客户端未初始化，只能在客户端环境中使用');
  }
  
  try {
    const documents = await meiliClient.index(index).getDocuments({
      limit,
      offset
    });
    return documents;
  } catch (error) {
    console.error('获取所有文档失败:', error);
    throw error;
  }
};

// 配置索引设置
export const configureIndex = async (index = DEFAULT_INDEX) => {
  // 确保meiliClient已初始化
  if (!meiliClient) {
    throw new Error('MeiliSearch客户端未初始化，只能在客户端环境中使用');
  }
  
  try {
    // 设置可排序的属性
    const settings = {
      // 可以同时设置其他属性
      filterableAttributes: [
        'doc_id',
        'doc_number',
        'year',
        'category',
        'subcategory'
      ],
      searchableAttributes: [
        'title.zh_CN',
        'title.zh_TW',
        'paragraphs.zh_CN',
        'paragraphs.zh_TW',
        'content'
      ]
    };

    // 更新设置
    await meiliClient.index(index).updateSettings(settings);
    
    // 等待一下，确保设置已应用
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 验证设置是否成功应用
    const updatedSettings = await meiliClient.index(index).getSettings();
    console.log('更新后的设置:', updatedSettings);
    
    console.log('索引设置更新成功');
    return true;
  } catch (error) {
    console.error('配置索引失败:', error);
    throw error;
  }
};

// 获取索引设置
export const getIndexSettings = async (index = DEFAULT_INDEX) => {
  // 确保meiliClient已初始化
  if (!meiliClient) {
    throw new Error('MeiliSearch客户端未初始化，只能在客户端环境中使用');
  }
  
  try {
    const settings = await meiliClient.index(index).getSettings();
    return settings;
  } catch (error) {
    console.error('获取索引设置失败:', error);
    throw error;
  }
};

export default meiliClient; 