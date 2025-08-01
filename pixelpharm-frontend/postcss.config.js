module.exports = {
  plugins: [
    'tailwindcss',
    // Only include autoprefixer if it's available
    ...((() => {
      try {
        require.resolve('autoprefixer');
        return ['autoprefixer'];
      } catch (e) {
        console.log('autoprefixer not found, skipping...');
        return [];
      }
    })()),
  ],
}
