const express = require('express')
const cors = require('cors')
const app = express()
require('dotenv').config()
const port = process.env.PORT || 5300
const { MongoClient, ServerApiVersion } = require('mongodb')

// middlewares
app.use(cors(({
  origin: [
    "http://localhost:5173",
    "https://eclipse-wrist-server.vercel.app"
  ]
})))
app.use(express.json())

// MongoDB stetup
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xkofs.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true
  }
})

async function run () {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });

    const watchesCollection = client
      .db('eclipsewristDB')
      .collection('watchesCollection')

    const usersCollection = client.db('eclipsewristDB').collection('usersCollection');

    app.get('/watches', async (req, res) => {
      const page = parseInt(req.query.page)
      const size = parseInt(req.query.size)
      const result = await watchesCollection
        .find()
        .skip(page * size)
        .limit(size)
        .toArray()
      res.send(result);
    })

    app.get('/pagination', async (req, res) => {
      const count = await watchesCollection.estimatedDocumentCount()
      res.send({ count });
    })

    app.get('/sortWatches', async (req, res) => {
      const filter = req.query;
        const query = {};
        const options = {
            sort:{
                price: filter.sort === 'asc' ? 1 : -1
            }
        }
        const result = await watchesCollection.find(query, options).toArray();
        res.send(result);
    })

    app.get('/searchWatches', async (req, res) => {
      const filter = req.query.search
      const query = {
        name: { $regex: filter, $options: 'i' }
      }
      const result = await watchesCollection.find(query).toArray()
      res.send(result);
    })

    app.get('/watchesCount', async (req, res) => {
      const count = await watchesCollection.estimatedDocumentCount()
      res.send({ count });
    })

    app.post('/user', async(req, res) => {
      const user = req.body;
      const query = { email: user?.email }
      const existingUser = await usersCollection.findOne(query)
      if (existingUser) {
        return res.send({ message: 'Users already exist', insertedId: null })
      }
      const result = await usersCollection.insertOne(user);
      res.send(result);
    })

    console.log(
      'Pinged your deployment. You successfully connected to MongoDB!'
    )
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir)

app.get('/', (req, res) => {
  res.send('EclipseWrist server is running')
})

app.listen(port, () => {
  console.log(`EclipseWrist server is running on port ${port}`)
})
