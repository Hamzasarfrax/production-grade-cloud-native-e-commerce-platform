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
        Schema::create('products', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('name');
            $table->string('brand');
            $table->string('model');
            $table->string('os');
            $table->integer('price')->default(0);
            $table->integer('original_price')->default(0);
            $table->decimal('rating', 2, 1)->default(0);
            $table->integer('reviews_count')->default(0);
            $table->integer('in_stock')->default(0);
            $table->json('storage_options');
            $table->json('color_options');
            $table->string('ram');
            $table->string('battery');
            $table->string('camera');
            $table->string('processor');
            $table->string('display');
            $table->text('image');
            $table->json('images');
            $table->string('condition')->default('New');
            $table->boolean('is_5g')->default(false);
            $table->boolean('is_featured')->default(false);
            $table->boolean('is_best_seller')->default(false);
            $table->text('description');
            $table->json('specs');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};