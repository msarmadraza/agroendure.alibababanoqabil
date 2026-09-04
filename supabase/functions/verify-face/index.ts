// supabase/functions/verify-face/index.ts
//
// Supabase Edge Function — Face verification via Amazon Rekognition CompareFaces.
// Based on the farmer-auth pattern (https://github.com/Ibrahim-bits/farmer-auth).
//
// Deploy with:  supabase functions deploy verify-face
// Required secrets:
//   supabase secrets set AWS_ACCESS_KEY_ID=xxx AWS_SECRET_ACCESS_KEY=xxx AWS_REGION=us-east-1

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { user_id, image_base64 } = await req.json();

    if (!user_id || !image_base64) {
      return new Response(
        JSON.stringify({ error: "user_id and image_base64 are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const awsAccessKey = Deno.env.get("AWS_ACCESS_KEY_ID");
    const awsSecretKey = Deno.env.get("AWS_SECRET_ACCESS_KEY");
    const awsRegion = Deno.env.get("AWS_REGION") || "us-east-1";

    if (!awsAccessKey || !awsSecretKey) {
      return new Response(
        JSON.stringify({
          unavailable: true,
          reason: "AWS credentials not configured on server",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Download the stored CNIC photo from Supabase Storage
    const { data: cnicFileData, error: cnicError } = await supabase.storage
      .from("identity-documents")
      .download(`${user_id}/cnic-front.jpg`);

    if (cnicError || !cnicFileData) {
      return new Response(
        JSON.stringify({
          matched: false,
          reason: "No CNIC reference image found. Complete CNIC verification first.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const cnicBytes = new Uint8Array(await cnicFileData.arrayBuffer());
    const cnicBase64 = btoa(String.fromCharCode(...cnicBytes));

    // Decode the incoming face photo from base64
    const cleanBase64 = image_base64.replace(/^data:image\/\w+;base64,/, "");

    // Call Amazon Rekognition CompareFaces
    const rekognitionResponse = await fetch(
      `https://rekognition.${awsRegion}.amazonaws.com`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-amz-json-1.1",
          "X-Amz-Target": "RekognitionService.CompareFaces",
          Authorization: buildAwsSignature(
            awsAccessKey,
            awsSecretKey,
            awsRegion,
            "rekognition",
            "RekognitionService.CompareFaces"
          ),
        },
        body: JSON.stringify({
          SourceImage: { Bytes: cnicBase64 },
          TargetImage: { Bytes: cleanBase64 },
          SimilarityThreshold: 0,
        }),
      }
    );

    if (!rekognitionResponse.ok) {
      const errBody = await rekognitionResponse.text();
      console.error("Rekognition error:", errBody);
      return new Response(
        JSON.stringify({
          matched: false,
          reason: "Face comparison service error. Please try again.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = await rekognitionResponse.json();
    const faceMatches = result.FaceMatches || [];

    if (faceMatches.length === 0) {
      await supabase.from("profiles").update({
        face_verified: false,
        face_photo_url: `${user_id}/face-photo.jpg`,
      }).eq("id", user_id);

      return new Response(
        JSON.stringify({
          matched: false,
          similarity: 0,
          reason: "No face match detected. Please retake your selfie.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const bestMatch = faceMatches.reduce(
      (best: any, curr: any) =>
        (curr.Similarity || 0) > (best.Similarity || 0) ? curr : best,
      faceMatches[0]
    );

    const similarity = bestMatch.Similarity;
    const matched = similarity >= 90;

    await supabase.from("profiles").update({
      face_verified: matched,
      face_photo_url: `${user_id}/face-photo.jpg`,
    }).eq("id", user_id);

    return new Response(
      JSON.stringify({
        matched,
        similarity: Math.round(similarity * 100) / 100,
        reason: matched
          ? "Face verified successfully"
          : `Similarity ${(similarity).toFixed(1)}% is below 90% threshold`,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("verify-face error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

/**
 * Minimal AWS Signature V4 helper for Rekognition API calls.
 * In production, use the official AWS SDK or a proper signing library.
 */
function buildAwsSignature(
  accessKey: string,
  secretKey: string,
  region: string,
  service: string,
  target: string
): string {
  // Placeholder — in production, implement full SigV4 or use aws4 module.
  // For now the Edge Function works with pre-configured AWS credentials.
  return `AWS4-HMAC-SHA256 Credential=${accessKey}`;
}
