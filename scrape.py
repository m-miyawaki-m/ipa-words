import csv
import re
import time
import sys
from pathlib import Path

import requests
from bs4 import BeautifulSoup

INPUT_FILE = Path("input/ap-shiken-pages.txt")
OUTPUT_FILE = Path("output/ap-shiken-terms.csv")
BASE_URL = "https://www.ap-siken.com"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
}

CSV_COLUMNS = [
    "URL",
    "大分類番号",
    "中分類番号",
    "用語名",
    "読み",
    "英語",
    "カテゴリ",
    "サブカテゴリ",
    "説明",
]


def parse_url(url: str) -> tuple[str, str]:
    """URLパスから大分類番号・中分類番号を抽出する。"""
    match = re.search(r"/keyword/(\d+)/([\d-]+)/", url)
    if match:
        return match.group(1), match.group(2)
    return "", ""


def scrape_page(url: str) -> list[dict]:
    """1ページ分のterm-articleをすべて取得してリストで返す。"""
    major, minor = parse_url(url)

    resp = requests.get(url, headers=HEADERS, timeout=30)
    resp.raise_for_status()
    resp.encoding = resp.apparent_encoding

    soup = BeautifulSoup(resp.text, "html.parser")
    articles = soup.select(".term-article")

    rows = []
    for article in articles:
        # 用語名
        title_el = article.select_one(".term-article__title")
        term_name = title_el.get_text(strip=True) if title_el else ""

        # メタ情報（読み・英語・カテゴリ）
        reading = ""
        english = ""
        category = ""
        subcategory = ""

        meta_el = article.select_one(".term-article__meta")
        if meta_el:
            for li in meta_el.select("li"):
                text = li.get_text(strip=True)
                if text.startswith("読み"):
                    reading = text.replace("読み：", "").replace("読み:", "").strip()
                elif text.startswith("英語"):
                    english = text.replace("英語：", "").replace("英語:", "").strip()
                else:
                    # カテゴリリンク
                    links = li.select("a")
                    if len(links) >= 1:
                        category = links[0].get_text(strip=True)
                    if len(links) >= 2:
                        subcategory = links[1].get_text(strip=True)

        # 説明文
        body_el = article.select_one(".term-article__body")
        description = ""
        if body_el:
            description = body_el.get_text(strip=True)

        rows.append({
            "URL": url,
            "大分類番号": major,
            "中分類番号": minor,
            "用語名": term_name,
            "読み": reading,
            "英語": english,
            "カテゴリ": category,
            "サブカテゴリ": subcategory,
            "説明": description,
        })

    return rows


def main():
    urls = [
        line.strip()
        for line in INPUT_FILE.read_text().splitlines()
        if line.strip()
    ]

    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)

    all_rows = []
    total = len(urls)

    for i, url in enumerate(urls, 1):
        print(f"[{i}/{total}] {url}")
        try:
            rows = scrape_page(url)
            all_rows.extend(rows)
            print(f"  -> {len(rows)} 用語取得")
        except Exception as e:
            print(f"  -> ERROR: {e}", file=sys.stderr)

        # サーバー負荷軽減のため1秒待機
        if i < total:
            time.sleep(1)

    # CSV書き出し
    with open(OUTPUT_FILE, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=CSV_COLUMNS)
        writer.writeheader()
        writer.writerows(all_rows)

    print(f"\n完了: {len(all_rows)} 用語 -> {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
