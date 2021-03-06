// Update with your config settings.

require('dotenv').load();

module.exports = {

  development: {
    client: 'pg',
    connection: process.env.DATABASE_URL || 'postgres://localhost/my_db'
  },

  production: {
    client: 'pg',
    connection: process.env.DATABASE_URL
  }

};
