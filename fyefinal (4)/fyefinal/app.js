const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const session = require('express-session');
const router = express.Router();
const Tutor = require('./models/Tutor');

const nodemailer = require('nodemailer');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Use sessions to track logged-in users
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } 
}));

// Serve static files (like HTML, CSS) from the public directory
app.use(express.static('public'));

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/fyesupport', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB');
    initializeAdmin();
}).catch(err => {
    console.error('MongoDB connection error:', err);
});


const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: 'firstyearexperience700@gmail.com',
        pass: 'kijo hikn artw ujyk'
    },
    debug: true,
    logger: true 
});

// Function to send an email
function sendRegistrationEmail(email, username, password) {
    const mailOptions = {
        from: 'firstyearexperience700@gmail.com',
        to: email,
        subject: 'Welcome to Fyesupport',
        text: `Dear ${username},\n\nWelcome to Fyesupport! Your account has been created successfully. Your password is: ${password}\n\nBest regards,\nThe Fyesupport Team`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending email:', error);
            return;
        }
        console.log('Email sent:', info.response);
    });

    transporter.verify(function (error, success) {
        if (error) {
            console.error('Transporter verification failed:', error);
        } else {
            console.log('Email server is ready to send messages');
        }
    });
}


// Define User schema and model
const userSchema = new mongoose.Schema({
    usernumber: { type: String, required: true, unique: true },
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, required: true },
    course: { type: String, required: false },
    notifications: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Announcement' }]
});

const User = mongoose.model('User', userSchema);

// Define Event schema and model
const eventSchema = new mongoose.Schema({
    title: String,
    start: Date,
    description: String,
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

const Event = mongoose.model('Event', eventSchema);

// Define Message schema and model
const messageSchema = new mongoose.Schema({
    content: String,
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    timestamp: { type: Date, default: Date.now }
});

const Message = mongoose.model('Message', messageSchema);

// Define Announcement schema and model
const announcementSchema = new mongoose.Schema({
    title: String,
    message: String,
    date: { type: Date, default: Date.now }
});

const Announcement = mongoose.model('Announcement', announcementSchema);


async function initializeAdmin() {
    try {
        const admin = await User.findOne({ role: 'admin' });

        if (!admin) {
            const hashedPassword = await bcrypt.hash('adminpassword', 10);
            const adminUser = new User({
                usernumber: '10203040',
                username: 'Unathi',
                email: 'us@gmail.com',
                password: hashedPassword,
                role: 'admin'
            });
            await adminUser.save();
            console.log('Admin user added successfully');
        }
    } catch (error) {
        console.error('Error initializing admin user:', error);
    }
}

// Define Student schema and model
const studentSchema = new mongoose.Schema({
    usernumber: { type: String, required: true, unique: true },
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    course: String,
    mentorshipGroup: String,
    groupChatAssigned: { type: Boolean, default: false }
});

const Student = mongoose.model('Student', studentSchema);

app.get('/get-tutors', async (req, res) => {
    try {
        const tutors = await Tutor.find(); // Fetch all tutors from the database
        res.json(tutors.map(tutor => ({
            module: tutor.course, 
            name: tutor.username   
        })));
    } catch (error) {
        console.error('Error fetching tutors:', error);
        res.status(500).json({ message: 'Error fetching tutors' });
    }
});

module.exports = router;
// Add student to mentorship group
app.post('/add-student', async (req, res) => {
    try {
        const { studentName, studentEmail, mentorshipGroup } = req.body;

        // Simple validation check
        if (!studentName || !studentEmail || !mentorshipGroup) {
            throw new Error('All fields are required');
        }

        const newStudent = {
            name: studentName,
            email: studentEmail,
            mentorshipGroup: mentorshipGroup
        };

        // Attempt to insert the student into the database
        const result = await db.collection('students').insertOne(newStudent);
        if (!result.insertedId) {
            throw new Error('Failed to insert student into the database');
        }

        // Redirect after successful insertion
        res.redirect('/student-dashboard');
    } catch (error) {
        console.error('Error adding student:', error.message);
        res.status(500).send('Internal Server Error: ' + error.message);
    }
});

// Route to handle announcement creation
app.post('/create-announcement', (req, res) => {
    const { title, message } = req.body;
    
    if (!title || !message) {
        return res.status(400).json({ error: 'Title and message are required' });
    }

    // Save the announcement in the database
    const newAnnouncement = {
        title: title,
        message: message,
        date: new Date(),
    };

    db.collection('announcements').insertOne(newAnnouncement, (err, result) => {
        if (err) {
            console.error('Error saving announcement:', err);
            return res.status(500).json({ error: 'Failed to save announcement' });
        }
        console.log('Announcement saved:', result);
        return res.status(200).json({ message: 'Announcement created successfully' });
    });
});

// Fetch notifications for logged-in user
app.get('/notifications/:userId', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId).populate('notifications');
        if (user) {
            res.status(200).json(user.notifications);
        } else {
            res.status(404).send('User not found');
        }
    } catch (error) {
        res.status(500).send('Error fetching notifications: ' + error.message);
    }
});




