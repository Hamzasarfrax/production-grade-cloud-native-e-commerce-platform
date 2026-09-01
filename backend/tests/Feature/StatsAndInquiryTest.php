<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StatsAndInquiryTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_create_inquiry_via_contact_form(): void
    {
        $response = $this->postJson('/api/inquiries', [
            'name' => 'Sara Khan',
            'email' => 'sara@example.com',
            'phone' => '0321-7654321',
            'subject' => 'Trade-in question',
            'message' => 'Do you accept old Galaxy S21 for trade-in?',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('ok', true)
            ->assertJsonPath('data.status', 'New')
            ->assertJsonPath('data.subject', 'Trade-in question');

        $this->assertDatabaseCount('inquiries', 1);
    }

    public function test_inquiry_requires_email_and_message(): void
    {
        $this->postJson('/api/inquiries', ['name' => 'No Contact'])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['email', 'subject', 'message']);
    }

    public function test_stats_aggregate_after_activity(): void
    {
        $this->postJson('/api/products', [
            'id' => 'pixel-8',
            'name' => 'Pixel 8',
            'brand' => 'Google',
            'model' => 'Pixel 8',
            'os' => 'Android',
            'price' => 250000,
            'inStock' => 3,
        ])->assertStatus(201);

        $this->postJson('/api/orders', [
            'id' => 'MX-70002',
            'shippingDetails' => [
                'fullName' => 'Bilal Ahmed',
                'email' => 'bilal@example.com',
                'phone' => '0333-1112223',
                'address' => 'Main Boulevard',
                'city' => 'Karachi',
                'state' => 'Sindh',
                'zipCode' => '75530',
                'country' => 'Pakistan',
            ],
            'items' => [[
                'product' => ['id' => 'pixel-8', 'name' => 'Pixel 8', 'price' => 250000],
                'quantity' => 1,
            ]],
            'subtotal' => 250000,
            'totalAmount' => 250000,
            'paymentMethod' => 'Card',
        ])->assertStatus(201);

        $this->postJson('/api/inquiries', [
            'name' => 'Ayesha M',
            'email' => 'ayesha@example.com',
            'subject' => 'Return policy',
            'message' => 'What is the return window?',
        ])->assertStatus(201);

        $this->getJson('/api/stats')
            ->assertStatus(200)
            ->assertJsonPath('ok', true)
            ->assertJsonPath('data.productsCount', 1)
            ->assertJsonPath('data.ordersCount', 1)
            ->assertJsonPath('data.revenue', 250000)
            ->assertJsonPath('data.avgOrderValue', 250000)
            ->assertJsonPath('data.pendingOrders', 1)
            ->assertJsonPath('data.newInquiries', 1)
            ->assertJsonPath('data.inStockUnits', 3)
            ->assertJsonPath('data.lowStock', 1);
    }
}
