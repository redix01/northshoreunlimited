<?php

namespace App\Http\Controllers;

use App\Models\UserDocument;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

/**
 * Identity verification: the client picks a government photo ID and uploads
 * the front (and, for two-sided documents, the back). Both files belong to one
 * submission, which an admin then approves or rejects as a unit.
 */
class IdentityController extends Controller
{
    public function store(Request $request)
    {
        $user = Auth::user();

        if ($user->is_verified) {
            return back()->withErrors(['front' => 'This account is already verified.']);
        }

        $type = $request->input('type');
        $needsBack = !in_array($type, UserDocument::SINGLE_SIDED_ID_TYPES, true);

        $validated = $request->validate([
            'type'  => ['required', Rule::in(array_keys(UserDocument::ID_TYPES))],
            'front' => ['required', 'file', 'mimes:jpg,jpeg,png,webp,pdf', 'max:15360'],
            'back'  => [$needsBack ? 'required' : 'nullable', 'file', 'mimes:jpg,jpeg,png,webp,pdf', 'max:15360'],
        ], [
            'front.required' => 'Upload the front of your document.',
            'back.required'  => 'Upload the back of your document.',
        ]);

        // A fresh submission replaces anything still awaiting review, so
        // compliance never has two competing pending sets for one client.
        $this->discardPendingSubmission($user->id);

        $submissionId = (string) Str::uuid();

        DB::transaction(function () use ($request, $validated, $user, $submissionId, $needsBack) {
            foreach (['front', 'back'] as $side) {
                if ($side === 'back' && (!$needsBack || !$request->hasFile('back'))) {
                    continue;
                }

                $file = $request->file($side);

                UserDocument::create([
                    'user_id'       => $user->id,
                    'submission_id' => $submissionId,
                    'type'          => $validated['type'],
                    'side'          => $side,
                    'label'         => UserDocument::ID_TYPES[$validated['type']] . ' (' . ucfirst($side) . ')',
                    'path'          => $file->store('documents/' . $user->id, 'local'),
                    'original_name' => $file->getClientOriginalName(),
                    'mime_type'     => $file->getClientMimeType(),
                    'size'          => $file->getSize(),
                    'status'        => 'pending',
                ]);
            }

            // Records that an ID has been supplied — the checklist step. Being
            // verified stays an admin decision.
            $user->forceFill(['id_document_type' => UserDocument::ID_TYPES[$validated['type']]])->save();
        });

        return back()->with('success', 'Identity document submitted. Our compliance team will review it shortly.');
    }

    protected function discardPendingSubmission(int $userId): void
    {
        $pending = UserDocument::identity()
            ->where('user_id', $userId)
            ->where('status', 'pending')
            ->get();

        foreach ($pending as $document) {
            Storage::disk('local')->delete($document->path);
            $document->delete();
        }
    }
}
