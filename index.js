require('dotenv').config()
const express = require('express');
const app = express()
const jwt = require('jsonwebtoken');
const cors = require('cors');
const port = process.env.PORT || 5000
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

app.use(cors())
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.5bvaa0x.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

const dbConnect = async () => {
    try {
        console.log("You successfully connected to MongoDB!");
    } catch (error) {
        console.error("Failed to connect to MongoDB", error.massage);
    }
};
dbConnect();


//---------- DB COLLECTION ----------//
const userCollection = client.db('EduPortal').collection('users')
const requestCollection = client.db('EduPortal').collection('request')
const classCollection = client.db('EduPortal').collection('classes')
// const teacherCollection = client.db('EduPortal').collection('teachers')
const reviewCollection = client.db('EduPortal').collection('reviews')
const classReqCollection = client.db('EduPortal').collection('class-req')



//---------- Verify Token ----------//

const verifyToken = async (req, res, next) => {
    if (!req.headers.authorization) { // Add the negation here
        return res.status(401).send({ message: 'Unauthorized Access' })
    }
    const token = req.headers.authorization.split(' ')[1]
    // console.log(token);
    if (!token) {
        return res.status(401).send({ message: 'Unauthorized Access' })
    }
    jwt.verify(
        token, process.env.JWT_TOKEN, (err, decoded) => {
            if (err) {
                return res.status(401).send({ message: 'Unauthorized Access' })
            }
            req.decoded = decoded
            // console.log(req.decoded.email);
            next()
        }
    )
}

//---------- Verify Admin Middleware ----------//

const verifyAdmin = async (req, res, next) => {
    const email = req.decoded.email
    const query = { email: email }
    const user = await userCollection.findOne(query)
    const isAdmin = user?.role === 'admin'
    if (!isAdmin) {
        return res.status(403).send({ message: 'Forbidden Access' })
    }
    next()
}


//---------- Verify Teacher Middleware ----------//
const verifyTeacher = async (req, res, next) => {
    const email = req.decoded.email
    // console.log(email);
    const query = { email: email }
    const user = await userCollection.findOne(query)
    const isTeacher = user?.role === 'teacher'
    if (!isTeacher) {
        return res.status(403).send({ message: 'Forbidden Access' })
    }
    next()
}



//---------- JWT Related API ----------//
app.post('/jwt', async (req, res) => {
    const user = req.body
    const token = jwt.sign(user, process.env.JWT_TOKEN, { expiresIn: '1h' });
    res.send({ token })
})

//============================================================||
//                                                            ||
//                     User Related API                       ||
//                                                            ||
//============================================================||

app.get('/users', verifyToken, verifyAdmin, async (req, res) => {
    const result = await userCollection.find().toArray()
    res.send(result)
})

// app.patch('/users/:id')

app.get('/users/admin/:email', verifyToken, async (req, res) => {
    const email = req.params.email;
    if (email !== req.decoded.email) {
        return res.status(403).send({ message: 'Forbidden Access' });
    }
    const query = { email: email };
    const user = await userCollection.findOne(query);
    const isAdmin = user?.role === 'admin';
    res.send({ admin: isAdmin });
});

//---------- Get Users ----------//
app.post('/users', async (req, res) => {
    const user = req.body
    const query = { email: user.email }
    const existingUser = await userCollection.findOne(query)
    if (existingUser) {
        return res.send({ message: 'user already exists', insertId: null })
    }
    const result = await userCollection.insertOne(user)
    res.send(result)
})

//---------- make teacher by email ----------//
app.patch('/users/:email', verifyToken, verifyAdmin, async (req, res) => {
    const email = req.params.email
    const filter = { email: email }
    const updatedDoc = {
        $set: {
            role: 'teacher'
        }
    }
    const result = await userCollection.updateOne(filter, updatedDoc)
    res.send(result)
})

//---------- make admin by id ----------//
app.patch('/users/admin/:id', verifyToken, verifyAdmin, async (req, res) => {
    const id = req.params.id
    const filter = { _id: new ObjectId(id) }
    const updatedDoc = {
        $set: {
            role: 'admin'
        }
    }
    const result = await userCollection.updateOne(filter, updatedDoc)
    res.send(result)
})

//============================================================||
//                                                            ||
//                     Class Related API                      ||
//                                                            ||
//============================================================||

//---------- Class APIs ----------//
app.get('/classes', async (req, res) => {
    const result = await classCollection.find().toArray()
    res.send(result)
})

//---------- Find Class By id ----------//
app.get('/classes/:id', async (req, res) => {
    const id = req.params.id
    const query = { _id: new ObjectId(id) }
    const result = await classCollection.findOne(query)
    res.send(result)
})

