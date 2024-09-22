const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the Tutor schema
const tutorSchema = new Schema({
    usernumber: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    username: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    course: {
        type: String,
        required: true,
        trim: true
    },
    // Add other fields as needed, e.g., password, profile details
});

// Create the Tutor model
const Tutor = mongoose.model('Tutor', tutorSchema);

module.exports = Tutor;
