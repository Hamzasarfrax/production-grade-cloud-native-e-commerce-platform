<?php

namespace Tests\Feature;

use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductApiTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return array<string, mixed>
     */
    private function payload(array $overrides = []): array
    {
        return array_merge([
            'id' => 'iphone-15-pro-256',
            'name' => 'iPhone 15 Pro 256GB',
            'brand' => 'Apple',
            'model' => 'iPhone 15 Pro',
            'os' => 'iOS',
            'price' => 349000,
            'inStock' => 12,
            'storageOptions' => ['256GB'],
        ], $overrides);
    }

    /**
     * Every non-nullable model column filled, so direct Product::create works
     * (the HTTP controller does the same camelCase -> snake_case mapping).
     *
     * @return array<string, mixed>
     */
    private function attributes(array $overrides = []): array
    {
        return array_merge([
            'id' => 'seeded-'.fake()->unique()->slug(3),
            'name' => 'Seeded Phone',
            'brand' => 'Apple',
            'model' => 'Seeder',
            'os' => 'iOS',
            'price' => 100,
            'original_price' => 0,
            'rating' => 0,
            'reviews_count' => 0,
            'in_stock' => 1,
            'storage_options' => [],
            'color_options' => [],
            'ram' => '',
            'battery' => '',
            'camera' => '',
            'processor' => '',
            'display' => '',
            'image' => '',
            'images' => [],
            'condition' => 'New',
            'is_5g' => true,
            'is_featured' => false,
            'is_best_seller' => false,
            'description' => '',
            'specs' => [],
        ], $overrides);
    }

    public function test_can_create_product_with_client_id(): void
    {
        $response = $this->postJson('/api/products', $this->payload());

        $response->assertStatus(201)
            ->assertJsonPath('ok', true)
            ->assertJsonPath('data.id', 'iphone-15-pro-256')
            ->assertJsonPath('data.price', 349000);

        $this->assertDatabaseCount('products', 1);
    }

    public function test_can_list_and_filter_products(): void
    {
        Product::create($this->attributes(['id' => 'p-1', 'brand' => 'Samsung']));
        Product::create($this->attributes(['id' => 'p-2', 'brand' => 'Apple']));

        $this->getJson('/api/products')
            ->assertStatus(200)
            ->assertJsonCount(2, 'data');

        $this->getJson('/api/products?brand=Apple')
            ->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.brand', 'Apple');
    }

    public function test_can_update_and_delete_product(): void
    {
        Product::create($this->attributes(['id' => 'iphone-15-pro-256', 'name' => 'Old Name']));

        $this->putJson('/api/products/iphone-15-pro-256', $this->payload(['price' => 299000]))
            ->assertStatus(200)
            ->assertJsonPath('data.price', 299000);

        $this->deleteJson('/api/products/iphone-15-pro-256')
            ->assertStatus(200)
            ->assertJsonPath('data.id', 'iphone-15-pro-256');

        $this->assertDatabaseCount('products', 0);
    }

    public function test_unknown_product_returns_404_envelope(): void
    {
        $this->getJson('/api/products/nope')
            ->assertStatus(404)
            ->assertJson(['ok' => false, 'message' => 'Product not found']);
    }

    public function test_invalid_os_is_rejected_with_422(): void
    {
        $this->postJson('/api/products', $this->payload(['os' => 'Windows']))
            ->assertStatus(422)
            ->assertJsonValidationErrors('os');
    }

    public function test_negative_price_is_rejected_with_422(): void
    {
        $this->postJson('/api/products', $this->payload(['price' => -1]))
            ->assertStatus(422)
            ->assertJsonValidationErrors('price');
    }
}
