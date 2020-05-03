'use strict';
const Sequelize = require('sequelize');

// User model
module.exports = (sequelize) => {
  class User extends Sequelize.Model {}
    User.init({
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    firstName: {
      type: Sequelize.STRING,
      allowNull: false,
      validate: {
        notNull: {
          msg: 'Please provide a value for "first name"',
        },
        notEmpty: {
          msg: 'Please provide a value for "first name"',
        }
      }
    },
    lastName: {
      type: Sequelize.STRING,
      allowNull: false,
      validate: {
        notNull: {
          msg: 'Please provide a value for "last name"',
        },
        notEmpty: {
          msg: 'Please provide a value for "last name"',
        }
      }
    },
    emailAddress: {
      type: Sequelize.STRING,
      allowNull: false,
      validate: {
        notNull: {
          msg: 'Please provide a value for "emailAddress"',
        },
        notEmpty: {
          msg: 'Please provide a value for "emailAddress"',
        },
        isEmail: {
          msg: 'Please provide a valid email address',
        },
      },
      unique: { msg: 'Sorry, Email address is already in use.' }
    },
    password: {
      type: Sequelize.STRING,
      allowNull: false,
      validate: {
        notNull: {
          msg: 'Please provide a value for "password"',
        },
        notEmpty: {
          msg: 'Please provide a value for "password"',
        }
      }
    },
    }, { sequelize });
    
    User.associate = (models) => {
      User.hasMany(models.Course, {
        foreignKey: {
          fieldName: "userId",
          allowNull: false
        },
      });
    };

    return User;
};