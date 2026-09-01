<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderApiTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return array<string, mixed>
     */
    private function orderPayload(array $overrides = []): array
    {
        return array_merge([
            'id' => 'MX-70001',
            'shippingDetails' => [
                'fullName' => 'Ali Raza',
                'email' => 'ali@example.com',
                'phone' => '0300-1234567',
                'address' => 'Street 1',
                'city' => 'Lahore',
                'state' => 'Punjab',
                'zipCode' => '54000',
                'country' => 'Pakistan',
            ],
            'items' => [[
                'product' => ['id' => 'p-1', 'name' => 'Pixel 8', 'price' => 250000, 'image' => ''],
                'quantity' => 2,
                'warrantySelected' => true,
                'warrantyPrice' => 15000,
            ]],
            'subtotal' => 500000,
            'totalAmount' => 515000,
            'paymentMethod' => 'Cash on Delivery',
        ], $overrides);
    }

    public function test_can_place_order_with_items(): void
    {
        $response = $this->postJson('/api/orders', $this->orderPayload());

        $response->assertStatus(201)
            ->assertJsonPath('ok', true)
            ->assertJsonPath('data.id', 'MX-70001')
            ->assertJsonPath('data.status', 'Pending')
            ->assertJsonCount(1, 'data.items');

        $this->assertDatabaseCount('orders', 1);
        $this->assertDatabaseCount('order_items', 1);
        $this->assertDatabaseHas('order_items', [
            'order_id' => 'MX-70001',
            'product_name' => 'Pixel 8',
            'quantity' => 2,
        ]);
    }

    public function test_order_requires_shipping_and_items(): void
    {
        $this->postJson('/api/orders', ['paymentMethod' => 'Card'])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['shippingDetails', 'items', 'subtotal', 'totalAmount']);
    }

    public function test_can_update_order_status_and_track(): void
    {
        $this->postJson('/api/orders', $this->orderPayload())->assertStatus(201);

        $this->patchJson('/api/orders/MX-70001', [
            'status' => 'Shipped',
            'trackingNumber' => 'TRK-001',
        ])
            ->assertStatus(200)
            ->assertJsonPath('data.status', 'Shipped')
            ->assertJsonPath('data.trackingNumber', 'TRK-001');
    }

    public function test_can_filter_orders_by_status(): void
    {
        $this->postJson('/api/orders', $this->orderPayload())
            ->assertStatus(201);

        $this->getJson('/api/orders?status=Pending')
            ->assertStatus(200)
            ->assertJsonCount(1, 'data');

        $this->getJson('/api/orders?status=Delivered')
            ->assertStatus(200)
            ->assertJsonCount(0, 'data');
    }
}
