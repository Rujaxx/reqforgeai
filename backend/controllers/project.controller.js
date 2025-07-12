const ProjectModel = require('../models/project.model');
const { deleteImage } = require('../services/cloudinary');

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

exports.deleteProject = async(req, res) => {
    const { id } = req.params;
    try {
        const project = await ProjectModel.findByIdAndDelete(id);
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        // Optionally, delete associated files from cloudinary
        project.screens.forEach(screen => {
            deleteImage(screen.image.public_id); // Implement this function as needed
        });
        res.status(200).json({ message: 'Project deleted successfully' });
    } catch (error) {
        console.error('Error deleting project:', error);
        res.status(500).json({ error: 'Failed to delete project' });
    }
}

exports.deleteScreen = async(req, res) => {
    try {
        const { id } = req.params;
        const findProject = await ProjectModel.findOne({ 'screens._id': id });
        if (!findProject) {
            return res.status(404).json({ error: 'Project not found' });
        }
        // delete the file from the cloudinary
        const screen = findProject.screens.find((screen) => screen._id.toString() === id);
        if (!screen) {
            return res.status(404).json({ error: 'Screen not found' });
        }
        deleteImage(screen.image.public_id);
        const project = await ProjectModel.findOneAndUpdate({ 'screens._id': id },{
            $pull: { screens: { _id: id } }
        }, {
            new: true,
            runValidators: true
        });
        res.status(200).json({ message: 'Screen deleted successfully', project });
    } catch (error) {
        console.error('Error deleting screen:', error);
        res.status(500).json({ error: 'Failed to delete screen' });
    }
}