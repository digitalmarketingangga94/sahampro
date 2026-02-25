import { NextRequest, NextResponse } from 'next/server';
import { fetchTopStocks, getDominantBuyBroker } from '@/lib/stockbit'; // Import new function
import type { TopStockItem } from '@/lib/types'; // Import TopStockItem

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const investorType = searchParams.get('investorType') || 'INVESTOR_TYPE_ALL';
    const marketType = searchParams.get('marketType') || 'MARKET_BOARD_REGULER';
    const valueType = searchParams.get('valueType') || 'VALUE_TYPE_NET';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '100');

    if (!startDate || !endDate) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters: startDate, endDate' },
        { status: 400 }
      );
    }

    const topStocksResponse = await fetchTopStocks(
      startDate,
      endDate,
      investorType,
      marketType,
      valueType,
      page,
      limit
    );

    const topBuyData = topStocksResponse.data.top_buy || [];
    const topSellData = topStocksResponse.data.top_sell || [];

    // Function to process a list of TopStockItems
    const processTopStockItems = async (items: TopStockItem[]) => {
      return Promise.all(items.map(async (item) => {
        const dominantBuyBroker = await getDominantBuyBroker(item.code, startDate, endDate);
        return {
          ...item,
          dominantBuyBroker,
        };
      }));
    };

    const processedTopBuyData = await processTopStockItems(topBuyData);
    const processedTopSellData = await processTopStockItems(topSellData);


    return NextResponse.json({
      success: true,
      data: {
        top_buy: processedTopBuyData,
        top_sell: processedTopSellData,
      },
    });
  } catch (error) {
    console.error('Top Stock API error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch top stock data' },
      { status: 500 }
    );
  }
}