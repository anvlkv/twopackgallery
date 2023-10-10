import { ImageLoader } from '@angular/common';
import { transformImage } from '@xata.io/client';

export const xataImageLoader: ImageLoader = (config) => {
  return config.width
    ? transformImage(config.src, { width: config.width })
    : config.src;
};
