import StageDecorator, {CanvasStyleDecorator} from './stage';

import '../sass/style.scss'

export const decorators = [StageDecorator, CanvasStyleDecorator];

export const parameters = {
  actions: { argTypesRegex: "^on[A-Z].*" },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
}

