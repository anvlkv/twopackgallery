import { ImageLoader } from "@angular/common";

// https://us-east-1.storage.xata.sh/transform/rotate=180,height=100,format=webp/4u1fh2o6p10blbutjnphcste94

const base = 'https://eu-west-1.storage.xata.sh/';
export const xataImageLoader: ImageLoader = (config) => {
  if (!config.width) {
    return config.src
  }
  else {
    const id = config.src.split(base)[1];
    return `${base}transform/width=${config.width}/${id}`
  }
}