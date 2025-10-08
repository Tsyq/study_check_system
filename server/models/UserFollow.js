const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const UserFollow = sequelize.define('UserFollow', {
  follower_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  following_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'user_follows',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['follower_id', 'following_id']
    }
  ]
});

module.exports = UserFollow;