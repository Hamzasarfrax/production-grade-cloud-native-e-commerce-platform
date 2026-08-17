<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $code
 * @property string $discount_type
 * @property int $discount_value
 * @property int $min_spend
 * @property bool $active
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['code', 'discount_type', 'discount_value', 'min_spend', 'active'])]
class PromoCode extends Model
{
    protected function casts(): array
    {
        return [
            'discount_value' => 'integer',
            'min_spend' => 'integer',
            'active' => 'boolean',
        ];
    }

    /**
     * Serialize to the API shape the frontend PromoCode type expects.
     *
     * @return array<string, mixed>
     */
    public function toApi(): array
    {
        return [
            'id' => (int) $this->id,
            'code' => $this->code,
            'discountType' => $this->discount_type,
            'discountValue' => $this->discount_value,
            'minSpend' => $this->min_spend,
            'active' => (bool) $this->active,
        ];
    }
}
