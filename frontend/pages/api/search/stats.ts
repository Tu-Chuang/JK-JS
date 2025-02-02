import { NextApiRequest, NextApiResponse } from 'next';
import { MeiliSearch } from 'meilisearch';

const client = new MeiliSearch({
  host: process.env.NEXT_PUBLIC_MEILI_URL || 'http://localhost:7700',
  apiKey: process.env.MEILI_MASTER_KEY || 'MASHL3PEZuMZR3xwXw5XK9kKEY'
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const index = client.index('documents');
    const stats = await index.getStats();
    
    res.status(200).json({
      success: true,
      stats: stats
    });
  } catch (error) {
    console.error('获取状态错误:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '无法获取索引状态'
    });
  }
} 