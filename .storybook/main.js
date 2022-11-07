module.exports = {
  "stories": [
    "../**/*.stories.mdx",
    "../**/*.stories.@(js|jsx|ts|tsx)"
  ],
  "addons": [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-interactions"
  ],
  "framework": "@storybook/react",
  "core": {
    "builder": "@storybook/builder-webpack5"
  },
  webpackFinal: (config, {configType}) => {
    const path  = require('path');

    config.module.rules.push({
      test: /\.(s)css$/,
      use: ['style-loader', 'css-loader?modules=true', 'sass-loader'],
      include: path.resolve(__dirname, '../'),
    });
    
    return config;
  },
}