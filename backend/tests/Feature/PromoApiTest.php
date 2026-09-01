<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PromoApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_create_and_list_promo(): void
    {
        $this->postJson('/api/promos', [
            'code' => 'eid-sale',
            'discountType' => 'percentage',
            'discountValue' => 15,
            'minSpend' => 100000,
        ])
            ->assertStatus(201)
            ->assertJsonPath('data.code', 'EID-SALE')
            ->assertJsonPath('data.discountType', 'percentage');

        $this->getJson('/api/promos')
            ->assertStatus(200)
            ->assertJsonCount(1, 'data');
    }

    public function test_duplicate_promo_code_is_rejected(): void
    {
        $payload = [
            'code' => 'EID-SALE',
            'discountType' => 'fixed',
            'discountValue' => 5000,
        ];

        $this->postJson('/api/promos', $payload)->assertStatus(201);
        $this->postJson('/api/promos', $payload)
            ->assertStatus(422)
            ->assertJsonValidationErrors('code');
    }

    public function test_percentage_value_must_be_positive(): void
    {
        $this->postJson('/api/promos', [
            'code' => 'BAD',
            'discountType' => 'percentage',
            'discountValue' => 0,
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('discountValue');
    }
}
