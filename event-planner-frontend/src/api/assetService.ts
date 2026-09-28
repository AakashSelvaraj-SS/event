// Mock service for 3D Assets processing
export const assetService = {
  generate3DFromImage: async (imageFile: File) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          status: 'success',
          assetId: 'new_' + Date.now(),
          preview: URL.createObjectURL(imageFile)
        });
      }, 3000);
    });
  },
  
  getAssets: async () => {
    const { mockAssets } = await import('../mock/mockData');
    return new Promise((resolve) => setTimeout(() => resolve(mockAssets), 500));
  }
};
