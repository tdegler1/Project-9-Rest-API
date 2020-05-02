//Instantiate an instance of the Sequelize class and configure the instance to use the fsjstd-restapi.db SQLite database
const Sequelize = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: 'fsjstd-restapi.db',
  logging: false // disable logging to the console when running.
});

const db = {
  sequelize,
  Sequelize,
  models: {},
};

db.models.User = require('./models/user.js')(sequelize);
db.models.Course = require('./models/course.js')(sequelize);

// Loop through all models and check whether they have an associate function. If yes, establish relations between the multiple models.
Object.keys(db.models).forEach((modelName) => {
  if (db.models[modelName].associate) {
    console.info(`Configuring the associations for the ${modelName} model...`);
    db.models[modelName].associate(db.models);
  }
});

module.exports = db;