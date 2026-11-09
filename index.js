require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
const port = process.env.PORT || 5000;
const URI = process.env.MONGODB_URI;

// middleware
app.use(cors());
app.use(express.json());

const client = new MongoClient(URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
// start
async function run() {
  try {
    // ডেটাবেসের সাথে সংযোগ
    await client.connect();

    const db = client.db("wanderlust");
    const destinationCollection = db.collection("destinations");

    app.post("/destination", async (req, res) => {
      const destinationData = req.body;
      //console.log("Received destination data:", destinationData);
      const result = await destinationCollection.insertOne(destinationData);
      res.send(result);
    });

    // //get users all data
    // app.get("/users", async (req, res) => {
    //   const cursor = usersCollection.find();
    //   const result = await cursor.toArray();
    //   res.send(result);
    // });

    await client.db("admin").command({ ping: 1 });
    console.log("You successfully connected to MongoDB!");
  } catch (err) {
    console.error("MongoDB connection failed:", err);
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

// end
app.get("/", (req, res) => {
  res.send("Hello, World!");
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
