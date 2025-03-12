import Document, { Html, Head, Main, NextScript } from 'next/document';
import { ServerStyleSheet } from 'styled-components';

export default class MyDocument extends Document {
  static async getInitialProps(ctx) {
    const sheet = new ServerStyleSheet();
    const originalRenderPage = ctx.renderPage;

    try {
      ctx.renderPage = () =>
        originalRenderPage({
          enhanceApp: (App) => (props) => sheet.collectStyles(<App {...props} />),
          enhanceComponent: (Component) => (props) => sheet.collectStyles(<Component {...props} />),
        });

      const initialProps = await Document.getInitialProps(ctx);

      return {
        ...initialProps,
        styles: (
          <>
            {initialProps.styles}
            {sheet.getStyleElement()}
          </>
        ),
      };
    } catch (error) {
      console.error('styled-components SSR error:', error);
      // 确保在出错时也能正常渲染
      const initialProps = await Document.getInitialProps(ctx);
      return {
        ...initialProps,
        styles: initialProps.styles,
      };
    } finally {
      sheet.seal();
    }
  }

  render() {
    return (
      <Html lang="zh">
        <Head>
          <meta charSet="utf-8" />
          <meta name="emotion-insertion-point" content="" />
          {/* Add styled-components registry */}
          {this.props.styles}
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
} 