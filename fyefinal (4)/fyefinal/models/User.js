const userSchema = new mongoose.Schema({
    usernumber: { type: String, required: true, unique: true },
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, required: true },
    course: { type: String, required: false } // Use 'course' instead of 'module'
});
