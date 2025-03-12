import { MeiliSearch } from 'meilisearch';
import path from 'path';
import fs from 'fs';
import { getCategories, getCoursesByCategory } from '../../data/directory';

// 初始化MeiliSearch客户端
const client = new MeiliSearch({
  host: process.env.NEXT_PUBLIC_MEILI_HOST || 'http://127.0.0.1:7700',
  apiKey: process.env.NEXT_PUBLIC_MEILI_KEY,
});

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

// 为每个课程找到第一篇文档ID
const findFirstDocumentIds = async (courses) => {
  try {
    // 不再使用MeiliSearch查询，直接返回预构建的ID
    return courses.map(course => {
      // 只对有效的课程ID进行处理
      if (!course.id || !/^\d{2}-\d{3}$/.test(course.id)) {
        return course;
      }
      
      // 直接构建第一篇文档ID
      return {
        ...course,
        firstDocumentId: `${course.id}-0001`, // 使用固定格式
        documentCount: course.files || 0
      };
    });
  } catch (error) {
    console.error('生成文档ID失败:', error);
    // 返回原始课程数据，不修改
    return courses;
  }
};

export default async function handler(req, res) {
  // 处理CORS
  if (enableCORS(req, res)) return;
  
  if (req.method !== 'GET') {
    return res.status(405).json({ message: '仅支持GET请求' });
  }
  
  try {
    // 从directory.js获取课程目录数据
    const categories = getCategories();
    
    // 添加课程信息
    const volumesWithCourses = await Promise.all(categories.map(async (category) => {
      const courses = getCoursesByCategory(category.id);
      
      // 为每个课程添加第一篇文档ID
      const enhancedCourses = await findFirstDocumentIds(courses);
      
      return {
        ...category,
        courses: enhancedCourses
      };
    }));
    
    res.status(200).json(volumesWithCourses);
  } catch (error) {
    console.error('获取课程目录失败:', error);
    res.status(500).json({ message: '获取课程目录失败', error: error.message });
  }
} 