//---------- Approve class ----------//
app.patch('/classes/:id', verifyToken, verifyAdmin, async (req, res) => {
    const update = req.body
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const updateDoc = {
        $set: {
            status: 'approved'
        },
    };
    const result = await classCollection.updateOne(query, updateDoc)
    res.send(result)
})

//---------- Delete class ----------//
app.delete('/classes/:id', async (req, res) => {
    const id = req.params.id
    const query = { _id: new ObjectId(id) }
    const result = await classCollection.deleteOne(query)
    res.send(result)
})

//---------- Get class by teachers mail ----------//
app.get('/classes/teacher/:email', verifyToken, verifyTeacher, async (req, res) => {
    const query = {
        teacher_email: req.params.email
    }
    if (req.params.email !== req.decoded.email) {
        return res.status(403).send({ massage: "Forbidden Access" })
    }
    const result = await classCollection.find(query).toArray()
    res.send(result)
})

//---------- Get classes By Status ----------//
app.get('/classes/status/:status', async (req, res) => {
    const status = req.params.status;
    const query = { status: status }
    const result = await classCollection.find(query).toArray()
    res.send(result);
});

//---------- Reviews APIs ----------//
app.get('/reviews', async (req, res) => {
    const result = await reviewCollection.find().toArray()
    res.send(result)
})

//============================================================||
//                                                            ||
//                     Teacher Related API                    ||
//                                                            ||
//============================================================||

//---------- Find Classes Added by user ----------//
app.get('/users/teacher/:email', verifyToken, async (req, res) => {
    const email = req.params.email;
    if (email !== req.decoded.email) {
        return res.status(403).send({ message: 'Forbidden Access' });
    }
    const query = { email: email };
    const user = await userCollection.findOne(query);
    const isTeacher = user?.role === 'teacher';
    res.send({ teacher: isTeacher });
});

//---------- Get class which is added by user ----------//
app.get('/classes/teacher/:email/:id', verifyToken, verifyTeacher, async (req, res) => {
    const query = {
        teacher_email: req.params.email
    }
    if (query !== req.decoded.email) {
        return res.status(403).send({ message: "Forbidden Access" })
    }
    const id = req.params.id
    const idQuery = { _id: new ObjectId(id) }
    const result = await classCollection.deleteOne(idQuery)
    res.send(result)
})

//---------- Update class which is added by user ----------//
app.patch('/classes/teacher/:email/:id', verifyToken, verifyTeacher, async (req, res) => {
    const teacherEmail = req.params.email;

    if (teacherEmail !== req.decoded.email) {
        console.log('User log out');
        return res.status(403).send({ message: 'Forbidden Access' });
    }

    const item = req.body;
    const id = req.params.id;
    const idQuery = { _id: new ObjectId(id) };

    const updatedDoc = {};
    if (item.title) updatedDoc.title = item.title;
    if (item.banner_image) updatedDoc.banner_image = item.banner_image;
    if (item.price) updatedDoc.price = item.price;
    if (item.category) updatedDoc.category = item.category;
    if (item.short_description) updatedDoc.short_description = item.short_description;

    const newValue = { $set: updatedDoc }

    const result = await classCollection.updateOne(idQuery, newValue);
    res.send(result);
});

//---------- Delete class which is added user ----------//
app.delete('/classes/teacher/:email&:id', verifyToken, verifyTeacher, async (req, res) => {
    const query = {
        teacher_email: req.params.email
    }
    if (req.params.email !== req.decoded.email) {
        return res.status(403).send({ massage: "Forbidden Access" })
    }
    const id = req.params.id
    const idQuery = { _id: new ObjectId(id) }
    const result = await classCollection.deleteOne(idQuery)
    res.send(result)
})

//---------- Post Teacher Request ----------//
app.post('/teacher-req', verifyToken, async (req, res) => {
    const requests = req.body
    const result = await requestCollection.insertOne(requests)
    res.send(result)
})

//---------- Get Teacher Request ----------//
app.get('/teacher-req', verifyToken, verifyAdmin, async (req, res) => {
    const result = await requestCollection.find().toArray()
    res.send(result)
})

//---------- Delete Teacher Request ----------//
app.delete('/teacher-req/:id', verifyToken, verifyAdmin, async (req, res) => {
    const id = req.params.id
    const query = { _id: new ObjectId(id) }
    const result = await requestCollection.deleteOne(query)
    res.send(result)
})

// ------------------------------------ //

app.get('/', (req, res) => {
    res.send('EduPortal')
})
app.listen(port, () => {
    console.log(`EduPortal Teaching at port: ${port}`);
})