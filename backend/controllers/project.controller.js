const ProjectModel = require('../models/project.model');

exports.createAndStoreNewProject = async(req,res) =>{
    try {
         const { name, description } = req.body;
        const newProject = await ProjectModel.create({
            name,description
        });
        res.status(201).json(newProject);
    } catch (error) {
        console.error('Error creating new project:', error);
        res.status(500).json({ error: 'Failed to create project' });
    }
}

exports.getProject= async(req, res) => {
    const { id } = req.params;
    try {
        const project = await ProjectModel.findById(id);
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        res.status(200).json(project);
    } catch (error) {
        console.error('Error fetching project:', error);
        res.status(500).json({ error: 'Failed to fetch project' });
    }
}

exports.getAllProjects = async(req, res) => {
    try {
        const projects = await ProjectModel.find();
        res.status(200).json(projects);
    } catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
}