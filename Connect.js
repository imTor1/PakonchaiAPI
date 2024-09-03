const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const app = express();

app.use(bodyParser.json());


const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, 
    fileFilter: (req, file, cb) => {
        const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPEG, JPG, PNG are allowed.'));
        }
    }
});


app.use('/uploads', express.static(uploadsDir));
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '123_321',
    database: 'pakonchaidatabase'
});

db.connect((err) => {
    if (err) {
        throw err;
    }
    console.log('MySQL Connected...');
});


app.get('/computers', (req, res) => {
    const sql = 'SELECT * FROM Computers';

    db.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send({ status: 'error', message: 'Database query failed' });
        }

        const updatedResults = results.map(computer => {
            return {
                ...computer,
                Image: computer.Image ? `http://10.13.4.124:3000/uploads/${path.basename(computer.Image)}` : null
            };
        });

        res.send({
            status: 'success',
            data: updatedResults
        });
    });
});


app.post('/addComputer', upload.single('Image'), (req, res) => {
    const { BrandName, ModelName, SerialNumber, Quantity, Price, CPU_Speed_GHz, Memory_GB, HDD_Capacity_GB } = req.body;
    

    const Image = req.file ? `/uploads/${req.file.filename}` : null;


    if (!BrandName || !ModelName || !SerialNumber || !Quantity || !Price || !CPU_Speed_GHz || !Memory_GB || !HDD_Capacity_GB) {
        return res.status(400).send({ status: 'error', message: 'All fields are required' });
    }

    const computer = {
        Image,
        BrandName,
        ModelName,
        SerialNumber,
        Quantity,
        Price,
        CPU_Speed_GHz,
        Memory_GB,
        HDD_Capacity_GB
    };


    const sql = 'INSERT INTO Computers SET ?';

    db.query(sql, computer, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send({ status: 'error', message: 'Database insertion failed' });
        }
        res.send({
            status: 'success',
            message: 'Computer data added successfully',
            data: result
        });
    });
});


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
