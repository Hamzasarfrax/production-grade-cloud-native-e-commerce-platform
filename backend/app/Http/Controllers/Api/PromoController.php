<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PromoCode;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PromoController extends Controller
{
    /**
     * Display a listing of promo codes.
     */
    public function index(): JsonResponse
    {
        $promos = PromoCode::orderBy('code')->get();

        return ApiResponse::ok($promos->map(fn (PromoCode $p) => $p->toApi()));
    }

    /**
     * Store a newly created promo code.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate($this->rules(null));

        $promo = PromoCode::create([
            'code' => strtoupper($validated['code']),
            'discount_type' => $validated['discountType'],
            'discount_value' => (int) $validated['discountValue'],
            'min_spend' => (int) ($validated['minSpend'] ?? 0),
            'active' => (bool) ($validated['active'] ?? true),
        ]);

        return ApiResponse::ok($promo->toApi(), 201);
    }

    /**
     * Update the specified promo code.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $promo = PromoCode::find($id);

        if (! $promo) {
            return ApiResponse::error('Promo code not found', 404);
        }

        $validated = $request->validate($this->rules($promo->id));

        $promo->update([
            'code' => strtoupper($validated['code']),
            'discount_type' => $validated['discountType'],
            'discount_value' => (int) $validated['discountValue'],
            'min_spend' => (int) ($validated['minSpend'] ?? 0),
            'active' => (bool) ($validated['active'] ?? true),
        ]);

        return ApiResponse::ok($promo->refresh()->toApi());
    }

    /**
     * Remove the specified promo code.
     */
    public function destroy(string $id): JsonResponse
    {
        $promo = PromoCode::find($id);

        if (! $promo) {
            return ApiResponse::error('Promo code not found', 404);
        }

        $promo->delete();

        return ApiResponse::ok(['id' => $id]);
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    private function rules(?int $ignoreId): array
    {
        return [
            'code' => ['required', 'string', 'max:60', Rule::unique('promos', 'code')->ignore($ignoreId)],
            'discountType' => ['required', Rule::in(['percentage', 'fixed'])],
            'discountValue' => ['required', 'integer', 'min:1'],
            'minSpend' => ['nullable', 'integer', 'min:0'],
            'active' => ['nullable', 'boolean'],
        ];
    }
}