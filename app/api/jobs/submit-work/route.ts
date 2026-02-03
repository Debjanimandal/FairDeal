import { NextRequest, NextResponse } from 'next/server';
import { jobStorage, jobFiles, persistJobs, persistFiles } from '@/lib/storage';
import { uploadToIPFS, createZipFromFiles, watermarkManager } from '@/lib/ipfs-utils';
import { encryptionManager } from '@/lib/stellar-utils';
import { codeExecutionManager } from '@/lib/code-execution';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const jobId = formData.get('jobId') as string;
    const freelancerAddress = formData.get('freelancerAddress') as string;
    
    const files: any[] = [];
    formData.forEach((value, key) => {
      if (key.startsWith('files') && value instanceof File) {
        files.push(value);
      }
    });

    if (!jobId || !files || files.length === 0) {
      return NextResponse.json({ error: "Missing jobId or files" }, { status: 400 });
    }

    const job = jobStorage.get(jobId);
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (job.state !== 0 && job.state !== 4) {
      return NextResponse.json(
        { error: "Cannot submit work. Contract is not in a submittable state." },
        { status: 400 }
      );
    }

    console.log(`📁 Processing ${files.length} file(s) for job ${jobId}`);

    // Convert Files to buffers with originalname
    const fileBuffers = await Promise.all(
      files.map(async (file: File) => ({
        buffer: Buffer.from(await file.arrayBuffer()),
        originalname: file.name,
        mimetype: file.type,
      }))
    );

    // Check for code submission (Folder OR single non-image file)
    const isImage = fileBuffers.length === 1 && fileBuffers[0].mimetype.startsWith('image/');
    const isCodeSubmission = !isImage;

    let originalBuffer: Buffer,
      previewBuffer: Buffer | undefined,
      fileName: string,
      previewCID: string | undefined;
    let previewText = '';

    if (isCodeSubmission) {
      console.log(`💻 Code submission detected (${fileBuffers.length} files)`);

      // Even for single code file, we ZIP it for consistent encryption/download
      const zipBuffer = await createZipFromFiles(fileBuffers);
      originalBuffer = zipBuffer;
      fileName = fileBuffers.length > 1 ? `code-${jobId}.zip` : `${fileBuffers[0].originalname}.zip`;

      const executionResult = await codeExecutionManager.executeCode(fileBuffers);
      console.log(`✅ Code execution completed: ${executionResult.type}`);

      previewText = executionResult.output; // Store as text
    } else {
      console.log(`🖼️ Image submission detected: ${fileBuffers[0].originalname}`);
      originalBuffer = fileBuffers[0].buffer;
      fileName = fileBuffers[0].originalname;
      previewBuffer = await watermarkManager.addWatermark(fileBuffers[0].buffer, `Job ${jobId}`);

      // For image files, upload watermarked image to IPFS
      previewCID = await uploadToIPFS(previewBuffer, `${jobId}-preview-${Date.now()}`);
      console.log(`👁️ Preview uploaded to IPFS: ${previewCID}`);
      previewText = `Preview available at: https://gateway.pinata.cloud/ipfs/${previewCID}`;
    }

    const encryptionKey = encryptionManager.generateKey();
    const encrypted = encryptionManager.encryptFile(originalBuffer, encryptionKey);

    const originalCID = await uploadToIPFS(encrypted.encrypted, `${jobId}-original-${Date.now()}`);
    console.log(`📦 Encrypted original uploaded to IPFS: ${originalCID}`);

    jobFiles.set(jobId, {
      jobId,
      freelancerAddress,
      originalCID,
      previewCID: previewCID || null,
      previewText: previewText,
      encryptionKey: encryptionKey.toString("hex"),
      encryptionIV: encrypted.iv.toString("hex"),
      submittedAt: new Date().toISOString(),
      fileName: fileName,
      fileSize: originalBuffer.length,
      originalBuffer: originalBuffer,
      isCodeFolder: isCodeSubmission,
      fileCount: fileBuffers.length,
    });

    if (job) {
      job.state = 1;
      jobStorage.set(jobId, job);
      persistJobs();
      console.log(`✅ Job ${jobId} state updated to 1 (Submitted)`);
    }

    persistFiles();
    console.log(`💾 Job and file data persisted to disk`);

    const baseURL = req.nextUrl.origin;
    return NextResponse.json({
      success: true,
      jobId,
      previewURL: `${baseURL}/api/jobs/${jobId}/preview-content`,
      isCodeFolder: isCodeSubmission,
      fileCount: fileBuffers.length,
      message: isCodeSubmission
        ? `Code submission (${fileBuffers.length} files) successful. Preview available via backend API.`
        : "Work submitted successfully. Preview is visible to client.",
    });
  } catch (error: any) {
    console.error("Error submitting work:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
