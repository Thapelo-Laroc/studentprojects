const bcrypt = require('bcrypt');

async function generateHashedPassword() {
    const password = 'MentorTutor123';
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Hashed Password:', hashedPassword);
}

generateHashedPassword();
