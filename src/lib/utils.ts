/**
 * Uses the native width and height of <img> to find the dimensions 
 * of an image
 * @param file 
 * @returns The height and width of the image in pixels
 */
export const getImageDims = (file: File): Promise<{width: number; height: number}> => {
  return new Promise(resolve => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({width: img.naturalWidth, height: img.naturalHeight});
      URL.revokeObjectURL(url);
    }
    img.src = url;
  })
}