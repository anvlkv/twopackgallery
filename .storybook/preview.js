import StageDecorator from './stage';
import TheatreSheetDecorator from './theatre'

import '../public/style.css'

export const decorators = [TheatreSheetDecorator, StageDecorator];

export const parameters = {
  actions: { argTypesRegex: "^on[A-Z].*" },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
}

