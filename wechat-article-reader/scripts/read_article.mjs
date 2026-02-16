import { chromium } from 'playwright';
import TurndownService from 'turndown';

// --- Utility Functions (移植自 wechatCrawler.js) ---
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getRandomUserAgent() {
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59'
  ];
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}

function configureBrowserOptions(options = {}, proxyUrl = null) {
  const browserOptions = { ...options };
  if (proxyUrl) {
    browserOptions.proxy = {
      server: proxyUrl
    };
  }
  return browserOptions;
}

/**
 * Crawl a WeChat article using Playwright and return its Markdown content
 * @param {string} url - URL of the article to crawl
 * @returns {Promise<string>} Article content in Markdown format
 */
async function crawlWeChatArticleAndReturnMarkdown(url) {
  const headless = true;
  const timeout = 60000;
  const waitTime = 3000;
  const proxyUrl = null; // No proxy by default, can be configured later if needed

  const browserOptions = configureBrowserOptions({ headless }, proxyUrl);
  const browser = await chromium.launch(browserOptions);
  
  const context = await browser.newContext({
    userAgent: getRandomUserAgent(),
    viewport: { width: 1280, height: 800 }
  });
  
  const page = await context.newPage();
  
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout });
    await delay(waitTime); // Give dynamic content time to load
    
    // Try to wait for the main content to load
    try {
      await page.waitForSelector('#js_content', { timeout: 10000 });
    } catch (timeoutError) {
      // If #js_content not found, try to check if it's an anti-crawler page
      const title = await page.textContent('title') || '';
      if (title.includes('访问频率过快') || title.includes('验证')) {
        throw new Error('Detected anti-crawler mechanism or too frequent access. Try again later.');
      }
      throw new Error('Main article content selector #js_content not found. Page might be blocked or content structure changed.');
    }
    
    const title = await page.textContent('#activity-name') || '';
    const author = await page.textContent('#js_name') || '';
    
    const contentHtml = await page.evaluate(() => {
      const contentElement = document.querySelector('#js_content');
      if (!contentElement) return '';
      
      const clone = contentElement.cloneNode(true);
      const images = Array.from(clone.querySelectorAll('img'));
      images.forEach(img => {
        if (img.getAttribute('data-src')) {
          img.src = img.getAttribute('data-src');
        }
      });
      return clone.innerHTML;
    });
    
    const turndownService = new TurndownService();
    let markdown = `# ${title}\n\n`;
    if (author) {
      markdown += `**作者：** ${author}\n\n`;
    }
    markdown += turndownService.turndown(contentHtml);
    
    return markdown;
    
  } catch (error) {
    console.error('Error crawling WeChat article:', error.message);
    throw error;
  } finally {
    await browser.close();
  }
}

// --- Main execution block for the skill ---
async function main() {
  const args = process.argv.slice(2); // Get command line arguments
  if (args.length < 2 || args[0] !== 'read') {
    console.error('Usage: read <url>');
    process.exit(1);
  }

  const url = args[1];

  try {
    const markdownContent = await crawlWeChatArticleAndReturnMarkdown(url);
    console.log(markdownContent); // Output Markdown to stdout
  } catch (error) {
    console.error('Failed to read WeChat article:', error.message);
    process.exit(1);
  }
}

main();
