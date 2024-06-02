require('dotenv').config()
const express = require('express');
const app = express()
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


// DB COLLECTION
const userCollection = client.db('EduPortal').collection('users')
const classCollection = client.db('EduPortal').collection('classes')
const reviewCollection = client.db('EduPortal').collection('reviews')

// User APIs
app.get('/users', async (req, res) => {
    const result = await userCollection.find().toArray()
})

app.post('/users', async (req, res) => {
    const user = req.body

    const result = await userCollection.insertOne(user)
})

// Class APIs
app.get('/classes', async (req, res) => {
    const result = await classCollection.find().toArray()
    res.send(result)
})

app.get('/classes/:id', async (req, res) => {
    const id = req.params.id
    const query = { _id: new ObjectId(id) }
    const result = await classCollection.findOne(query)
    res.send(result)
})

// Reviews APIs
app.get('/reviews', async (req, res) => {
    const result = await reviewCollection.find().toArray()
    res.send(result)
})





// ---------------- //

app.get('/', (req, res) => {
    res.send('EduPortal')
})
app.listen(port, () => {
    console.log(`EduPortal Teaching at port: ${port}`);
})