const sequelize = require('../config/sequelize');
const User = require('./User');
const Checkin = require('./Checkin');
const StudyPlan = require('./StudyPlan');
const UserFollow = require('./UserFollow');

// 定义关联关系
User.hasMany(Checkin, { 
  foreignKey: 'user_id', 
  as: 'checkins' 
});
Checkin.belongsTo(User, { 
  foreignKey: 'user_id', 
  as: 'user' 
});

User.hasMany(StudyPlan, { 
  foreignKey: 'user_id', 
  as: 'studyPlans' 
});
StudyPlan.belongsTo(User, { 
  foreignKey: 'user_id', 
  as: 'user' 
});

// 用户关注关系（自关联）
User.belongsToMany(User, {
  through: 'user_follows',
  as: 'following',
  foreignKey: 'follower_id',
  otherKey: 'following_id'
});

User.belongsToMany(User, {
  through: 'user_follows',
  as: 'followers',
  foreignKey: 'following_id',
  otherKey: 'follower_id'
});

module.exports = {
  sequelize,
  User,
  Checkin,
  StudyPlan,
  UserFollow
};
