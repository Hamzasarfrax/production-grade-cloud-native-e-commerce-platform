<?php

namespace Tests\Feature;

use Tests\TestCase;

class HealthEndpointTest extends TestCase
{
    public function test_api_health_returns_ok_payload(): void
    {
        $response = $this->getJson('/api/health');

        $response->assertStatus(200)
            ->assertJson(['ok' => true]);
    }

    public function test_framework_up_endpoint_returns_200(): void
    {
        $this->get('/up')->assertStatus(200);
    }
}
