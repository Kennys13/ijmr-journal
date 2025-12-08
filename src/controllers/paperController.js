const { db } = require('../config/firebaseConfig');

exports.submitPaper = async (req, res) => {
    try {
        const { title, domain, author, abstract, email } = req.body;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ message: 'No manuscript file uploaded' });
        }

        const paperData = {
            title,
            domain,
            author,
            email,
            abstract,
            fileName: file.filename,
            filePath: file.path,
            status: 'Under Review',
            submittedAt: new Date().toISOString()
        };

        const docRef = await db.collection('submissions').add(paperData);

        res.status(201).json({ 
            message: 'Paper submitted successfully', 
            id: docRef.id 
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getArchives = async (req, res) => {
    try {
        const snapshot = await db.collection('archives').orderBy('year', 'desc').get();
        const papers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).json(papers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};