require('dotenv').config({ path: '../../.env.local' });
const fs = require('fs');
const path = require('path');
const { MeiliSearch } = require('meilisearch');

// 初始化MeiliSearch客户端
const client = new MeiliSearch({
  host: process.env.NEXT_PUBLIC_MEILI_HOST || 'http://127.0.0.1:7700',
  apiKey: process.env.NEXT_PUBLIC_MEILI_KEY,
});

// 定义JSON文件目录
const JSON_DIR = path.join(__dirname, '../../.././../Doc/json');
const BATCH_SIZE = 200;

// 读取JSON文件并解析
async function readJsonFiles() {
  try {
    let documents = [];
    
    // 获取所有子目录
    const directories = fs.readdirSync(JSON_DIR);
    console.log(`找到 ${directories.length} 个子目录`);
    
    for (const dir of directories) {
      const dirPath = path.join(JSON_DIR, dir);
      
      // 确保是目录
      if (fs.statSync(dirPath).isDirectory()) {
        const files = fs.readdirSync(dirPath);
        console.log(`目录 ${dir} 中有 ${files.length} 个文件`);
        
        for (const file of files) {
          if (file.endsWith('.json')) {
            const filePath = path.join(dirPath, file);
            const fileContent = fs.readFileSync(filePath, 'utf8');
            
            try {
              const doc = JSON.parse(fileContent);
              // 处理文档
              const processedDoc = processDocument(doc);
              documents.push(processedDoc);
            } catch (e) {
              console.error(`解析文件 ${filePath} 失败:`, e);
            }
          }
        }
      }
    }
    
    console.log(`总共读取了 ${documents.length} 个文档`);
    return documents;
  } catch (error) {
    console.error('读取JSON文件失败:', error);
    throw error;
  }
}

// 处理文档，确保格式正确
function processDocument(doc) {
  // 确保文档有唯一ID
  if (!doc.id) {
    doc.id = doc.docId || doc.documentId || Date.now().toString();
  }
  
  // 确保段落是数组
  if (!Array.isArray(doc.paragraphs)) {
    doc.paragraphs = [];
  }
  
  // 确保标题格式正确
  if (!doc.title) {
    doc.title = {
      zh_CN: doc.titleCN || '无标题',
      zh_TW: doc.titleTW || '無標題'
    };
  } else if (typeof doc.title === 'string') {
    const titleText = doc.title;
    doc.title = {
      zh_CN: titleText,
      zh_TW: titleText
    };
  }
  
  return doc;
}

// 导入文档到Meilisearch
async function importDocuments() {
  try {
    console.log('开始读取文档...');
    const documents = await readJsonFiles();
    
    console.log('开始导入文档到Meilisearch...');
    
    // 创建或重置索引
    await client.createIndex('documents', { primaryKey: 'id' });
    console.log('索引已创建');
    
    // 分批导入文档
    const batches = [];
    for (let i = 0; i < documents.length; i += BATCH_SIZE) {
      batches.push(documents.slice(i, i + BATCH_SIZE));
    }
    
    console.log(`将分 ${batches.length} 批导入文档`);
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(`导入第 ${i + 1}/${batches.length} 批，包含 ${batch.length} 个文档`);
      
      await client.index('documents').addDocuments(batch);
    }
    
    console.log('所有文档导入完成');
    
    // 配置索引
    console.log('配置索引...');
    await client.index('documents').updateSettings({
      searchableAttributes: [
        'title.zh_CN',
        'title.zh_TW',
        'paragraphs.zh_CN',
        'paragraphs.zh_TW'
      ],
      filterableAttributes: [
        'volume',
        'year',
        'docId',
        'category'
      ],
      sortableAttributes: [
        'volume',
        'year'
      ]
    });
    
    console.log('索引配置完成');
    
  } catch (error) {
    console.error('导入文档失败:', error);
  }
}

// 执行导入
importDocuments(); 