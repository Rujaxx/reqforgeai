const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  screens: [
    {
      screen: {
        type: String,
        required: false,
      },
      image: {
        public_id: { type: String },    // Required for deletion/transformation
        secure_url: { type: String },  // HTTPS URL for displaying images
        created_at: { type: String }   // Upload timestamp
      }
    },
  ],
}, {
  timestamps: true,
});

const Project = mongoose.model('Project', projectSchema);

module.exports = Project;