<?php

use App\Domain\Attendance\Models\Attendance;
use App\Domain\Attendance\Models\FaceTemplate;
use App\Domain\Attendance\Services\FaceVerificationService;
use App\Domain\Billing\Enums\PlanFeature;
use App\Domain\Billing\Models\Plan;
use App\Domain\Billing\Services\PlanCatalog;
use App\Domain\Tenant\Models\TenantSetting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Random\Engine\Mt19937;
use Random\Randomizer;

uses(RefreshDatabase::class);

// Check-in tests must land on a configured working day, otherwise the
// "weekly off" rule short-circuits before verification is ever reached.
// 7 September 2026 is a Monday in the default Sun–Thu working week.
beforeEach(function () {
    $this->travelTo(now()->setDate(2026, 9, 7)->setTime(9, 5));
});

/**
 * Deterministic 128-d descriptor so tests are reproducible.
 *
 * @return list<float>
 */
function faceDescriptor(int $seed, float $noise = 0.0): array
{
    $random = new Randomizer(new Mt19937($seed));
    $vector = [];

    for ($i = 0; $i < FaceVerificationService::DESCRIPTOR_LENGTH; $i++) {
        $vector[] = ($random->getInt(0, 2000) - 1000) / 1000.0;
    }

    if ($noise > 0.0) {
        $span = (int) round($noise * 1000);
        $jitter = new Randomizer(new Mt19937($seed + 1));

        for ($i = 0; $i < FaceVerificationService::DESCRIPTOR_LENGTH; $i++) {
            $vector[$i] += ($jitter->getInt(0, $span * 2) - $span) / 1000.0;
        }
    }

    return $vector;
}

/**
 * Enable face verification for a workspace, on a plan that includes it.
 */
function enableFaceVerification(array $workspace, ?float $threshold = null): void
{
    grantPlan($workspace, 'professional');

    $workspace['tenant']->makeCurrent();

    TenantSetting::query()->updateOrCreate(
        ['tenant_id' => $workspace['tenant']->id, 'key' => 'face_verification'],
        ['value' => 'true', 'type' => 'boolean'],
    );

    TenantSetting::query()->updateOrCreate(
        ['tenant_id' => $workspace['tenant']->id, 'key' => 'face_store_selfie'],
        ['value' => 'false', 'type' => 'boolean'],
    );

    if ($threshold !== null) {
        TenantSetting::query()->updateOrCreate(
            ['tenant_id' => $workspace['tenant']->id, 'key' => 'face_match_threshold'],
            ['value' => (string) $threshold, 'type' => 'string'],
        );
    }
}

function enrolFace(array $workspace, ?array $descriptors = null): FaceTemplate
{
    $workspace['tenant']->makeCurrent();

    return app(FaceVerificationService::class)->enroll(
        $workspace['user'],
        $descriptors ?? [faceDescriptor(100), faceDescriptor(100, 0.02)],
        $workspace['employee'],
    );
}

test('an employee can enrol their face and it is stored as a descriptor', function () {
    $workspace = createWorkspace(['owner_email' => 'enrol@example.com']);
    grantPlan($workspace, 'professional');

    actingAsOwner($workspace)
        ->post('/face', [
            'descriptors' => [faceDescriptor(11), faceDescriptor(11, 0.02)],
        ])
        ->assertRedirect(route('face.edit'))
        ->assertSessionHasNoErrors();

    $template = FaceTemplate::query()->first();

    expect($template)->not->toBeNull()
        ->and($template?->user_id)->toBe($workspace['user']->id)
        ->and($template?->sample_count)->toBe(2)
        ->and($template?->vector())->toHaveCount(FaceVerificationService::DESCRIPTOR_LENGTH)
        ->and($template?->isActive())->toBeTrue();
});

