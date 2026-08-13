<?php

namespace App\Support;

use Illuminate\Http\JsonResponse;

class ApiResponse
{
    /**
     * @param  mixed  $data
     * @param  int  $status
     * @return JsonResponse
     */
    public static function ok(mixed $data, int $status = 200): JsonResponse
    {
        return response()->json(['ok' => true, 'data' => $data], $status);
    }

    /**
     * @param  string  $message
     * @param  int  $status
     * @param  array<mixed>|null  $errors
     * @return JsonResponse
     */
    public static function error(string $message, int $status = 400, ?array $errors = null): JsonResponse
    {
        return response()->json(array_filter([
            'ok' => false,
            'message' => $message,
            'errors' => $errors,
        ]), $status);
    }
}