import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { getSupabase } from '@/lib/supabase';

const STORAGE_BUCKET = 'cosmetics-assets-vault';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Sanitize filename and create unique timestamped name
    const timestamp = Date.now();
    const cleanOriginal = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${timestamp}-${cleanOriginal}`;
    const storagePath = `uploads/${filename}`;

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const contentType = file.type || 'application/octet-stream';

    // 1. Primary: Upload to Supabase Storage if configured
    const supabase = getSupabase();
    if (supabase) {
      let { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(storagePath, buffer, {
          contentType,
          upsert: true,
        });

      // If bucket doesn't exist yet, attempt to create it automatically and retry
      if (uploadError && /bucket/i.test(uploadError.message)) {
        await supabase.storage.createBucket(STORAGE_BUCKET, { public: true });
        const retry = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(storagePath, buffer, {
            contentType,
            upsert: true,
          });
        uploadError = retry.error;
      }

      if (!uploadError) {
        const { data: publicUrlData } = supabase.storage
          .from(STORAGE_BUCKET)
          .getPublicUrl(storagePath);

        if (publicUrlData?.publicUrl) {
          return NextResponse.json({
            success: true,
            url: publicUrlData.publicUrl,
            filename,
            originalName: file.name,
            size: file.size,
            type: file.type,
            storage: 'supabase',
          });
        }
      } else {
        console.warn('Supabase Storage upload warning, falling back:', uploadError.message);
      }
    }

    // 2. Secondary (Local development): Write to public/uploads if filesystem is writable
    if (!process.env.VERCEL) {
      try {
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
        await fs.mkdir(uploadsDir, { recursive: true });
        const filePath = path.join(uploadsDir, filename);
        await fs.writeFile(filePath, buffer);

        return NextResponse.json({
          success: true,
          url: `/uploads/${filename}`,
          filename,
          originalName: file.name,
          size: file.size,
          type: file.type,
          storage: 'local',
        });
      } catch (fsErr: any) {
        console.warn('Local filesystem write skipped (read-only environment):', fsErr?.code || fsErr?.message);
      }
    }

    // 3. Fallback for serverless/read-only environments when Supabase Storage bucket or RLS is not yet set up
    const base64DataUrl = `data:${contentType};base64,${buffer.toString('base64')}`;

    return NextResponse.json({
      success: true,
      url: base64DataUrl,
      filename,
      originalName: file.name,
      size: file.size,
      type: file.type,
      storage: 'inline-data-url',
    });
  } catch (error: any) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'File upload failed' },
      { status: 500 }
    );
  }
}
