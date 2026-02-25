import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import type { IdxSectorMemberStock } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { symbol: string } }
) {
  try {
    const { symbol } = params;

    if (!symbol) {
      return NextResponse.json(
        { success: false, error: 'Missing symbol parameter' },
        { status: 400 }
      );
    }

    const url = `https://stockbit.com/catalog/indeks-sektoral/${symbol.toUpperCase()}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'en-US,en;q=0.9,id;q=0.8',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Referer': 'https://stockbit.com/',
      },
      cache: 'no-store', // Ensure fresh data
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch HTML for ${symbol}: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const stocks: IdxSectorMemberStock[] = [];

    // Find the table containing the stock list.
    // Based on inspection, it's usually a table with class 'ant-table-tbody'
    // We need to find the specific structure within the HTML.
    // This selector might need adjustment if Stockbit's HTML structure changes.
    $('table.ant-table-tbody tr').each((i, row) => {
      const cells = $(row).find('td');
      if (cells.length >= 6) { // Ensure enough columns are present
        const symbolText = $(cells[0]).find('a').text().trim();
        const nameText = $(cells[1]).text().trim();
        const lastPriceText = $(cells[2]).text().trim().replace(/,/g, '');
        const changeText = $(cells[3]).text().trim().replace(/,/g, '');
        const changePercentageText = $(cells[4]).text().trim().replace(/%/g, '');
        const volumeText = $(cells[5]).text().trim().replace(/,/g, '');
        const valueText = $(cells[6]).text().trim().replace(/,/g, ''); // Assuming value is the 7th column

        if (symbolText && !isNaN(parseFloat(lastPriceText))) {
          stocks.push({
            symbol: symbolText,
            name: nameText,
            last_price: parseFloat(lastPriceText),
            change_point: parseFloat(changeText),
            change_percentage: parseFloat(changePercentageText),
            volume: parseFloat(volumeText),
            value: parseFloat(valueText),
          });
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: stocks,
      indexSymbol: symbol.toUpperCase(),
    });
  } catch (error) {
    console.error(`Error fetching IDX sector members for ${params.symbol}:`, error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch IDX sector members' },
      { status: 500 }
    );
  }
}