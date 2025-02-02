module.exports = {
  webpack: (config, { dev }) => {
    if (dev) {
      config.devtool = 'cheap-module-source-map';
      config.optimization.minimize = false;
    }
    config.resolve.alias = {
      ...config.resolve.alias,
      'rc-util/es': 'rc-util/lib',
      'rc-picker/es': 'rc-picker/lib',
      'rc-input/es': 'rc-input/lib',
      '@ant-design/icons-svg/es': '@ant-design/icons-svg/lib'
    }
    return config
  }
} 