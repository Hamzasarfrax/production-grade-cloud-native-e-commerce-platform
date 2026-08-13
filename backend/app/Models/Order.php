<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property string $id
 * @property Carbon $date
 * @property array $shipping_details
 * @property int $subtotal
 * @property int $discount
 * @property int $shipping_fee
 * @property int $tax
 * @property int $total_amount
 * @property string $status
 * @property string $payment_method
 * @property string|null $tracking_number
 * @property string|null $applied_promo
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'id', 'date', 'shipping_details', 'subtotal', 'discount', 'shipping_fee', 'tax',
    'total_amount', 'status', 'payment_method', 'tracking_number', 'applied_promo',
])]
class Order extends Model
{
    public $incrementing = false;

    protected $keyType = 'string';

    protected function casts(): array
    {
        return [
            'date' => 'datetime',
            'shipping_details' => 'array',
            'subtotal' => 'integer',
            'discount' => 'integer',
            'shipping_fee' => 'integer',
            'tax' => 'integer',
            'total_amount' => 'integer',
        ];
    }

    /**
     * Line items attached to this order.
     *
     * @return HasMany<OrderItem, $this>
     */
    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class, 'order_id');
    }

    /**
     * Serialize to the API shape the frontend Order type expects.
     *
     * @return array<string, mixed>
     */
    public function toApi(): array
    {
        $this->load('items');

        return [
            'id' => $this->id,
            'date' => $this->date?->toDateString(),
            'shippingDetails' => $this->shipping_details,
            'items' => $this->items->map(fn (OrderItem $item) => $item->toApi())->values()->all(),
            'subtotal' => $this->subtotal,
            'discount' => $this->discount,
            'shippingFee' => $this->shipping_fee,
            'tax' => $this->tax,
            'totalAmount' => $this->total_amount,
            'status' => $this->status,
            'paymentMethod' => $this->payment_method,
            'trackingNumber' => $this->tracking_number,
            'appliedPromo' => $this->applied_promo,
        ];
    }
}