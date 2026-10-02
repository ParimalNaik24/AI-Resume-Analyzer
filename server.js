require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');

const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const resumesRoutes = require('./routes/resumes');
const resumeAnalysisRoutes = require('./routes/resumeAnalysis');
const jobDescriptionsRoutes = require('./routes/jobDescriptions');
const skillsRoutes = require('./routes/skills');
const jobSkillsRoutes = require('./routes/jobSkills');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev_secret_change_me',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 8, // 8 hours
      httpOnly: true,
    },
  })
);

// Serve the frontend
app.use(express.static(path.join(__dirname, 'public')));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/resumes', resumesRoutes);
app.use('/api/resume-analysis', resumeAnalysisRoutes);
app.use('/api/job-descriptions', jobDescriptionsRoutes);
app.use('/api/skills', skillsRoutes);
app.use('/api/job-skills', jobSkillsRoutes);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
