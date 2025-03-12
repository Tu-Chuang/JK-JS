import { getDirectoryTree, getCategories, getCoursesByCategory } from '../../data/directory';

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

export default async function handler(req, res) {
  // 处理CORS
  if (enableCORS(req, res)) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ message: '仅支持GET请求' });
  }

  try {
    // 获取目录树，确保数据结构正确
    const categories = getCategories();
    const catalogData = {};
    
    // 将数据转换为catalog页面期望的格式
    categories.forEach(category => {
      const courses = getCoursesByCategory(category.id);
      catalogData[category.id] = {
        id: category.id,
        name: category.name,
        nameTw: category.nameTw,
        courses: courses.reduce((acc, course) => {
          acc[course.id] = {
            id: course.id,
            title: course.name || course.title,
            titleTw: course.nameTw || course.titleTw,
            files: course.files || 0
          };
          return acc;
        }, {})
      };
    });
    
    console.log('成功生成目录数据', Object.keys(catalogData).length);
    
    // 返回前端期望的格式
    res.status(200).json(catalogData);
  } catch (error) {
    console.error('获取目录失败:', error);
    res.status(500).json({ message: '获取目录失败', error: error.message });
  }
} 