import axios from 'axios';
import { directory } from '../data/directory';

// 获取基础URL，确保使用正确的端口
const getBaseUrl = () => {
  // 在客户端，使用相对路径，让浏览器自动使用当前域名和端口
  if (typeof window !== 'undefined') {
    return '/api';
  }
  // 在服务端，使用完整URL（基于环境变量）
  return `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5500'}/api`;
};

// 创建axios实例
const api = axios.create({
  baseURL: getBaseUrl(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 调试API配置
const DEBUG = true;

// 请求拦截器
api.interceptors.request.use(config => {
  // 如果是客户端环境，更新baseURL，确保绝对使用当前页面的域名和端口
  if (typeof window !== 'undefined') {
    // 使用当前窗口的域名和端口，而不是硬编码的值
    const currentUrl = `${window.location.protocol}//${window.location.host}`;
    
    // 处理原始URL
    const originalBaseURL = config.baseURL;
    const newBaseURL = `${currentUrl}/api`;
    
    // 修改请求配置
    config.baseURL = newBaseURL;
    
    // 调试信息
    if (DEBUG) {
      console.log(`请求拦截: ${config.method.toUpperCase()} ${config.url}`);
      console.log(`原始baseURL: ${originalBaseURL} -> 新baseURL: ${newBaseURL}`);
    }
  }
  return config;
}, error => {
  console.error('请求拦截器错误:', error);
  return Promise.reject(error);
});

// 响应拦截器
api.interceptors.response.use(response => {
  if (DEBUG) {
    console.log(`响应成功: ${response.config.method.toUpperCase()} ${response.config.url}`, 
      { status: response.status, headers: response.headers });
  }
  return response;
}, error => {
  if (DEBUG) {
    console.error('API请求失败:', {
      url: error.config?.url,
      method: error.config?.method,
      baseURL: error.config?.baseURL,
      headers: error.config?.headers,
      status: error.response?.status,
      message: error.message
    });
  }
  return Promise.reject(error);
});

// 搜索文档
export const searchDocuments = async (query, options = {}) => {
  try {
    const { language = 'zh_CN', limit = 10, offset = 0, filter = {} } = options;
    
    // 构建查询参数
    const params = {
      query,
      limit,
      offset,
    };
    
    // 添加筛选条件
    if (Object.keys(filter).length > 0) {
      params.filter = JSON.stringify(filter);
    }
    
    const response = await api.get('/search', { params });
    return response.data;
  } catch (error) {
    console.error('搜索文档失败:', error);
    throw error;
  }
};

// 获取单个文档详情
export const getDocument = async (id, index = 'documents') => {
  try {
    if (!id) {
      throw new Error('文档ID不能为空');
    }
    
    console.log(`[API] 尝试获取文档: ${id}`);
    const startTime = Date.now();
    
    const response = await api.get(`/documents/${id}`, {
      timeout: 15000, // 增加超时时间到15秒
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    const endTime = Date.now();
    console.log(`[API] 获取文档成功: ${id}, 耗时: ${endTime - startTime}ms`);
    
    return response.data;
  } catch (error) {
    const errorInfo = {
      url: `/documents/${id}`,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    };
    
    console.error(`[API] 获取文档失败: ${id}`, errorInfo);
    
    // 丰富错误信息后再抛出
    if (error.response) {
      error.documentId = id;
      error.errorDetails = errorInfo;
    }
    
    throw error;
  }
};

// 获取筛选器选项
export const getFilterOptions = async (index = 'documents') => {
  try {
    const response = await api.get('/filters', { params: { index } });
    return response.data;
  } catch (error) {
    console.error('获取筛选器选项失败:', error);
    throw error;
  }
};

// 缓存volumes数据
let volumesCache = null;
let volumesCacheTime = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

// 获取课程目录，带缓存
export const getVolumes = async () => {
  try {
    // 检查缓存是否有效
    const now = Date.now();
    if (volumesCache && volumesCacheTime && (now - volumesCacheTime < CACHE_DURATION)) {
      console.log('使用缓存的volumes数据');
      return volumesCache;
    }
    
    console.log('生成volumes数据');
    
    // 从本地数据生成格式化的课程数据
    const formattedVolumes = Object.entries(directory.categories).map(([categoryId, category]) => {
      // 获取并处理该分类下的所有课程
      const courses = Object.entries(category.courses).map(([courseId, course]) => {
        return {
          id: courseId,
          title: course.title,
          titleTw: course.titleTw,
          files: course.files,
          firstDocumentId: `${courseId}-0001` // 直接使用固定格式
        };
      });
      
      // 生成该分类下所有文档的ID列表
      const files = [];
      for (let i = 1; i <= 50; i++) { // 假设每个课程最多有50个文档
        courses.forEach(course => {
          if (i <= course.files) {
            // 生成文档ID，格式为：课程ID-文档序号（4位数字）
            const docId = `${course.id}-${i.toString().padStart(4, '0')}`;
            files.push(docId);
          }
        });
      }
      
      return {
        id: categoryId,
        name: category.name,
        nameTw: category.nameTw,
        title: category.name, // 添加title属性
        count: courses.length,
        courses,
        files // 添加files属性，包含所有文档ID
      };
    });
    
    // 更新缓存
    volumesCache = formattedVolumes;
    volumesCacheTime = now;
    
    return formattedVolumes;
  } catch (error) {
    console.error('获取课程目录失败:', error);
    
    // 如果有缓存，在出错时使用缓存数据
    if (volumesCache) {
      console.log('出错时使用缓存数据');
      return volumesCache;
    }
    
    throw error;
  }
};

export default api;

// 分类映射
export const categoryMap = {
  '01': { name: '阿弥陀经', nameTw: '阿彌陀經' },
  '02': { name: '无量寿经', nameTw: '無量壽經' },
  '03': { name: '观无量寿佛经', nameTw: '觀無量壽佛經' },
  '04': { name: '普贤行愿品', nameTw: '普賢行願品' },
  '05': { name: '大势至念佛圆通章', nameTw: '大勢至念佛圓通章' },
  '06': { name: '往生论', nameTw: '往生論' },
  '07': { name: '楞严经', nameTw: '楞嚴經' },
  '08': { name: '法华经', nameTw: '法華經' },
  '09': { name: '般若部', nameTw: '般若部' },
  '12': { name: '华严宗', nameTw: '華嚴宗' },
  '13': { name: '净土宗(念佛法门)', nameTw: '淨土宗(念佛法門)' },
  '14': { name: '地藏法门', nameTw: '地藏法門' },
  '15': { name: '其他经论', nameTw: '其他經論' },
  '16': { name: '三皈依', nameTw: '三皈依' },
  '17': { name: '认识佛教', nameTw: '認識佛教' },
  '18': { name: '佛法、人生', nameTw: '佛法、人生' },
  '19': { name: '因果类', nameTw: '因果類' },
  '20': { name: '著述、语录', nameTw: '著述、語錄' },
  '21': { name: '专题演讲、访谈', nameTw: '專題演講、訪談' },
  '22': { name: '基础佛学', nameTw: '基礎佛學' },
  '23': { name: '净土培训', nameTw: '淨土培訓' },
  '24': { name: '电台弘法', nameTw: '電台弘法' },
  '25': { name: '各地活动', nameTw: '各地活動' },
  '26': { name: '宗教典籍', nameTw: '宗教典籍' },
  '28': { name: '仁爱和平讲堂', nameTw: '仁愛和平講堂' },
  '32': { name: '地区开示、致词、讲话、一般会客', nameTw: '地區開示、致詞、講話、一般會客' }
}; 