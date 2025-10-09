const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const Checkin = sequelize.define('Checkin', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      len: [1, 500]
    }
  },
  study_time: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 0
    }
  },
  subject: {
    type: DataTypes.STRING,
    allowNull: false
  },
  images: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  mood: {
    type: DataTypes.ENUM('excited', 'happy', 'normal', 'tired', 'frustrated'),
    defaultValue: 'normal'
  },
  location: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  likes: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  comments: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  is_public: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  tags: {
    type: DataTypes.JSON,
    defaultValue: []
  }
}, {
  tableName: 'checkins',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['user_id', 'created_at']
    },
    {
      fields: ['created_at']
    },
    {
      fields: ['subject']
    }
  ]
});

// 实例方法
Checkin.prototype.addLike = async function(userId) {
  const existingLike = this.likes.find(like => like.user_id === userId);
  if (!existingLike) {
    this.likes.push({ 
      user_id: userId, 
      created_at: new Date() 
    });
    return this.save();
  }
  return Promise.resolve(this);
};

Checkin.prototype.removeLike = async function(userId) {
  this.likes = this.likes.filter(like => like.user_id !== userId);
  return this.save();
};

Checkin.prototype.addComment = async function(userId, content) {
  this.comments.push({ 
    user_id: userId, 
    content, 
    created_at: new Date() 
  });
  return this.save();
};

module.exports = Checkin;