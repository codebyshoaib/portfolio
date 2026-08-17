import { NextResponse } from "next/server";
import { client } from "@/sanity/lib/client";

// Same ordering as the hero's query, so a bare /api/resume and the hero
// download button always hand out the same file.
const ACTIVE_RESUME = `*[_type == "resume" && defined(resumeFile.asset)]
  | order(isActive desc, uploadDate desc)[0]
  .resumeFile.asset->{url, originalFilename}`;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const assetId = searchParams.get("assetId");

    // No assetId: this is a plain link (recruiter view, terminal `download cv`).
    // Redirect to the active resume rather than making the caller do two hops.
    if (!assetId) {
      const active = await client.fetch(ACTIVE_RESUME);

      if (!active?.url) {
        return NextResponse.json({ error: "File not found" }, { status: 404 });
      }

      // ?dl= makes Sanity's CDN send Content-Disposition: attachment.
      return NextResponse.redirect(
        `${active.url}?dl=${encodeURIComponent(active.originalFilename ?? "resume.pdf")}`,
        307,
      );
    }

    // Fetch the file asset from Sanity
    const fileAsset = await client.fetch(
      `*[_id == $assetId][0]{
        url,
        originalFilename,
        mimeType
      }`,
      { assetId },
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
      { status: 500 },
    );
  }
}
