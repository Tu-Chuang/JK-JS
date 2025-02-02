import { NextApiRequest, NextApiResponse } from 'next';
import { MeiliSearch } from 'meilisearch';

const client = new MeiliSearch({
  host: process.env.NEXT_PUBLIC_MEILI_URL || 'http://localhost:7700',
  apiKey: process.env.MEILI_MASTER_KEY || 'MASHL3PEZuMZR3xwXw5XK9kKEY'
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { q = '' } = req.query;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        error: '请输入搜索关键词'
      });
    }

    const index = client.index('documents');
    
    console.log('开始搜索:', {
      query: q,
      url: process.env.NEXT_PUBLIC_MEILI_URL,
      indexName: 'documents'
    });

    const stats = await index.getStats();
    console.log('索引状态:', stats);

    if (stats.numberOfDocuments === 0) {
      throw new Error('索引中没有文档');
    }

    const searchResult = await index.search(q.toString(), {
      limit: 10,
      attributesToHighlight: ['content.sections.paragraphs.text'],
      highlightPreTag: '<em class="highlight">',
      highlightPostTag: '</em>',
      attributesToSearchOn: [
        'metadata.zh_CN.display.title',
        'metadata.zh_TW.display.title',
        'content.sections.paragraphs.text'
      ]
    });

    console.log('搜索结果:', searchResult);

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    res.status(200).json({
      success: true,
      data: searchResult.hits,
      total: searchResult.estimatedTotalHits,
      stats: stats
    });
  } catch (error) {
    console.error('搜索错误:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '搜索服务暂不可用'
    });
  }
} 