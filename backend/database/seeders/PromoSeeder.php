<?php

namespace Database\Seeders;

use App\Models\PromoCode;
use Illuminate\Database\Seeder;

class PromoSeeder extends Seeder
{
    /**
     * Seed data mirrors frontend/src/data/mockData.ts (INITIAL_PROMOS).
     */
    public function run(): void
    {
        $promos = [
            ['code' => 'MXWELCOME50', 'discount_type' => 'fixed', 'discount_value' => 50, 'min_spend' => 500, 'active' => true],
            ['code' => 'IPHONEPRO100', 'discount_type' => 'fixed', 'discount_value' => 100, 'min_spend' => 999, 'active' => true],
            ['code' => 'ANDROID10', 'discount_type' => 'percentage', 'discount_value' => 10, 'min_spend' => 300, 'active' => true],
        ];

        foreach ($promos as $promo) {
            PromoCode::updateOrCreate(['code' => $promo['code']], $promo);
        }
    }
}
