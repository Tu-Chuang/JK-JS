const { MeiliSearch } = require('meilisearch');

const client = new MeiliSearch({
  host: 'http://localhost:7700',
  apiKey: 'MASHL3PEZuMZR3xwXw5XK9kKEY'
});

async function testAll() {
  try {
    // 1. 检查索引是否存在
    const indexes = await client.getIndexes();
    console.log('现有索引:', indexes);

    const index = client.index('documents');

    // 2. 检查索引设置
    const settings = await index.getSettings();
    console.log('索引设置:', settings);

    // 3. 检查文档数量
    const stats = await index.getStats();
    console.log('索引统计:', stats);

    // 4. 测试搜索
    const searchResult = await index.search('佛', {
      limit: 10
    });
    console.log('搜索结果:', searchResult.hits);

  } catch (error) {
    console.error('测试出错:', error);
  }
}

testAll(); 