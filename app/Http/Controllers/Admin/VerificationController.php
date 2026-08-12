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
            ->with('user:id,name,username,email,is_verified,date_of_birth,phone,address,member_id')
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
                    'user'          => $first->user,
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

            $user->forceFill([
                'is_verified'          => true,
                'verified_at'          => now(),
                'name_match_confirmed' => true,
                'id_document_type'     => $documents->first()->type_label,
            ])->save();
        });

        return back()->with('success', "{$user->name} is now verified.");
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
