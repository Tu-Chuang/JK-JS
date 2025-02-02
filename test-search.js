const { MeiliSearch } = require('meilisearch');

const client = new MeiliSearch({
  host: 'http://localhost:7700',
  apiKey: 'MASHL3PEZuMZR3xwXw5XK9kKEY'
});

async function testSearch() {
  try {
    const index = client.index('documents');
    
    console.log('执行搜索测试...\n');
    
    const searchResult = await index.search('佛', {
      limit: 10,
      attributesToHighlight: ['content.sections.paragraphs.text'],
      highlightPreTag: '<em>',
      highlightPostTag: '</em>'
    });

    if (searchResult.hits.length > 0) {
      searchResult.hits.forEach(hit => {
        console.log('----------------------------------------');
        console.log('标题:', hit.metadata.zh_CN.display.title);
        console.log('讲者:', hit.metadata.zh_CN.display.speaker);
        console.log('内容:', hit.content.sections[0].paragraphs[0].text.substring(0, 100));
        console.log('----------------------------------------\n');
      });
    } else {
      console.log('没有找到匹配的结果');
    }

  } catch (error) {
    console.error('搜索出错:', error);
  }
}

testSearch(); 