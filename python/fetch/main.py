import asyncio
from crawl4ai import AsyncWebCrawler, CrawlerRunConfig


async def fetch(url: str):
    config = CrawlerRunConfig(scan_full_page=True, scroll_delay=0.2)

    async with AsyncWebCrawler() as crawler:
        result = await crawler.arun(url=url, config=config)
        return result.markdown


async def main():
    markdown = await fetch(url="https://ref.tools/")
    print(markdown)


if __name__ == "__main__":
    asyncio.run(main())
