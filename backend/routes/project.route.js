const express = require('express');
const router = express.Router();
const { createAndStoreNewProject, getProject, getAllProjects } = require('../controllers/project.controller');

// POST /projects - Create a new project
router.post('/', createAndStoreNewProject); 
// GET /projects/:id - Get a project by ID
router.get('/:id', getProject);
// GET /projects - Get all projects
router.get('/', getAllProjects);

module.exports = router;