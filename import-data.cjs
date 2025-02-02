const fs = require('fs');
const path = require('path');
const { MeiliSearch } = require('meilisearch');

const client = new MeiliSearch({
  host: 'http://localhost:7700',
  apiKey: 'MASHL3PEZuMZR3xwXw5XK9kKEY'
});

async function waitForTask(index, taskId) {
  let task;
  do {
    task = await index.getTask(taskId);
    await new Promise(resolve => setTimeout(resolve, 500));
  } while (task.status !== 'succeeded' && task.status !== 'failed');
  return task;
}

async function importSeries(index, seriesId) {
  const baseDir = `./document/${seriesId}/json`;
  if (!fs.existsSync(baseDir)) {
    console.log(`跳过 ${seriesId}: 目录不存在`);
    return [];
  }

  const documents = [];
  const files = fs.readdirSync(baseDir)
    .filter(file => file.endsWith('.json'))
    .sort((a, b) => {
      const numA = parseInt(a.match(/\d+/)[0]);
      const numB = parseInt(b.match(/\d+/)[0]);
      return numA - numB;
    });

  console.log(`处理系列 ${seriesId}: 找到 ${files.length} 个文件`);

  for (const file of files) {
    const filePath = path.join(baseDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const doc = JSON.parse(content);
    documents.push(doc);
  }

  return documents;
}

async function importData() {
  try {
    // 创建索引
    console.log('正在创建索引...');
    const createIndexResponse = await client.createIndex('documents', {
      primaryKey: 'id'
    });
    console.log('索引创建任务:', createIndexResponse);
    
    const index = client.index('documents');

    // 更新索引设置
    console.log('正在更新索引设置...');
    const settingsTask = await index.updateSettings({
      searchableAttributes: [
        'metadata.zh_CN.display.title',
        'metadata.zh_TW.display.title',
        'metadata.zh_CN.display.speaker',
        'content.sections.paragraphs.text'
      ],
      filterableAttributes: [
        'category_id',
        'series_id',
        'type',
        'metadata.zh_CN.display.speaker',
        'metadata.zh_CN.display.date'
      ],
      displayedAttributes: [
        'id',
        'doc_id',
        'series_id',
        'category_id',
        'type',
        'metadata',
        'content'
      ],
      sortableAttributes: [
        'metadata.zh_CN.display.date'
      ]
    });

    await waitForTask(index, settingsTask.taskUid);
    console.log('索引设置更新完成');

    // 读取Contents.json获取所有系列信息
    const contents = JSON.parse(fs.readFileSync('./document/Contents.json', 'utf8'));
    
    // 准备导入所有系列
    const allDocuments = [];
    const seriesToImport = ['01-001', '32-336']; // 先导入这两个系列作为测试

    for (const seriesId of seriesToImport) {
      const seriesDocs = await importSeries(index, seriesId);
      allDocuments.push(...seriesDocs);
      console.log(`系列 ${seriesId} 导入完成: ${seriesDocs.length} 个文档`);
    }

    console.log(`总共准备导入 ${allDocuments.length} 个文档...`);
    const importTask = await index.addDocuments(allDocuments);
    console.log('导入任务创建成功:', importTask);

    const finalTask = await waitForTask(index, importTask.taskUid);
    console.log('导入任务完成状态:', finalTask.status);

    // 验证导入
    const stats = await index.getStats();
    console.log('索引统计:', stats);

    // 测试搜索
    const searchResult = await index.search('佛');
    console.log('搜索结果数量:', searchResult.hits.length);
    console.log('搜索结果示例:', searchResult.hits.slice(0, 3).map(hit => ({
      id: hit.id,
      title: hit.metadata.zh_CN.display.title,
      speaker: hit.metadata.zh_CN.display.speaker
    })));

  } catch (error) {
    console.error('导入错误:', error);
    throw error;
  }
}

importData(); 