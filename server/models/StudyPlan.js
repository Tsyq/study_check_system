const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const StudyPlan = sequelize.define('StudyPlan', {
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
  title: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    defaultValue: ''
  },
  subject: {
    type: DataTypes.STRING,
    allowNull: false
  },
  target: {
    type: DataTypes.STRING,
    allowNull: false
  },
  start_date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  end_date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  total_hours: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  completed_hours: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  daily_goal: {
    type: DataTypes.INTEGER,
    defaultValue: 60
  },
  milestones: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  reminders: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  progress: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  is_completed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  tags: {
    type: DataTypes.JSON,
    defaultValue: []
  }
}, {
  tableName: 'study_plans',
  indexes: [
    {
      fields: ['user_id', 'created_at']
    },
    {
      fields: ['end_date']
    },
    {
      fields: ['subject']
    }
  ]
});

// 实例方法
StudyPlan.prototype.getProgressPercentage = function() {
  if (this.total_hours === 0) return 0;
  return Math.round((this.completed_hours / this.total_hours) * 100);
};

StudyPlan.prototype.updateProgress = async function(date, studyTime, notes = '') {
  const existingProgress = this.progress.find(p => 
    new Date(p.date).toDateString() === date.toDateString()
  );
  
  if (existingProgress) {
    existingProgress.study_time += studyTime;
    existingProgress.notes = notes;
  } else {
    this.progress.push({ 
      date: date.toISOString(), 
      study_time: studyTime, 
      notes 
    });
  }
  
  this.completed_hours = parseFloat(this.completed_hours) + (studyTime / 60);
  
  if (this.completed_hours >= this.total_hours && !this.is_completed) {
    this.is_completed = true;
  }
  
  return this.save();
};

StudyPlan.prototype.addMilestone = async function(title, description, targetDate) {
  this.milestones.push({ 
    title, 
    description, 
    target_date: targetDate.toISOString(),
    is_completed: false
  });
  return this.save();
};

StudyPlan.prototype.completeMilestone = async function(milestoneId) {
  const milestone = this.milestones.find(m => m.id === milestoneId);
  if (milestone) {
    milestone.is_completed = true;
    milestone.completed_at = new Date().toISOString();
    return this.save();
  }
  return Promise.reject(new Error('里程碑不存在'));
};

module.exports = StudyPlan;