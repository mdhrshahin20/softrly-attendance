<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class NotificationController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        abort_unless($user, 403);

        return Inertia::render('notifications/index', [
            'notifications' => $user->notifications()
                ->latest()
                ->paginate(20)
                ->withQueryString()
                ->through(fn ($notification): array => [
                    'id' => $notification->id,
                    'title' => $notification->data['title'] ?? 'Notification',
                    'message' => $notification->data['message'] ?? '',
                    'url' => $notification->data['url'] ?? null,
                    'level' => $notification->data['level'] ?? 'info',
                    'read_at' => $notification->read_at?->toIso8601String(),
                    'created_at' => $notification->created_at?->toIso8601String(),
                ]),
        ]);
    }

    public function read(Request $request, string $notification): RedirectResponse
    {
        $item = $request->user()?->notifications()->whereKey($notification)->firstOrFail();
        $item->markAsRead();

        return back();
    }

    public function readAll(Request $request): RedirectResponse
    {
        $request->user()?->unreadNotifications->markAsRead();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'All notifications marked as read.']);

        return back();
    }
}
