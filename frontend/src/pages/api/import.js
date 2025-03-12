import { MeiliSearch } from 'meilisearch';
import path from 'path';
import fs from 'fs';

// 初始化MeiliSearch客户端
const client = new MeiliSearch({
  host: process.env.NEXT_PUBLIC_MEILI_HOST || 'http://127.0.0.1:7700',
  apiKey: process.env.NEXT_PUBLIC_MEILI_KEY,
});

// 读取JSON文件并解析
async function readJsonFiles(rootDir) {
  try {
    let documents = [];
    
    // 获取所有子目录
    const directories = fs.readdirSync(rootDir);
    console.log(`找到 ${directories.length} 个子目录`);
    
    for (const dir of directories) {
      const dirPath = path.join(rootDir, dir);
      
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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: '仅支持POST请求' });
  }

  try {
    const { useBackend = false } = req.body;
    const BATCH_SIZE = 200;
    
    // 确定文档目录路径
    const rootDir = path.resolve(process.cwd(), useBackend ? '../backend/Doc/json' : '../Doc/json');
    
    console.log('开始读取文档从:', rootDir);
    const documents = await readJsonFiles(rootDir);
    
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
    
    res.status(200).json({ success: true, message: '导入完成' });
  } catch (error) {
    console.error('导入文档失败:', error);
    res.status(500).json({ success: false, message: '导入失败', error: error.message });
  }
} 