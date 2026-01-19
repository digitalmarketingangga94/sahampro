import { fetchWatchlist, fetchMarketDetector, fetchOrderbook, getTopBroker, fetchEmitenInfo } from '../../lib/stockbit';
import { calculateTargets } from '../../lib/calculations';
import { saveWatchlistAnalysis, updatePreviousDayRealPrice } from '../../lib/supabase';

export default async (req: Request) => {
  const startTime = Date.now();
  console.log('[Background] Starting analysis job...');

  try {
    // Get current date for analysis
    const today = new Date().toISOString().split('T')[0];

    // Fetch watchlist
    const watchlistResponse = await fetchWatchlist();
    const watchlistItems = watchlistResponse.data?.result || [];

    if (watchlistItems.length === 0) {
      console.log('[Background] No watchlist items to analyze');
      return new Response(JSON.stringify({ success: true, message: 'No items' }), { status: 200 });
    }

    const results = [];
    const errors = [];

    // Analyze each watchlist item
    for (const item of watchlistItems) {
      const emiten = item.symbol || item.company_code;
      console.log(`[Background] Analyzing ${emiten}...`);

      try {
        const [marketDetectorData, orderbookData, emitenInfoData] = await Promise.all([
          fetchMarketDetector(emiten, today, today),
          fetchOrderbook(emiten),
          fetchEmitenInfo(emiten).catch(() => null),
        ]);

        const brokerData = getTopBroker(marketDetectorData);
        if (!brokerData) {
          errors.push({ emiten, error: 'No broker data' });
          continue;
        }

        const sector = emitenInfoData?.data?.sector || undefined;
        const obData = orderbookData.data || (orderbookData as any);
        const offerPrices = (obData.offer || []).map((o: any) => Number(o.price));
        const bidPrices = (obData.bid || []).map((b: any) => Number(b.price));

        const marketData = {
          harga: Number(obData.close),
          offerTeratas: offerPrices.length > 0 ? Math.max(...offerPrices) : Number(obData.high || 0),
          bidTerbawah: bidPrices.length > 0 ? Math.min(...bidPrices) : 0,
          totalBid: Number(obData.total_bid_offer.bid.lot.replace(/,/g, '')),
          totalOffer: Number(obData.total_bid_offer.offer.lot.replace(/,/g, '')),
        };

        const calculated = calculateTargets(
          brokerData.rataRataBandar,
          brokerData.barangBandar,
          marketData.offerTeratas,
          marketData.bidTerbawah,
          marketData.totalBid / 100,
          marketData.totalOffer / 100,
          marketData.harga
        );

        await saveWatchlistAnalysis({
          from_date: today,
          to_date: today,
          emiten,
          sector,
          bandar: brokerData.bandar,
          barang_bandar: brokerData.barangBandar,
          rata_rata_bandar: brokerData.rataRataBandar,
          harga: marketData.harga,
          ara: marketData.offerTeratas,
          arb: marketData.bidTerbawah,
          fraksi: calculated.fraksi,
          total_bid: marketData.totalBid,
          total_offer: marketData.totalOffer,
          total_papan: calculated.totalPapan,
          rata_rata_bid_ofer: calculated.rataRataBidOfer,
          a: calculated.a,
          p: calculated.p,
          target_realistis: calculated.targetRealistis1,
          target_max: calculated.targetMax,
          status: 'success'
        });

        try {
          await updatePreviousDayRealPrice(emiten, today, marketData.harga);
        } catch (updateError) {
          console.error(`[Background] Failed to update price for ${emiten}`, updateError);
        }

        results.push({ emiten, status: 'success' });
      } catch (error) {
        console.error(`[Background] Error analyzing ${emiten}:`, error);
        errors.push({ emiten, error: String(error) });
      }
    }

    const duration = (Date.now() - startTime) / 1000;
    console.log(`[Background] Job completed in ${duration}s. Success: ${results.length}, Errors: ${errors.length}`);

    return new Response(JSON.stringify({ success: true, results: results.length, errors: errors.length }), { status: 200 });

  } catch (error) {
    console.error('[Background] Critical error:', error);
    return new Response(JSON.stringify({ success: false, error: String(error) }), { status: 500 });
  }
};
