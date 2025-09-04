import { auth } from "@clerk/nextjs/server"
import { v2 as cloudinary } from "cloudinary"

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 })

    const contentType = req.headers.get("content-type") || ""
    if (!contentType.includes("multipart/form-data")) {
      return Response.json({ error: "Content-Type must be multipart/form-data" }, { status: 400 })
    }

    const formData = await req.formData()
    const file = formData.get("file")
    if (!(file instanceof File)) {
      return Response.json({ error: "No file provided" }, { status: 400 })
    }

    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    })

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const result = await new Promise<{ secure_url: string; public_id?: string }>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream({ folder: "chat-attachments" }, (err, res) => {
        if (err || !res) return reject(err)
        resolve({ secure_url: res.secure_url, public_id: res.public_id })
      })
      uploadStream.end(buffer)
    })

    return Response.json({ url: result.secure_url, publicId: result.public_id })
  } catch (err: unknown) {
    const e = err as { statusCode?: number; message?: string }
    return Response.json({ error: e?.message || "Upload failed" }, { status: 500 })
  }
}
