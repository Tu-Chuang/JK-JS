import { NextResponse } from 'next/server';

// 在所有请求上添加CORS和日志
export function middleware(req) {
  const { pathname } = req.nextUrl;
  
  // 添加基本请求日志
  console.log(`[${new Date().toISOString()}] ${req.method} ${pathname}`);
  
  // 只处理API请求
  if (pathname.startsWith('/api/')) {
    const response = NextResponse.next();
    
    // 添加CORS头部
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    
    // 预检请求处理
    if (req.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type,Authorization',
          'Access-Control-Max-Age': '86400'
        }
      });
    }
    
    return response;
  }
  
  return NextResponse.next();
}

// 只在API路由上应用中间件
export const config = {
  matcher: '/api/:path*',
}; 