test('the browser payload for enrolment — descriptors as a JSON string — is accepted', function () {
    $workspace = createWorkspace(['owner_email' => 'json-enrol@example.com']);
    grantPlan($workspace, 'professional');

    $samples = [faceDescriptor(21), faceDescriptor(21, 0.02)];

    // Mirrors exactly what the hidden input submits: a JSON string, not an array.
    // Regression test for "The descriptors field must be an array."
    actingAsOwner($workspace)
        ->post('/face', [
            'descriptors' => json_encode($samples),
            'selfie' => 'data:image/jpeg;base64,'.base64_encode('fake-jpeg-bytes'),
        ])
        ->assertRedirect(route('face.edit'))
        ->assertSessionHasNoErrors();

    $template = FaceTemplate::query()->first();

    expect($template)->not->toBeNull()
        ->and($template?->sample_count)->toBe(2)
        ->and($template?->vector())->toHaveCount(FaceVerificationService::DESCRIPTOR_LENGTH)
        ->and($template?->photo_path)->not->toBeNull();
});

test('a malformed descriptor string is rejected with a clear error', function () {
    $workspace = createWorkspace(['owner_email' => 'json-bad@example.com']);
    grantPlan($workspace, 'professional');

    actingAsOwner($workspace)
        ->post('/face', ['descriptors' => 'not-json-at-all'])
        ->assertSessionHasErrors('descriptors');

    // Valid JSON, but not a list of 128-length samples.
    actingAsOwner($workspace)
        ->post('/face', ['descriptors' => json_encode([[1, 2, 3]])])
        ->assertSessionHasErrors('descriptors.0');

    expect(FaceTemplate::query()->exists())->toBeFalse();
});

test('the browser payload for check-in — descriptor as a JSON string — is accepted', function () {
    $workspace = createWorkspace(['owner_email' => 'json-checkin@example.com']);
    enableFaceVerification($workspace);
    enrolFace($workspace, [faceDescriptor(31), faceDescriptor(31, 0.02)]);

    actingAsOwner($workspace)
        ->withServerVariables(['REMOTE_ADDR' => '127.0.0.1'])
        ->post('/attendance/check-in', [
            // The hidden input sends this as a JSON string.
            'face_descriptor' => json_encode(faceDescriptor(31, 0.02)),
        ])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    expect(Attendance::query()->count())->toBe(1);
});

test('the face descriptor is never stored in plain text form the browser can reuse', function () {
    $workspace = createWorkspace(['owner_email' => 'raw@example.com']);
    grantPlan($workspace, 'professional');

    $descriptors = [faceDescriptor(12), faceDescriptor(12, 0.02)];

    actingAsOwner($workspace)
        ->post('/face', ['descriptors' => $descriptors])
        ->assertRedirect();

    $stored = FaceTemplate::query()->first()?->vector() ?? [];

    // The stored vector is the mean of the samples, not any single submitted one.
    expect($stored)->not->toEqual($descriptors[0])
        ->and($stored)->not->toEqual($descriptors[1]);
});

test('enrolment is rejected when the plan does not include face verification', function () {
    $workspace = createWorkspace(['owner_email' => 'no-plan@example.com']);
    grantPlan($workspace, 'starter');

    actingAsOwner($workspace)
        ->post('/face', ['descriptors' => [faceDescriptor(13)]])
        ->assertSessionHasErrors('plan');

    expect(FaceTemplate::query()->exists())->toBeFalse();
});

test('a malformed descriptor is rejected on enrolment', function () {
    $workspace = createWorkspace(['owner_email' => 'malformed@example.com']);
    grantPlan($workspace, 'professional');

    actingAsOwner($workspace)
        ->post('/face', ['descriptors' => [[1, 2, 3]]])
        ->assertSessionHasErrors('descriptors.0');

    expect(FaceTemplate::query()->exists())->toBeFalse();
});

