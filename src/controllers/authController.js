const { db, auth } = require('../config/firebaseConfig');

exports.registerUser = async (req, res) => {
    try {
        const { email, password, fullName, role } = req.body;

        const userRecord = await auth.createUser({
            email: email,
            password: password,
            displayName: fullName
        });

        await db.collection('users').doc(userRecord.uid).set({
            fullName,
            email,
            role: role || 'Reader',
            createdAt: new Date().toISOString()
        });

        res.status(201).json({ message: 'User created successfully', userId: userRecord.uid });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.getUserProfile = async (req, res) => {
    try {
        const userId = req.user.uid;
        const doc = await db.collection('users').doc(userId).get();
        
        if (!doc.exists) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json(doc.data());
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};