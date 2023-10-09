import { ImageLoader } from '@angular/common';
import { transformImage } from '@xata.io/client';

export const xataImageLoader: ImageLoader = (config) => {
  return transformImage(config.src, { width: config.width });
};
