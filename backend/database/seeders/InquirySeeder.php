<?php

namespace Database\Seeders;

use App\Models\CustomerInquiry;
use Illuminate\Database\Seeder;

class InquirySeeder extends Seeder
{
    /**
     * Seed data mirrors frontend/src/data/mockData.ts (INITIAL_INQUIRIES).
     */
    public function run(): void
    {
        $inquiries = [
            [
                'id' => 'INQ-101',
                'date' => '2026-08-11',
                'name' => 'Robert Hastings',
                'email' => 'robert.h@innovate.co',
                'phone' => '+1 (555) 901-2233',
                'subject' => 'Bulk Corporate Order for 15 iPhones',
                'message' => 'Hello Mxmobilz sales team, we are looking to procure 15 units of iPhone 16 Pro 256GB for our sales executives. Do you offer corporate tax-exempt invoicing and volume discounts?',
                'status' => 'New',
            ],
            [
                'id' => 'INQ-102',
                'date' => '2026-08-09',
                'name' => 'Maria Gomez',
                'email' => 'm.gomez@outlook.com',
                'phone' => '+1 (555) 345-6789',
                'subject' => 'Trade-in value for iPhone 13 Pro Max 256GB',
                'message' => 'I completed the online trade-in calculator and received a quote of $420. How long is this estimate valid before I ship my old device?',
                'status' => 'In Progress',
            ],
        ];

        foreach ($inquiries as $inquiry) {
            CustomerInquiry::updateOrCreate(['id' => $inquiry['id']], $inquiry);
        }
    }
}