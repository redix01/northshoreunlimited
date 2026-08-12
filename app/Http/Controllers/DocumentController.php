<?php

namespace App\Http\Controllers;

use App\Models\UserDocument;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\StreamedResponse;

class DocumentController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'type'  => ['required', Rule::in(array_keys(UserDocument::TYPES))],
            'label' => ['nullable', 'string', 'max:120'],
            'file'  => ['required', 'file', 'mimes:jpg,jpeg,png,webp,pdf', 'max:15360'],
        ]);

        $file = $request->file('file');

        UserDocument::create([
            'user_id'       => Auth::id(),
            'type'          => $validated['type'],
            'label'         => $validated['label'] ?? null,
            'path'          => $file->store('documents/'.Auth::id(), 'local'),
            'original_name' => $file->getClientOriginalName(),
            'mime_type'     => $file->getClientMimeType(),
            'size'          => $file->getSize(),
            'status'        => 'pending',
        ]);

        return back()->with('success', 'Document uploaded. Our compliance team will review it shortly.');
    }

    /**
     * Documents live on the private disk — they are KYC material, not public
     * assets — so they are streamed back only to the owner.
     */
    public function show(UserDocument $document): StreamedResponse
    {
        abort_unless($document->user_id === Auth::id(), 403);
        abort_unless(Storage::disk('local')->exists($document->path), 404);

        return Storage::disk('local')->response($document->path, $document->original_name, [
            'Content-Type' => $document->mime_type,
        ]);
    }

    public function destroy(UserDocument $document)
    {
        abort_unless($document->user_id === Auth::id(), 403);

        // Once compliance has ruled on a document the client cannot remove it.
        if ($document->status !== 'pending') {
            return back()->withErrors([
                'document' => 'Reviewed documents cannot be removed. Contact support if this is an error.',
            ]);
        }

        Storage::disk('local')->delete($document->path);
        $document->delete();

        return back()->with('success', 'Document removed.');
    }
}
