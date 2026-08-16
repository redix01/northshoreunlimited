<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\UserDocument;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Compliance review of client photo ID. Each submission is the front/back pair
 * a client uploaded; approving one verifies the account and lights up the
 * verified badge, rejecting it sends them back with a reason.
 */
class VerificationController extends Controller
{
    public function index(Request $request)
    {
        $status = $request->input('status', 'pending');

        $documents = UserDocument::identity()
            ->with('user')
            ->when($status !== 'all', fn ($q) => $q->where('status', $status))
            ->orderBy('created_at', 'desc')
            ->get();

        // One card per submission rather than per file.
        $submissions = $documents
            ->groupBy(fn (UserDocument $document) => $document->submission_id ?? 'legacy-' . $document->id)
            ->map(function ($files) {
                $first = $files->first();

                return [
                    'submission_id' => $first->submission_id,
                    // Shaped by hand: the reviewer needs the details to compare
                    // against the document, but never the full tax ID.
                    'user'          => $this->client($first->user),
                    'type'          => $first->type,
                    'type_label'    => $first->type_label,
                    'status'        => $first->status,
                    'admin_notes'   => $first->admin_notes,
                    'submitted_at'  => $first->created_at->toIso8601String(),
                    'reviewed_at'   => optional($first->reviewed_at)->toIso8601String(),
                    'files'         => $files->map(fn (UserDocument $file) => [
                        'id'   => $file->id,
                        'side' => $file->side ?? 'front',
                        'name' => $file->original_name,
                        'mime' => $file->mime_type,
                        'url'  => route('admin.verifications.document', $file),
                    // Front first, however the rows came back.
                    ])->sortBy(fn (array $file) => $file['side'] === 'front' ? 0 : 1)->values(),
                ];
            })
            ->values();

        return Inertia::render('Admin/Verifications', [
            'submissions' => $submissions,
            'filters'     => ['status' => $status],
            'counts'      => [
                'pending'  => $this->countByStatus('pending'),
                'approved' => $this->countByStatus('approved'),
                'rejected' => $this->countByStatus('rejected'),
            ],
        ]);
    }

    public function approve(Request $request, User $user)
    {
        $validated = $request->validate([
            'notes' => ['nullable', 'string', 'max:255'],
            // The name exactly as it reads on the document. Left blank it falls
            // back to the name on the account.
            'verified_name' => ['nullable', 'string', 'max:255'],
            'tax_id_match'  => ['boolean'],
        ]);

        $documents = $this->pendingFor($user);

        if ($documents->isEmpty()) {
            return back()->withErrors(['error' => 'This client has no identity document awaiting review.']);
        }

        DB::transaction(function () use ($documents, $user, $validated) {
            foreach ($documents as $document) {
                $document->update([
                    'status'      => 'approved',
                    'admin_notes' => $validated['notes'] ?? null,
                    'reviewed_by' => Auth::id(),
                    'reviewed_at' => now(),
                ]);
            }

            $user->forceFill(['id_document_type' => $documents->first()->type_label])->save();

            $user->markVerified(
                $validated['verified_name'] ?? null,
                (bool) ($validated['tax_id_match'] ?? false),
            );
        });

        return back()->with('success', "{$user->fresh()->verifiedName()} is now verified.");
    }

    public function reject(Request $request, User $user)
    {
        $validated = $request->validate([
            'notes' => ['required', 'string', 'max:255'],
        ]);

        $documents = $this->pendingFor($user);

        if ($documents->isEmpty()) {
            return back()->withErrors(['error' => 'This client has no identity document awaiting review.']);
        }

        foreach ($documents as $document) {
            $document->update([
                'status'      => 'rejected',
                'admin_notes' => $validated['notes'],
                'reviewed_by' => Auth::id(),
                'reviewed_at' => now(),
            ]);
        }

        // The client is asked for a new document, so the account sits in review
        // rather than claiming any verified detail.
        if (! $user->isSuspended()) {
            $user->forceFill(['status' => 'pending'])->save();
        }

        return back()->with('success', "Identity document rejected for {$user->name}.");
    }

    /**
     * Streams a document off the private disk. KYC material is never a public
     * asset, so it is served through this authenticated admin route only.
     */
    public function document(UserDocument $document): StreamedResponse
    {
        abort_unless(Storage::disk('local')->exists($document->path), 404);

        return Storage::disk('local')->response($document->path, $document->original_name, [
            'Content-Type' => $document->mime_type,
        ]);
    }

    /** The client details a reviewer checks the document against. */
    protected function client(User $user): array
    {
        return [
            'id'             => $user->id,
            'name'           => $user->name,
            'username'       => $user->username,
            'email'          => $user->email,
            'member_id'      => $user->member_id,
            'phone'          => $user->phone,
            'address'        => $user->formattedAddress(),
            'date_of_birth'  => optional($user->date_of_birth)->toDateString(),
            'is_verified'    => (bool) $user->is_verified,
            'account_status' => $user->accountStatus(),
            'tax_id_last4'   => $user->taxIdLast4(),
            'verified_name'  => $user->verifiedName(),
        ];
    }

    /** @return \Illuminate\Database\Eloquent\Collection<int, UserDocument> */
    protected function pendingFor(User $user)
    {
        return UserDocument::identity()
            ->where('user_id', $user->id)
            ->where('status', 'pending')
            ->get();
    }

    protected function countByStatus(string $status): int
    {
        return UserDocument::identity()
            ->where('status', $status)
            ->distinct()
            ->count('submission_id');
    }
}
