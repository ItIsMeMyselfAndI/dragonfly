interface FileLike {
  arrayBuffer(): Promise<ArrayBuffer>;
  type: string;
}

export class ImageProcessor {
  static async toBase64(image: FileLike): Promise<{ data: string; mimeType: string }> {
    const buffer = Buffer.from(await image.arrayBuffer());
    return {
      data: buffer.toString("base64"),
      mimeType: image.type,
    };
  }

  static async toBuffer(image: FileLike): Promise<Buffer> {
    return Buffer.from(await image.arrayBuffer());
  }

  static getMimeType(fileName: string): string {
    const extension = fileName.toLowerCase().split(".").pop();
    const mimeTypes: Record<string, string> = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      webp: "image/webp",
      svg: "image/svg+xml",
    };

    return mimeTypes[extension || ""] || "image/png";
  }

  static isValidImageType(mimeType: string): boolean {
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    return validTypes.includes(mimeType);
  }

  static getImageDimensions(buffer: Buffer): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.onerror = (error) => {
        reject(error);
      };
      img.src = `data:image/png;base64,${buffer.toString("base64")}`;
    });
  }
}