/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    'antd',
    '@ant-design/icons',
    '@ant-design/icons-svg',
    'rc-util',
    'rc-pagination',
    'rc-picker',
    'rc-tree',
    'rc-table',
    'rc-input',
    'rc-field-form',
    'rc-checkbox',
    'rc-menu',
    'rc-dropdown',
    'rc-virtual-list',
    'rc-trigger',
    'rc-tooltip',
    'rc-dialog',
    'rc-drawer',
    '@rc-component/trigger',
    '@babel/runtime'
  ],
  webpack: (config) => {
    return config;
  },
  serverRuntimeConfig: {
    port: parseInt(process.env.PORT, 10) || 5500
  },
  publicRuntimeConfig: {
    port: parseInt(process.env.PORT, 10) || 5500,
    appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5500'
  }
}

module.exports = nextConfig 