<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CustomerInquiry;
use App\Models\Order;
use App\Models\Product;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;

class StatsController extends Controller
{
    /**
     * Aggregate metrics for the admin dashboard.
     */
    public function index(): JsonResponse
    {
        $totalRevenue = (int) Order::sum('total_amount');
        $ordersCount = Order::count();
        $productsCount = Product::count();
        $inStockUnits = (int) Product::sum('in_stock');
        $lowStock = Product::where('in_stock', '<=', 5)->count();
        $newInquiries = CustomerInquiry::where('status', 'New')->count();
        $pendingOrders = Order::where('status', 'Pending')->count();

        $avgOrderValue = $ordersCount > 0 ? (int) round($totalRevenue / $ordersCount) : 0;

        $statusBreakdown = Order::query()
            ->selectRaw('status, COUNT(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        $recentOrders = Order::with('items')->latest('date')->limit(5)->get()
            ->map(fn (Order $o) => $o->toApi());

        $recentInquiries = CustomerInquiry::latest('date')->limit(5)->get()
            ->map(fn (CustomerInquiry $i) => $i->toApi());

        return ApiResponse::ok([
            'revenue' => $totalRevenue,
            'ordersCount' => $ordersCount,
            'productsCount' => $productsCount,
            'inStockUnits' => $inStockUnits,
            'lowStock' => $lowStock,
            'avgOrderValue' => $avgOrderValue,
            'newInquiries' => $newInquiries,
            'pendingOrders' => $pendingOrders,
            'statusBreakdown' => $statusBreakdown,
            'recentOrders' => $recentOrders,
            'recentInquiries' => $recentInquiries,
        ]);
    }
}
