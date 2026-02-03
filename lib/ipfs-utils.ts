import Jimp from 'jimp';
import AdmZip from 'adm-zip';
import pinataSDK from '@pinata/sdk';
import { Readable } from 'stream';
import axios from 'axios';

const pinataApiKey = process.env.PINATA_API_KEY;
const pinataSecretApiKey = process.env.PINATA_SECRET_API_KEY;
const pinata = new pinataSDK(pinataApiKey, pinataSecretApiKey);

/**
 * Watermarking utilities
 */
export class WatermarkManager {
  async addWatermark(imageBuffer: Buffer, text: string) {
    try {
      const image = await Jimp.read(imageBuffer);

      // Load default font
      const font = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK);

      // Add watermark text
      image.print(
        font,
        10,
        10,
        {
          text: `${text} - PREVIEW ONLY`,
          alignmentX: Jimp.HORIZONTAL_ALIGN_LEFT,
          alignmentY: Jimp.VERTICAL_ALIGN_TOP,
        } as any,
        image.bitmap.width - 20,
        image.bitmap.height - 20
      );

      // Reduce opacity by adding semi-transparent overlay
      const watermarkOverlay = new Jimp(image.bitmap.width, image.bitmap.height, 0x00000044);
      image.blit(watermarkOverlay, 0, 0);

      return image.getBufferAsync("image/jpeg");
    } catch (error: any) {
      console.log("Watermarking failed, returning original:", error.message);
      // For non-image files, just return original
      return imageBuffer;
    }
  }
}

export const watermarkManager = new WatermarkManager();

/**
 * IPFS upload utilities using Pinata
 */
export async function uploadToIPFS(fileBuffer: Buffer, filename: string) {
  try {
    const options = {
      pinataMetadata: {
        name: filename,
      },
      pinataOptions: {
        cidVersion: 0 as const, // Compatible with standard IPFS CIDs
      },
    };

    // Create a readable stream from buffer
    const bufferStream = Readable.from(fileBuffer);

    const result = await pinata.pinFileToIPFS(bufferStream, options);
    return result.IpfsHash; // This is the CID
  } catch (error: any) {
    console.error("Pinata upload error:", error);
    throw new Error(`IPFS upload failed: ${error.message}`);
  }
}

/**
 * IPFS Database Persistence Functions
 */
export async function saveJobsToIPFS(jobStorage: Map<string, any>) {
  try {
    // Convert Map to array for JSON
    const jobsArray = Array.from(jobStorage.entries()).map(([id, job]) => job);

    const jobsData = {
      jobs: jobsArray,
      lastUpdated: new Date().toISOString(),
      totalJobs: jobsArray.length,
    };

    // Convert to JSON
    const jsonString = JSON.stringify(jobsData, null, 2);
    const buffer = Buffer.from(jsonString);

    // Upload to Pinata
    const bufferStream = Readable.from(buffer);

    const options = {
      pinataMetadata: {
        name: `fairdeal-jobs-${Date.now()}.json`,
      },
      pinataOptions: {
        cidVersion: 0 as const,
      },
    };

    const result = await pinata.pinFileToIPFS(bufferStream, options);
    const latestJobsIPFSCID = result.IpfsHash;

    console.log(`✅ Jobs saved to IPFS: ${latestJobsIPFSCID}`);
    console.log(`📊 Saved ${jobsArray.length} jobs`);

    return latestJobsIPFSCID;
  } catch (error: any) {
    console.error("❌ Error saving jobs to IPFS:", error.message);
    return null;
  }
}

export async function loadJobsFromIPFS(cid: string, jobStorage: Map<string, any>) {
  try {
    if (!cid) {
      console.log("ℹ️ No CID provided, starting with empty database");
      return 0;
    }

    console.log(`📥 Loading jobs from IPFS: ${cid}`);

    // Fetch from IPFS gateway
    const response = await axios.get(`https://gateway.pinata.cloud/ipfs/${cid}`);

    const jobsData = response.data;

    // Restore jobs to Map
    jobsData.jobs.forEach((job: any) => {
      jobStorage.set(job.id, job);
    });

    console.log(`✅ Loaded ${jobsData.jobs.length} jobs from IPFS`);
    console.log(`📅 Last updated: ${jobsData.lastUpdated}`);

    return jobsData.jobs.length;
  } catch (error: any) {
    console.error("❌ Error loading jobs from IPFS:", error.message);
    return 0;
  }
}

export async function createZipFromFiles(files: any[]) {
  const zip = new AdmZip();
  for (const file of files) {
    zip.addFile(file.originalname, file.buffer);
  }
  return zip.toBuffer();
}