test('check-in requires a face capture when face verification is enabled', function () {
    $workspace = createWorkspace(['owner_email' => 'required@example.com']);
    enableFaceVerification($workspace);
    enrolFace($workspace);

    actingAsOwner($workspace)
        ->withServerVariables(['REMOTE_ADDR' => '127.0.0.1'])
        ->post('/attendance/check-in')
        ->assertSessionHasErrors('attendance');

    expect(Attendance::query()->count())->toBe(0);
});

test('check-in succeeds when the captured face matches the enrolled template', function () {
    $workspace = createWorkspace(['owner_email' => 'match@example.com']);
    enableFaceVerification($workspace);
    enrolFace($workspace, [faceDescriptor(200), faceDescriptor(200, 0.02)]);

    actingAsOwner($workspace)
        ->withServerVariables(['REMOTE_ADDR' => '127.0.0.1'])
        ->post('/attendance/check-in', [
            'face_descriptor' => faceDescriptor(200, 0.02),
        ])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $attendance = Attendance::query()->first();

    expect($attendance)->not->toBeNull()
        ->and($attendance?->check_in_face_score)->not->toBeNull()
        ->and((float) $attendance?->check_in_face_score)->toBeLessThan(0.5)
        ->and($attendance?->check_in_face_verified_at)->not->toBeNull();
});

test('check-in is rejected when the captured face does not match', function () {
    $workspace = createWorkspace(['owner_email' => 'nomatch@example.com']);
    enableFaceVerification($workspace);
    enrolFace($workspace, [faceDescriptor(300), faceDescriptor(300, 0.02)]);

    actingAsOwner($workspace)
        ->withServerVariables(['REMOTE_ADDR' => '127.0.0.1'])
        ->post('/attendance/check-in', [
            // A completely different face.
            'face_descriptor' => faceDescriptor(999),
        ])
        ->assertSessionHasErrors('attendance');

    expect(Attendance::query()->count())->toBe(0);
});

test('a client cannot bypass verification by claiming success', function () {
    $workspace = createWorkspace(['owner_email' => 'bypass@example.com']);
    enableFaceVerification($workspace);
    enrolFace($workspace, [faceDescriptor(400), faceDescriptor(400, 0.02)]);

    // The classic bypass attempt: a boolean flag with no real descriptor.
    actingAsOwner($workspace)
        ->withServerVariables(['REMOTE_ADDR' => '127.0.0.1'])
        ->post('/attendance/check-in', [
            'face_verified' => true,
            'face_match' => true,
            'face_score' => 0.01,
        ])
        ->assertSessionHasErrors('attendance');

    expect(Attendance::query()->count())->toBe(0);
});

test('check-in is blocked when the employee has not enrolled yet', function () {
    $workspace = createWorkspace(['owner_email' => 'notenrolled@example.com']);
    enableFaceVerification($workspace);

    actingAsOwner($workspace)
        ->withServerVariables(['REMOTE_ADDR' => '127.0.0.1'])
        ->post('/attendance/check-in', [
            'face_descriptor' => faceDescriptor(500, 0.02),
        ])
        ->assertSessionHasErrors('attendance');

    expect(Attendance::query()->count())->toBe(0);
});

test('a stricter threshold rejects a borderline match', function () {
    $workspace = createWorkspace(['owner_email' => 'threshold@example.com']);
    enableFaceVerification($workspace, 0.05);
    enrolFace($workspace, [faceDescriptor(600), faceDescriptor(600, 0.02)]);

    // This descriptor is close, but not within the very strict threshold.
    actingAsOwner($workspace)
        ->withServerVariables(['REMOTE_ADDR' => '127.0.0.1'])
        ->post('/attendance/check-in', [
            'face_descriptor' => faceDescriptor(600, 0.2),
        ])
        ->assertSessionHasErrors('attendance');

    expect(Attendance::query()->count())->toBe(0);
});

