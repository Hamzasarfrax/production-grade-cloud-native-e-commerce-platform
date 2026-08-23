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
        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->string('order_id');
            $table->string('product_id')->nullable();
            $table->string('product_name');
            $table->integer('unit_price')->default(0);
            $table->string('selected_storage')->nullable();
            $table->string('color_name')->nullable();
            $table->string('color_hex')->nullable();
            $table->integer('quantity')->default(1);
            $table->boolean('warranty_selected')->default(false);
            $table->integer('warranty_price')->default(0);
            $table->string('image')->nullable();
            $table->timestamps();

            $table->foreign('order_id')->references('id')->on('orders')->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('order_items');
    }
};
