import { NextRequest, NextResponse } from 'next/server';
import { fetchTradeBook, fetchEmitenInfo, fetchOrderbook, fetchMarketDetector, parseLot } from '@/lib/stockbit';
import type { TradeBookCombinedData, TradeBookTotal, TradeBookMarketData } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol')?.toUpperCase();

    if (!symbol) {
      return NextResponse.json(
        { success: false, error: 'Symbol parameter is required' },
        { status: 400 }
      );
    }

    // Get today's date for market detector
    const today = new Date().toISOString().split('T')[0];

    // Fetch all data concurrently
    const [tradeBookTotal, emitenInfo, orderbookData, marketDetectorData] = await Promise.all([
      fetchTradeBook(symbol),
      fetchEmitenInfo(symbol).catch(() => null), // Catch error to allow other fetches to succeed
      fetchOrderbook(symbol).catch(() => null),
      fetchMarketDetector(symbol, today, today).catch(() => null),
    ]);

    if (!tradeBookTotal.book_total) { // Access book_total from the returned object
      return NextResponse.json(
        { success: false, error: 'No trade book data found for this symbol' },
        { status: 404 }
      );
    }

    // Extract market data
    let price: number = 0;
    let change_percentage: number = 0;
    let volume: number = 0;
    let value: number = 0;

    // Prioritize emitenInfo for price and change_percentage
    if (emitenInfo?.data) {
      price = parseFloat(emitenInfo.data.price);
      change_percentage = emitenInfo.data.percentage;
    } else if (orderbookData?.data) {
      // Fallback to orderbook for price if emitenInfo is not available
      price = orderbookData.data.close;
      // Cannot reliably get change_percentage from orderbook without previous close, so keep 0
    }

    // Try to get volume and value from market detector first
    if (marketDetectorData?.data?.bandar_detector) {
      volume = marketDetectorData.data.bandar_detector.volume;
      value = marketDetectorData.data.bandar_detector.value;
    } else if (orderbookData?.data?.total_bid_offer) {
      // Fallback to orderbook for volume if market detector not available
      const totalBidLot = parseLot(orderbookData.data.total_bid_offer.bid.lot);
      const totalOfferLot = parseLot(orderbookData.data.total_bid_offer.offer.lot);
      volume = (totalBidLot + totalOfferLot) * 100; // Convert lots to shares (1 lot = 100 shares)
      // Value is harder to get accurately from orderbook without more complex calculations
      // For now, we'll estimate if price is available
      if (price && volume) {
        value = price * volume; // Simple estimation
      }
    }

    const marketData: TradeBookMarketData = {
      price: price,
      change_percentage: change_percentage,
      volume: volume,
      value: value,
    };

    const combinedData: TradeBookCombinedData = {
      tradeBookTotal: tradeBookTotal.book_total, // Access book_total from the returned object
      marketData: marketData,
    };

    return NextResponse.json({
      success: true,
      data: combinedData,
    });
  } catch (error) {
    console.error('Trade Book API error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch trade book data' },
      { status: 500 }
    );
  }
}