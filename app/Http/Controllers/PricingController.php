<?php

namespace App\Http\Controllers;

use App\Domain\Billing\Services\PlanCatalog;
use Inertia\Inertia;
use Inertia\Response;

class PricingController extends Controller
{
    public function __invoke(PlanCatalog $plans): Response
    {
        return Inertia::render('pricing', [
            'plans' => $plans->publicPlans()->map->toPublicArray()->values(),
        ]);
    }
}