// Serve student dashboard information
app.get('/student-dashboard-info', async (req, res) => {
    if (!req.session.usernumber) {
        return res.status(403).json({ message: 'Unauthorized' });
    }

    const student = await Student.findOne({ usernumber: req.session.usernumber });

    if (student) {
        res.json({ groupChat: student.mentorshipGroup });
    } else {
        res.json({ groupChat: null });
    }
});

// Function to generate a random password
function generateRandomPassword(length = 12) {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+[]{}|;:',.<>?/";
    let password = "";
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * charset.length);
        password += charset[randomIndex];
    }
    return password;
}

// Endpoint to add a mentor
app.post('/add-mentor', async (req, res) => {
    try {
        const { usernumber, username, email, course } = req.body;

        if (!usernumber || !username || !email || !course) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const existingUserByNumber = await User.findOne({ usernumber });
        const existingUserByEmail = await User.findOne({ email });

        if (existingUserByNumber || existingUserByEmail) {
            return res.status(400).json({ message: 'User number or email already exists' });
        }

        const newPassword = generateRandomPassword(); // Generate a unique password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const mentor = new User({
            usernumber,
            username,
            email,
            course,
            password: hashedPassword,
            role: 'mentor'
        });

        await mentor.save();

        // Send email with password
        sendRegistrationEmail(email, username, newPassword);

        res.status(201).json({
            message: 'Mentor added successfully. Password is sent to email.',
            redirect: '/admin-dashboard.html'
        });
    } catch (error) {
        console.error('Error adding mentor:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});


// Endpoint to add a tutor
app.post('/add-tutor', async (req, res) => {
    try {
        const { usernumber, username, email, course } = req.body;

        if (!usernumber || !username || !email || !course) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const existingUserByNumber = await User.findOne({ usernumber });
        const existingUserByEmail = await User.findOne({ email });

        if (existingUserByNumber || existingUserByEmail) {
            return res.status(400).json({ message: 'User number or email already exists' });
        }

        const newPassword = generateRandomPassword(); // Generate a unique password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const tutor = new User({
            usernumber,
            username,
            email,
            course,
            password: hashedPassword,
            role: 'tutor'
        });

        await tutor.save();

        // Send email with password
        sendRegistrationEmail(email, username, newPassword);

        res.status(201).json({
            message: 'Tutor added successfully. Password is sent to email.',
            redirect: '/admin-dashboard.html'
        });
    } catch (error) {
        console.error('Error adding tutor:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});


// Registration endpoint
app.post('/register', async (req, res) => {
    try {
        const { usernumber, username, email, password, role } = req.body;
        
        if (!role || !['student', 'tutor', 'mentor'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role' });
        }
        
        // Check if the user or email already exists
        const existingUser = await User.findOne({ $or: [{ usernumber }, { email }] });
        if (existingUser) {
            return res.status(400).json({ message: 'User number or email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ usernumber, username, email, password: hashedPassword, role });
        await user.save();

        // Send the welcome email only if the user was saved successfully
        sendRegistrationEmail(email, username);

        res.status(201).json({ message: 'User registered successfully', redirect: '/login' });
    } catch (error) {
        console.error('Error during registration:', error);
        res.status(500).json({ message: error.message });
    }
});

// Endpoint to update the user's password
app.post('/update-password', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const { currentPassword, newPassword, confirmPassword } = req.body;

        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({ message: 'New password and confirm password do not match' });
        }

        const user = await User.findById(req.session.userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('Error updating password:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});




// Endpoint to fetch the logged-in user's account details
app.get('/account-settings', async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        const user = await User.findById(req.session.userId, 'username usernumber email');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({
            username: user.username,
            usernumber: user.usernumber,
            email: user.email 
        });
    } catch (error) {
        console.error('Error fetching account settings:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Profile Route
app.get('/profile', async (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/login'); // Redirect if not logged in
    }
    
    try {
        const user = await User.findById(req.session.userId).exec();
        
        if (!user) {
            return res.status(404).send('User not found');
        }

        res.render('profile', {
            username: user.username,
            usernumber: user.usernumber,
            email: user.email,
            password: user.password, // Make sure to handle this securely
            role: user.role
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});


// Login endpoint
app.post('/login', async (req, res) => {
    try {
        const { usernumber, password } = req.body;
        console.log('Received Login Request:', { usernumber, password });

        const user = await User.findOne({ usernumber });
        if (!user) {
            console.log('User not found');
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        console.log('Stored Hashed Password:', user.password);

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log('Password mismatch');
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        req.session.userId = user._id;
        req.session.role = user.role;
        req.session.username = user.username;

        const messages = await Message.find({ userId: user._id }).sort({ timestamp: 1 });

        const redirectUrl = user.role === 'admin' ? '/admin-dashboard' :
                            user.role === 'student' ? '/student-dashboard' :
                            user.role === 'tutor' ? '/tutor-dashboard' :
                            '/mentor-dashboard';

        res.json({ username: user.username, role: user.role, message: 'Login successful', redirect: redirectUrl });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ message: error.message });
    }
});

// Endpoint to send a message
app.post('/messages', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        
        const { content, recipientId } = req.body;

        if (!content || !recipientId) {
            return res.status(400).json({ message: 'Content and recipient ID are required' });
        }

        const message = new Message({
            content,
            sender: req.session.userId,
            recipient: recipientId
        });

        await message.save();
        res.status(201).json(message);
    } catch (error) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
});



// Endpoint to fetch messages for the logged-in user
app.get('/messages', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const messages = await Message.find({
            $or: [
                { sender: req.session.userId },
                { recipient: req.session.userId }
            ]
        }).sort({ timestamp: 1 });

        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Endpoint to send a message and save it to the database
app.post('/send-message', async (req, res) => {
    try {
        const { recipientId, content } = req.body;
        
        if (!req.session.userId) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        if (!content || !recipientId) {
            return res.status(400).json({ message: 'Content and recipient are required' });
        }

        const newMessage = new Message({
            content,
            sender: req.session.userId,  // Logged-in user as sender
            recipient: recipientId,       // The recipient (mentor or student)
        });

        await newMessage.save();

        res.status(201).json({ message: 'Message sent successfully' });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Endpoint to fetch messages for a mentorship group
app.get('/group-chat/:mentorshipGroup', async (req, res) => {
    try {
        const { mentorshipGroup } = req.params;

        if (!req.session.userId) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        // Find users in the same mentorship group
        const studentsAndMentors = await User.find({ mentorshipGroup });

        if (!studentsAndMentors.length) {
            return res.status(404).json({ message: 'No users found in this group' });
        }

        // Find messages between users in the mentorship group
        const userIds = studentsAndMentors.map(user => user._id);
        const messages = await Message.find({
            sender: { $in: userIds },
            recipient: { $in: userIds }
        }).sort({ timestamp: 1 }); // Sort by timestamp in ascending order

        res.json(messages);
    } catch (error) {
        console.error('Error fetching group messages:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});


// Calendar Routes

// Fetch all events for the logged-in user
app.get('/events', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const events = await Event.find({ userId: req.session.userId });
        res.json(events);
    } catch (error) {
        res.status(500).send('Server Error');
    }
});

// Save a new event
app.post('/events', async (req, res) => {
    try {
        const { title, start, description } = req.body;

        if (!req.session.userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const event = new Event({
            title,
            start,
            description,
            userId: req.session.userId
        });

        await event.save();
        res.status(201).json(event);
    } catch (error) {
        res.status(500).send('Server Error');
    }
});

app.delete('/events/:id', (req, res) => {
    const eventId = req.params.id;

    Event.findById(eventId, (err, event) => {
        if (err) return res.status(500).send(err);
        if (!event) return res.status(404).send('Event not found');

        Event.findByIdAndDelete(eventId, (err, result) => {
            if (err) return res.status(500).send(err);
            res.status(200).json({ message: 'Event deleted successfully' });
        });
    });
});

// Endpoint to handle forgot password requests
app.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        
        // Check if the email exists in the system
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'Email not found' });
        }

        // Send an email with the forgotten password
        const mailOptions = {
            from: 'silwehluleunathi@gmail.com',
            to: email,
            subject: 'Your Fyesupport Password',
            text: `Dear ${user.username},\n\nYour password is: ${user.password}\n\nPlease keep this information safe.\n\nBest regards,\nThe Fyesupport Team`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending password email:', error);
                return res.status(500).json({ message: 'Error sending email' });
            }
            console.log('Password email sent:', info.response);

            // Redirect to login page after submission
            res.status(200).json({ message: 'Password has been sent to your email', redirect: '/login' });
        });
    } catch (error) {
        console.error('Error handling forgot password request:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});



// Logout endpoint
app.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ message: 'Failed to logout' });
        }
        res.json({ message: 'Logged out successfully', redirect: '/login' });
    });
});

// Start the server
app.listen(3000, () => {
    console.log('Server is running on port 3000');
});