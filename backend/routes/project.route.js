const express = require('express');
const router = express.Router();
const { createAndStoreNewProject, getProject, getAllProjects, deleteProject, deleteScreen } = require('../controllers/project.controller');

// POST /projects - Create a new project
router.post('/', createAndStoreNewProject);

// GET /projects/:id - Get a project by ID
// DELETE /projects/:id - Delete a project by ID
router.route('/:id')
    .get(getProject)
    .delete(deleteProject);
// GET /projects - Get all projects
router.get('/', getAllProjects);

// DELETE /projects/screen/:id - Delete a specific screen from a project
router.delete("/screen/:id", deleteScreen);

module.exports = router;