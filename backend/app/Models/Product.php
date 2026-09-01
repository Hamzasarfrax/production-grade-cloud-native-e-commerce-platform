<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * @property string $id
 * @property string $name
 * @property string $brand
 * @property string $model
 * @property string $os
 * @property int $price
 * @property int $original_price
 * @property float $rating
 * @property int $reviews_count
 * @property int $in_stock
 * @property array $storage_options
 * @property array $color_options
 * @property string $ram
 * @property string $battery
 * @property string $camera
 * @property string $processor
 * @property string $display
 * @property string $image
 * @property array $images
 * @property string $condition
 * @property bool $is_5g
 * @property bool $is_featured
 * @property bool $is_best_seller
 * @property string $description
 * @property array $specs
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'id', 'name', 'brand', 'model', 'os', 'price', 'original_price', 'rating', 'reviews_count',
    'in_stock', 'storage_options', 'color_options', 'ram', 'battery', 'camera', 'processor',
    'display', 'image', 'images', 'condition', 'is_5g', 'is_featured', 'is_best_seller',
    'description', 'specs',
])]
class Product extends Model
{
    public $incrementing = false;

    protected $keyType = 'string';

    protected function casts(): array
    {
        return [
            'price' => 'integer',
            'original_price' => 'integer',
            'rating' => 'float',
            'reviews_count' => 'integer',
            'in_stock' => 'integer',
            'storage_options' => 'array',
            'color_options' => 'array',
            'images' => 'array',
            'is_5g' => 'boolean',
            'is_featured' => 'boolean',
            'is_best_seller' => 'boolean',
            'specs' => 'array',
        ];
    }

    /**
     * Serialize to the API shape the frontend PhoneProduct type expects.
     *
     * @return array<string, mixed>
     */
    public function toApi(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'brand' => $this->brand,
            'model' => $this->model,
            'os' => $this->os,
            'price' => $this->price,
            'originalPrice' => $this->original_price,
            'rating' => (float) $this->rating,
            'reviewsCount' => $this->reviews_count,
            'inStock' => $this->in_stock,
            'storageOptions' => $this->storage_options,
            'colorOptions' => $this->color_options,
            'ram' => $this->ram,
            'battery' => $this->battery,
            'camera' => $this->camera,
            'processor' => $this->processor,
            'display' => $this->display,
            'image' => $this->image,
            'images' => $this->images,
            'condition' => $this->condition,
            'is5G' => (bool) $this->is_5g,
            'isFeatured' => (bool) $this->is_featured,
            'isBestSeller' => (bool) $this->is_best_seller,
            'description' => $this->description,
            'specs' => $this->specs,
        ];
    }
}