test('check-out is also gated by face verification', function () {
    $workspace = createWorkspace(['owner_email' => 'checkout-face@example.com']);
    enableFaceVerification($workspace);
    enrolFace($workspace, [faceDescriptor(700), faceDescriptor(700, 0.02)]);

    actingAsOwner($workspace)
        ->withServerVariables(['REMOTE_ADDR' => '127.0.0.1'])
        ->post('/attendance/check-in', ['face_descriptor' => faceDescriptor(700, 0.02)])
        ->assertSessionHasNoErrors();

    // Stay inside the same Asia/Dhaka day: 18:00 UTC would already be tomorrow
    // in the office timezone, and the daily record would not be found.
    $this->travelTo(now()->setDate(2026, 9, 7)->setTime(10, 30));

    actingAsOwner($workspace)
        ->withServerVariables(['REMOTE_ADDR' => '127.0.0.1'])
        ->post('/attendance/check-out')
        ->assertSessionHasErrors('attendance');

    expect(Attendance::query()->first()?->check_out_at)->toBeNull();

    actingAsOwner($workspace)
        ->withServerVariables(['REMOTE_ADDR' => '127.0.0.1'])
        ->post('/attendance/check-out', ['face_descriptor' => faceDescriptor(700, 0.02)])
        ->assertSessionHasNoErrors();

    expect(Attendance::query()->first()?->check_out_face_verified_at)->not->toBeNull();
});

test('check-in is unaffected when face verification is switched off', function () {
    $workspace = createWorkspace(['owner_email' => 'disabled@example.com']);
    grantPlan($workspace, 'professional');

    actingAsOwner($workspace)
        ->withServerVariables(['REMOTE_ADDR' => '127.0.0.1'])
        ->post('/attendance/check-in')
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $attendance = Attendance::query()->first();

    expect($attendance)->not->toBeNull()
        ->and($attendance?->check_in_face_score)->toBeNull()
        ->and($attendance?->check_in_face_verified_at)->toBeNull();
});

test('revoking the enrolment blocks further face-verified check-ins', function () {
    $workspace = createWorkspace(['owner_email' => 'revoke@example.com']);
    enableFaceVerification($workspace);
    enrolFace($workspace);

    actingAsOwner($workspace)->delete('/face')->assertRedirect();

    expect(FaceTemplate::query()->first()?->revoked_at)->not->toBeNull();

    actingAsOwner($workspace)
        ->withServerVariables(['REMOTE_ADDR' => '127.0.0.1'])
        ->post('/attendance/check-in', ['face_descriptor' => faceDescriptor(100, 0.02)])
        ->assertSessionHasErrors('attendance');
});

test('a tenant cannot switch face verification on without the plan feature', function () {
    $workspace = createWorkspace(['owner_email' => 'gating@example.com']);
    grantPlan($workspace, 'starter');

    actingAsOwner($workspace)
        ->put('/settings/attendance', [
            'attendance_method' => 'network',
            'face_verification' => '1',
        ])
        ->assertSessionHasErrors('plan');

    $workspace['tenant']->makeCurrent();
    $workspace['tenant']->unsetRelation('settings');

    expect($workspace['tenant']->fresh()->setting('face_verification'))->not->toBe('true');
});

test('face verification composes with the network check', function () {
    $workspace = createWorkspace(['owner_email' => 'compose@example.com']);
    enableFaceVerification($workspace);
    enrolFace($workspace, [faceDescriptor(800), faceDescriptor(800, 0.02)]);

    // Correct face, wrong network: still rejected.
    actingAsOwner($workspace)
        ->withServerVariables(['REMOTE_ADDR' => '203.0.113.10'])
        ->from('/dashboard')
        ->post('/attendance/check-in', ['face_descriptor' => faceDescriptor(800, 0.02)])
        ->assertRedirect('/dashboard')
        ->assertSessionHasErrors('attendance');

    expect(Attendance::query()->count())->toBe(0);

    // Correct face on the office network: accepted.
    actingAsOwner($workspace)
        ->withServerVariables(['REMOTE_ADDR' => '127.0.0.1'])
        ->post('/attendance/check-in', ['face_descriptor' => faceDescriptor(800, 0.02)])
        ->assertSessionHasNoErrors();

    expect(Attendance::query()->count())->toBe(1);
});

