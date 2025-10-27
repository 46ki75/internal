import asyncio
from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig

async def fetch(url: str):
    browser_config = BrowserConfig(
        headless=True,
        verbose=True,
        extra_args=[
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--disable-software-rasterizer',
            '--single-process',
            '--no-zygote'
        ]
    )
    
    # クローラー実行設定
    run_config = CrawlerRunConfig(
        scan_full_page=True,
        scroll_delay=0.01
    )
    
    async with AsyncWebCrawler(config=browser_config) as crawler:
        result = await crawler.arun(url=url, config=run_config)
        return result.markdown


def handler(event, context):
    url = event.get('url')

    markdown = asyncio.run(fetch(url))
    
    return {
        'statusCode': 200,
        'body': markdown
    }



async def main():
    markdown = await fetch(url="https://example.com")
    print(markdown)


if __name__ == "__main__":
    asyncio.run(main())
