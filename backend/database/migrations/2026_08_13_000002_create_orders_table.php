<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->timestamp('date')->useCurrent();
            $table->json('shipping_details');
            $table->integer('subtotal')->default(0);
            $table->integer('discount')->default(0);
            $table->integer('shipping_fee')->default(0);
            $table->integer('tax')->default(0);
            $table->integer('total_amount')->default(0);
            $table->string('status')->default('Pending');
            $table->string('payment_method');
            $table->string('tracking_number')->nullable();
            $table->string('applied_promo')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};