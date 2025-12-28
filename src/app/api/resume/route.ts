import { client } from "@/sanity/lib/client";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const assetId = searchParams.get("assetId");

    if (!assetId) {
      return NextResponse.json(
        { error: "Asset ID is required" },
        { status: 400 }
      );
    }

    // Fetch the file asset from Sanity
    const fileAsset = await client.fetch(
      `*[_id == $assetId][0]{
        url,
        originalFilename,
        mimeType
      }`,
      { assetId }
    );

    if (!fileAsset || !fileAsset.url) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    return NextResponse.json({
      url: fileAsset.url,
      filename: fileAsset.originalFilename,
      mimeType: fileAsset.mimeType,
    });
  } catch (error) {
    console.error("Error fetching resume file:", error);
    return NextResponse.json(
      { error: "Failed to fetch resume file" },
      { status: 500 }
    );
  }
}
