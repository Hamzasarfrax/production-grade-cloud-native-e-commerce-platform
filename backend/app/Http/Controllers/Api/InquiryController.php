<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CustomerInquiry;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class InquiryController extends Controller
{
    /**
     * Display a listing of inquiries, newest first.
     */
    public function index(Request $request): JsonResponse
    {
        $query = CustomerInquiry::query();

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        $inquiries = $query->orderByDesc('date')->get();

        return ApiResponse::ok($inquiries->map(fn (CustomerInquiry $i) => $i->toApi()));
    }

    /**
     * Store a newly created inquiry (contact form).
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:40'],
            'subject' => ['required', 'string', 'max:255'],
            'message' => ['required', 'string', 'max:2000'],
        ]);

        $inquiry = CustomerInquiry::create([
            'id' => 'INQ-'.random_int(100, 999),
            'date' => now(),
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'subject' => $validated['subject'],
            'message' => $validated['message'],
            'status' => 'New',
        ]);

        return ApiResponse::ok($inquiry->toApi(), 201);
    }

    /**
     * Update the specified inquiry (PATCH status).
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $inquiry = CustomerInquiry::find($id);

        if (! $inquiry) {
            return ApiResponse::error('Inquiry not found', 404);
        }

        $validated = $request->validate([
            'status' => ['required', Rule::in(['New', 'In Progress', 'Resolved'])],
        ]);

        $inquiry->update(['status' => $validated['status']]);

        return ApiResponse::ok($inquiry->refresh()->toApi());
    }

    /**
     * Remove the specified inquiry.
     */
    public function destroy(string $id): JsonResponse
    {
        $inquiry = CustomerInquiry::find($id);

        if (! $inquiry) {
            return ApiResponse::error('Inquiry not found', 404);
        }

        $inquiry->delete();

        return ApiResponse::ok(['id' => $id]);
    }
}
