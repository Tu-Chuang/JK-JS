import { getDirectoryTree } from '../../../data/directory';

// CORS middleware
const enableCORS = (req, res) => {
  // 允许所有来源的请求
  res.setHeader('Access-Control-Allow-Origin', '*');
  // 允许的请求方法
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  // 允许的请求头
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // 预检请求直接返回200
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }
  return false;
};

export default function handler(req, res) {
  // 处理CORS
  if (enableCORS(req, res)) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ message: '仅支持GET请求' });
  }

  try {
    // 从directory.js获取目录树数据
    const directoryTree = getDirectoryTree();
    
    // 格式化为文件列表格式（如果需要特定格式）
    const filesList = directoryTree.map(category => ({
      id: category.id,
      name: category.name,
      nameTw: category.nameTw,
      type: 'category',
      children: category.children.map(course => ({
        id: course.id,
        name: course.name,
        nameTw: course.nameTw,
        type: 'course',
        parentId: category.id,
        files: course.files || 0
      }))
    }));
    
    res.status(200).json(filesList);
  } catch (error) {
    console.error('获取文件列表失败:', error);
    res.status(500).json({ message: '获取文件列表失败', error: error.message });
  }
} 