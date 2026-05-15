/**
 * Expo uses the `babel-preset-expo` preset, which configures Metro for
 * TypeScript, JSX, and other platform defaults used in this course project.
 *
 * Metro's transform worker (jest-worker child) can fail to resolve the bare
 * name `babel-preset-expo`; anchoring to this config's directory fixes that.
 */
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      require.resolve('babel-preset-expo', { paths: [__dirname] }),
    ],
  };
};
