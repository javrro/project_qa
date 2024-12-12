const { app, sequelize } = require('./app');
const PORT = process.env.PORT || 3000;

sequelize.sync({ alter: true }) // or use { alter: true } for less destructive changes
  .then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
      console.log('Database synced successfully');
    });
  })
  .catch(error => {
    console.error('Unable to sync database:', error);
  });