test('the dashboard tells the frontend whether a face check is needed', function () {
    $workspace = createWorkspace(['owner_email' => 'props@example.com']);
    enableFaceVerification($workspace);

    actingAsOwner($workspace)
        ->get('/dashboard')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('face.required', true)
            ->where('face.enrolled', false));

    enrolFace($workspace);

    actingAsOwner($workspace)
        ->get('/dashboard')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('face.required', true)
            ->where('face.enrolled', true));
});

test('the live verify endpoint matches a face without marking attendance', function () {
    $workspace = createWorkspace(['owner_email' => 'live-verify@example.com']);
    enableFaceVerification($workspace);
    enrolFace($workspace, [faceDescriptor(900), faceDescriptor(900, 0.02)]);

    $this->actingAs($workspace['user'])
        ->postJson('/face/verify', [
            'face_descriptor' => faceDescriptor(900, 0.02),
        ])
        ->assertOk()
        ->assertJson([
            'matched' => true,
            'message' => null,
        ])
        ->assertJsonStructure(['matched', 'score', 'threshold']);

    // Verifying is a preview only — it must never create an attendance record.
    expect(Attendance::query()->count())->toBe(0);
});

test('the live verify endpoint reports a mismatch with a message', function () {
    $workspace = createWorkspace(['owner_email' => 'live-mismatch@example.com']);
    enableFaceVerification($workspace);
    enrolFace($workspace, [faceDescriptor(910), faceDescriptor(910, 0.02)]);

    $this->actingAs($workspace['user'])
        ->postJson('/face/verify', [
            'face_descriptor' => faceDescriptor(1234),
        ])
        ->assertOk()
        ->assertJson(['matched' => false])
        ->assertJsonPath('message', fn ($message): bool => is_string($message) && $message !== '');

    expect(Attendance::query()->count())->toBe(0);
});

test('the live verify endpoint accepts the descriptor as a JSON string', function () {
    $workspace = createWorkspace(['owner_email' => 'live-string@example.com']);
    enableFaceVerification($workspace);
    enrolFace($workspace, [faceDescriptor(920), faceDescriptor(920, 0.02)]);

    $this->actingAs($workspace['user'])
        ->postJson('/face/verify', [
            'face_descriptor' => json_encode(faceDescriptor(920, 0.02)),
        ])
        ->assertOk()
        ->assertJson(['matched' => true]);
});

test('the live verify endpoint rejects an unenrolled employee', function () {
    $workspace = createWorkspace(['owner_email' => 'live-unenrolled@example.com']);
    enableFaceVerification($workspace);

    $this->actingAs($workspace['user'])
        ->postJson('/face/verify', ['face_descriptor' => faceDescriptor(930)])
        ->assertOk()
        ->assertJson(['matched' => false]);
});

test('the live verify endpoint requires the plan feature', function () {
    $workspace = createWorkspace(['owner_email' => 'live-plan@example.com']);
    grantPlan($workspace, 'starter');

    $this->actingAs($workspace['user'])
        ->postJson('/face/verify', ['face_descriptor' => faceDescriptor(940)])
        ->assertStatus(422);
});

test('the live verify endpoint requires authentication', function () {
    $this->postJson('/face/verify', ['face_descriptor' => faceDescriptor(950)])
        ->assertUnauthorized();
});

test('the enterprise plan includes face verification', function () {
    app(PlanCatalog::class)->seed();

    $enterprise = Plan::query()
        ->where('slug', 'enterprise')
        ->with('features')
        ->firstOrFail();

    expect($enterprise->hasFeature(PlanFeature::FaceVerification))->toBeTrue();
});
