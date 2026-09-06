export const imageResizer = async (input: { file: File; width: number; height: number }): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(input.file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = input.width;
      canvas.height = input.height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, input.width, input.height);
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(url);
        if (blob) resolve(blob);
        else reject(new Error('Resize failed'));
      }, input.file.type || 'image/png');
    };
    img.onerror = () => { reject(new Error('Image load failed')); };
    img.src = url;
  });
};

export const imageToBase64 = async (input: { file: File }): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(input.file);
  });
};

export const base64ToImage = async (input: { base64: string; fileName?: string }): Promise<Blob> => {
  const response = await fetch(input.base64);
  const blob = await response.blob();
  return blob;
};

export const pdfTextExtractor = async (input: { file: File }): Promise<string> => {
  return "[PDF Text Extraction requires pdf.js library. Placeholder output.]";
};

export const imageCompressor = async (input: { file: File; quality?: number }): Promise<Blob> => {
  const quality = input.quality ?? 0.8;
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(input.file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(url);
        if (blob) resolve(blob);
        else reject(new Error('Compression failed'));
      }, input.file.type || 'image/jpeg', quality);
    };
    img.onerror = () => reject(new Error('Image load failed'));
    img.src = url;
  });
};

export const fileSizeCalculator = async (input: { bytes: number }): Promise<{ kb: number; mb: number; gb: number }> => {
  return {
    kb: input.bytes / 1024,
    mb: input.bytes / (1024 * 1024),
    gb: input.bytes / (1024 * 1024 * 1024)
  };
};

export const mimeTypeDetector = async (input: { file: File }): Promise<string> => {
  return input.file.type || 'application/octet-stream';
};

export const fileNamer = async (input: { file: File; newName: string }): Promise<string> => {
  const ext = input.file.name.split('.').pop();
  return `${input.newName}.${ext}`;
};

export const imageCropper = async (input: { file: File; x: number; y: number; width: number; height: number }): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(input.file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = input.width;
      canvas.height = input.height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, input.x, input.y, input.width, input.height, 0, 0, input.width, input.height);
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(url);
        if (blob) resolve(blob);
        else reject(new Error('Crop failed'));
      }, input.file.type || 'image/png');
    };
    img.onerror = () => reject(new Error('Image load failed'));
    img.src = url;
  });
};

export const imageRotator = async (input: { file: File; degrees: number }): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(input.file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const angleInRad = (input.degrees * Math.PI) / 180;
      const cos = Math.abs(Math.cos(angleInRad));
      const sin = Math.abs(Math.sin(angleInRad));
      canvas.width = img.naturalWidth * cos + img.naturalHeight * sin;
      canvas.height = img.naturalWidth * sin + img.naturalHeight * cos;
      ctx?.translate(canvas.width / 2, canvas.height / 2);
      ctx?.rotate(angleInRad);
      ctx?.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(url);
        if (blob) resolve(blob);
        else reject(new Error('Rotate failed'));
      }, input.file.type || 'image/png');
    };
    img.onerror = () => reject(new Error('Image load failed'));
    img.src = url;
  });
};
