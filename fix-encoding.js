const fs = require('fs');
const iconv = require('iconv-lite');

async function fixEncoding() {
  try {
    const filePath = './document/01-001/json/01-001-0001.json';
    
    // 读取文件
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);
    
    // 处理文本内容
    const processedData = {
      ...data,
      content: {
        ...data.content,
        sections: data.content.sections.map(section => ({
          ...section,
          paragraphs: section.paragraphs.map(para => ({
            ...para,
            text: iconv.decode(iconv.encode(para.text, 'utf8'), 'utf8')
          }))
        }))
      }
    };

    // 写回文件
    fs.writeFileSync(
      filePath,
      JSON.stringify(processedData, null, 2),
      { encoding: 'utf8' }
    );

    console.log('文件编码修复完成');
  } catch (error) {
    console.error('处理文件时出错:', error);
  }
}

fixEncoding(); 