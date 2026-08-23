<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class ProductController extends Controller
{
    /**
     * Display a listing of products, optional brand/search filters.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Product::query();

        if ($brand = $request->query('brand')) {
            $query->where('brand', $brand);
        }

        if ($search = trim((string) $request->query('search'))) {
            $query->where(fn ($q) => $q
                ->where('name', 'like', "%{$search}%")
                ->orWhere('model', 'like', "%{$search}%")
                ->orWhere('brand', 'like', "%{$search}%"));
        }

        if ($featured = $request->boolean('featured')) {
            $query->where('is_featured', true);
        }

        $products = $query->orderBy('name')->get();

        return ApiResponse::ok($products->map(fn (Product $p) => $p->toApi()));
    }

    /**
     * Store a newly created product.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $this->validateProduct($request, null);

        $data = $this->resolveProductAttributes($validated);
        $data['id'] = $validated['id'] ?? 'prod-'.Str::slug($data['name']);

        $product = Product::create($data);

        return ApiResponse::ok($product->toApi(), 201);
    }

    /**
     * Display the specified product.
     */
    public function show(string $id): JsonResponse
    {
        $product = Product::find($id);

        if (! $product) {
            return ApiResponse::error('Product not found', 404);
        }

        return ApiResponse::ok($product->toApi());
    }

    /**
     * Update the specified product.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $product = Product::find($id);

        if (! $product) {
            return ApiResponse::error('Product not found', 404);
        }

        $validated = $this->validateProduct($request, $id);

        $product->update($this->resolveProductAttributes($validated));

        return ApiResponse::ok($product->refresh()->toApi());
    }

    /**
     * Remove the specified product.
     */
    public function destroy(string $id): JsonResponse
    {
        $product = Product::find($id);

        if (! $product) {
            return ApiResponse::error('Product not found', 404);
        }

        $product->delete();

        return ApiResponse::ok(['id' => $id]);
    }

    /**
     * Validate incoming product payload (camelCase body).
     *
     * @return array<string, mixed>
     */
    private function validateProduct(Request $request, ?string $ignoreId): array
    {
        return $request->validate([
            'id' => ['nullable', 'string', 'max:120', Rule::unique('products', 'id')->ignore($ignoreId)],
            'name' => ['required', 'string', 'max:255'],
            'brand' => ['required', 'string', 'max:60'],
            'model' => ['required', 'string', 'max:120'],
            'os' => ['required', Rule::in(['iOS', 'Android'])],
            'price' => ['required', 'integer', 'min:0'],
            'originalPrice' => ['nullable', 'integer', 'min:0'],
            'rating' => ['nullable', 'numeric', 'between:0,5'],
            'reviewsCount' => ['nullable', 'integer', 'min:0'],
            'inStock' => ['nullable', 'integer', 'min:0'],
            'storageOptions' => ['nullable', 'array'],
            'storageOptions.*' => ['string'],
            'colorOptions' => ['nullable', 'array'],
            'colorOptions.*.name' => ['string'],
            'colorOptions.*.hex' => ['string'],
            'ram' => ['nullable', 'string', 'max:60'],
            'battery' => ['nullable', 'string', 'max:120'],
            'camera' => ['nullable', 'string', 'max:255'],
            'processor' => ['nullable', 'string', 'max:120'],
            'display' => ['nullable', 'string', 'max:255'],
            'image' => ['nullable', 'string'],
            'images' => ['nullable', 'array'],
            'images.*' => ['string'],
            'condition' => ['nullable', Rule::in(['New', 'Certified Refurbished'])],
            'is5G' => ['nullable', 'boolean'],
            'isFeatured' => ['nullable', 'boolean'],
            'isBestSeller' => ['nullable', 'boolean'],
            'description' => ['nullable', 'string'],
            'specs' => ['nullable', 'array'],
        ]);
    }

    /**
     * Map camelCase API payload keys to snake_case model columns.
     *
     * @param  array<string, mixed>  $input
     * @return array<string, mixed>
     */
    private function resolveProductAttributes(array $input): array
    {
        return [
            'name' => $input['name'],
            'brand' => $input['brand'],
            'model' => $input['model'],
            'os' => $input['os'],
            'price' => (int) $input['price'],
            'original_price' => (int) ($input['originalPrice'] ?? 0),
            'rating' => (float) ($input['rating'] ?? 0),
            'reviews_count' => (int) ($input['reviewsCount'] ?? 0),
            'in_stock' => (int) ($input['inStock'] ?? 0),
            'storage_options' => $input['storageOptions'] ?? [],
            'color_options' => $input['colorOptions'] ?? [],
            'ram' => $input['ram'] ?? '',
            'battery' => $input['battery'] ?? '',
            'camera' => $input['camera'] ?? '',
            'processor' => $input['processor'] ?? '',
            'display' => $input['display'] ?? '',
            'image' => $input['image'] ?? '',
            'images' => $input['images'] ?? [],
            'condition' => $input['condition'] ?? 'New',
            'is_5g' => (bool) ($input['is5G'] ?? true),
            'is_featured' => (bool) ($input['isFeatured'] ?? false),
            'is_best_seller' => (bool) ($input['isBestSeller'] ?? false),
            'description' => $input['description'] ?? '',
            'specs' => $input['specs'] ?? [],
        ];
    }
}
