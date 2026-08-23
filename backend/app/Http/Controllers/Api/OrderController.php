<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class OrderController extends Controller
{
    /**
     * Display a listing of orders, newest first.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Order::query();

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        $orders = $query->with('items')->orderByDesc('date')->get();

        return ApiResponse::ok($orders->map(fn (Order $o) => $o->toApi()));
    }

    /**
     * Store a newly created order (placed at checkout).
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'id' => ['nullable', 'string', 'max:60'],
            'date' => ['nullable', 'date'],
            'shippingDetails' => ['required', 'array'],
            'shippingDetails.fullName' => ['required', 'string', 'max:255'],
            'shippingDetails.email' => ['required', 'email', 'max:255'],
            'shippingDetails.phone' => ['required', 'string', 'max:40'],
            'shippingDetails.address' => ['required', 'string', 'max:255'],
            'shippingDetails.city' => ['required', 'string', 'max:120'],
            'shippingDetails.state' => ['required', 'string', 'max:120'],
            'shippingDetails.zipCode' => ['required', 'string', 'max:20'],
            'shippingDetails.country' => ['required', 'string', 'max:120'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product' => ['required', 'array'],
            'items.*.selectedStorage' => ['nullable', 'string', 'max:40'],
            'items.*.selectedColor.name' => ['nullable', 'string', 'max:60'],
            'items.*.selectedColor.hex' => ['nullable', 'string', 'max:20'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'items.*.warrantySelected' => ['nullable', 'boolean'],
            'items.*.warrantyPrice' => ['nullable', 'integer', 'min:0'],
            'subtotal' => ['required', 'integer', 'min:0'],
            'discount' => ['nullable', 'integer', 'min:0'],
            'shippingFee' => ['nullable', 'integer', 'min:0'],
            'tax' => ['nullable', 'integer', 'min:0'],
            'totalAmount' => ['required', 'integer', 'min:0'],
            'paymentMethod' => ['required', 'string', 'max:60'],
            'appliedPromo' => ['nullable', 'string', 'max:60'],
        ]);

        $order = Order::create([
            'id' => $validated['id'] ?? $this->generateOrderId(),
            'date' => $validated['date'] ?? now(),
            'shipping_details' => $validated['shippingDetails'],
            'subtotal' => (int) $validated['subtotal'],
            'discount' => (int) ($validated['discount'] ?? 0),
            'shipping_fee' => (int) ($validated['shippingFee'] ?? 0),
            'tax' => (int) ($validated['tax'] ?? 0),
            'total_amount' => (int) $validated['totalAmount'],
            'status' => 'Pending',
            'payment_method' => $validated['paymentMethod'],
            'tracking_number' => null,
            'applied_promo' => $validated['appliedPromo'] ?? null,
        ]);

        foreach ($validated['items'] as $item) {
            OrderItem::create([
                'order_id' => $order->id,
                'product_id' => $item['product']['id'] ?? null,
                'product_name' => $item['product']['name'] ?? 'Unknown Product',
                'unit_price' => (int) ($item['product']['price'] ?? 0),
                'selected_storage' => $item['selectedStorage'] ?? null,
                'color_name' => $item['selectedColor']['name'] ?? null,
                'color_hex' => $item['selectedColor']['hex'] ?? null,
                'quantity' => (int) $item['quantity'],
                'warranty_selected' => (bool) ($item['warrantySelected'] ?? false),
                'warranty_price' => (int) ($item['warrantyPrice'] ?? 0),
                'image' => $item['product']['image'] ?? null,
            ]);
        }

        return ApiResponse::ok($order->load('items')->toApi(), 201);
    }

    /**
     * Update the specified order (PATCH status / tracking).
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $order = Order::find($id);

        if (! $order) {
            return ApiResponse::error('Order not found', 404);
        }

        $validated = $request->validate([
            'status' => ['nullable', Rule::in(['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'])],
            'trackingNumber' => ['nullable', 'string', 'max:120'],
        ]);

        $order->update([
            'status' => $validated['status'] ?? $order->status,
            'tracking_number' => $validated['trackingNumber'] ?? $order->tracking_number,
        ]);

        return ApiResponse::ok($order->load('items')->toApi());
    }

    private function generateOrderId(): string
    {
        return 'MX-'.random_int(10000, 99999);
    }
}
