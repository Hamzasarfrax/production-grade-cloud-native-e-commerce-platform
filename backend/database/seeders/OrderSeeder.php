<?php

namespace Database\Seeders;

use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Database\Seeder;

class OrderSeeder extends Seeder
{
    /**
     * Seed data mirrors frontend/src/data/mockData.ts (INITIAL_ORDERS).
     */
    public function run(): void
    {
        $orders = [
            [
                'id' => 'MX-98214',
                'date' => '2026-08-11',
                'shipping_details' => [
                    'fullName' => 'Alexander Wright',
                    'email' => 'alex.wright@techmail.com',
                    'phone' => '+1 (555) 234-5678',
                    'address' => '742 Evergreen Terrace',
                    'city' => 'Springfield',
                    'state' => 'IL',
                    'zipCode' => '62704',
                    'country' => 'United States',
                ],
                'subtotal' => 1299,
                'discount' => 50,
                'shipping_fee' => 0,
                'tax' => 102,
                'total_amount' => 1350,
                'status' => 'Processing',
                'payment_method' => 'Credit/Debit Card',
                'tracking_number' => 'MXEXP9821443US',
                'applied_promo' => 'MXWELCOME50',
                'items' => [
                    [
                        'product_id' => 'prod-iphone-16-pro-max',
                        'product_name' => 'Apple iPhone 16 Pro Max',
                        'unit_price' => 1299,
                        'selected_storage' => '512GB',
                        'color_name' => 'Desert Titanium',
                        'color_hex' => '#c5b59f',
                        'quantity' => 1,
                        'warranty_selected' => true,
                        'warranty_price' => 99,
                        'image' => 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80',
                    ],
                ],
            ],
            [
                'id' => 'MX-98212',
                'date' => '2026-08-10',
                'shipping_details' => [
                    'fullName' => 'Sophia Chen',
                    'email' => 'sophia.chen@designhub.io',
                    'phone' => '+1 (555) 876-5432',
                    'address' => '101 Market Street, Suite 400',
                    'city' => 'San Francisco',
                    'state' => 'CA',
                    'zipCode' => '94105',
                    'country' => 'United States',
                ],
                'subtotal' => 1299,
                'discount' => 0,
                'shipping_fee' => 0,
                'tax' => 103,
                'total_amount' => 1402,
                'status' => 'Shipped',
                'payment_method' => 'Apple Pay',
                'tracking_number' => 'MXEXP9821211US',
                'applied_promo' => null,
                'items' => [
                    [
                        'product_id' => 'prod-galaxy-s25-ultra',
                        'product_name' => 'Samsung Galaxy S25 Ultra',
                        'unit_price' => 1299,
                        'selected_storage' => '256GB',
                        'color_name' => 'Titanium Blue',
                        'color_hex' => '#4a627a',
                        'quantity' => 1,
                        'warranty_selected' => false,
                        'warranty_price' => 0,
                        'image' => 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=800&q=80',
                    ],
                ],
            ],
            [
                'id' => 'MX-98205',
                'date' => '2026-08-08',
                'shipping_details' => [
                    'fullName' => 'David K. Vance',
                    'email' => 'david.vance@gmail.com',
                    'phone' => '+1 (555) 432-1098',
                    'address' => '350 Fifth Avenue',
                    'city' => 'New York',
                    'state' => 'NY',
                    'zipCode' => '10118',
                    'country' => 'United States',
                ],
                'subtotal' => 1099,
                'discount' => 100,
                'shipping_fee' => 0,
                'tax' => 85,
                'total_amount' => 1163,
                'status' => 'Delivered',
                'payment_method' => 'Google Pay',
                'tracking_number' => 'MXEXP9820588US',
                'applied_promo' => 'PIXELPRO100',
                'items' => [
                    [
                        'product_id' => 'prod-google-pixel-9-pro',
                        'product_name' => 'Google Pixel 9 Pro XL',
                        'unit_price' => 1099,
                        'selected_storage' => '256GB',
                        'color_name' => 'Porcelain',
                        'color_hex' => '#f2f0ea',
                        'quantity' => 1,
                        'warranty_selected' => true,
                        'warranty_price' => 79,
                        'image' => 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=800&q=80',
                    ],
                ],
            ],
        ];

        foreach ($orders as $order) {
            $items = $order['items'];
            unset($order['items']);

            $orderModel = Order::updateOrCreate(['id' => $order['id']], $order);

            foreach ($items as $item) {
                OrderItem::updateOrCreate(
                    ['order_id' => $order['id'], 'product_id' => $item['product_id'], 'selected_storage' => $item['selected_storage']],
                    $item,
                );
            }
        }
    }
}
