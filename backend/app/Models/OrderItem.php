<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property string $order_id
 * @property string|null $product_id
 * @property string $product_name
 * @property int $unit_price
 * @property string|null $selected_storage
 * @property string|null $color_name
 * @property string|null $color_hex
 * @property int $quantity
 * @property bool $warranty_selected
 * @property int $warranty_price
 * @property string|null $image
 */
#[Fillable([
    'order_id', 'product_id', 'product_name', 'unit_price', 'selected_storage',
    'color_name', 'color_hex', 'quantity', 'warranty_selected', 'warranty_price', 'image',
])]
class OrderItem extends Model
{
    protected function casts(): array
    {
        return [
            'unit_price' => 'integer',
            'quantity' => 'integer',
            'warranty_selected' => 'boolean',
            'warranty_price' => 'integer',
        ];
    }

    /**
     * The parent order.
     *
     * @return BelongsTo<Order, $this>
     */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class, 'order_id');
    }

    /**
     * Serialize to the API shape the frontend CartItem type expects (product snapshot).
     *
     * @return array<string, mixed>
     */
    public function toApi(): array
    {
        return [
            'id' => 'item-'.$this->id,
            'product' => [
                'id' => $this->product_id,
                'name' => $this->product_name,
                'image' => $this->image,
                'price' => $this->unit_price,
                'brand' => '',
                'model' => '',
            ],
            'selectedStorage' => $this->selected_storage,
            'selectedColor' => [
                'name' => $this->color_name,
                'hex' => $this->color_hex,
            ],
            'quantity' => $this->quantity,
            'warrantySelected' => (bool) $this->warranty_selected,
            'warrantyPrice' => $this->warranty_price,
        ];
    }
}
