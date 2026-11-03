let appPromise = null;

module.exports = async (req, res) => {
  if (!appPromise) {
    appPromise = import('../wardrowave-backend/src/app.js').then((m) => {
      const createApp = m.createApp || m.default;
      return createApp();
    });
  }
  const app = await appPromise;
  return app(req, res);
};
