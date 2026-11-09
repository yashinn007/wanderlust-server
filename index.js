require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
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

    //get all data
    app.get("/destination", async (req, res) => {
      const result = await destinationCollection.find().toArray();
      res.send(result);
    });

    //get single data
    app.get("/destination/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await destinationCollection.findOne(query);
      res.send(result);
    });

    //post form data
    app.post("/destination", async (req, res) => {
      const destinationData = req.body;
      //console.log("Received destination data:", destinationData);
      const result = await destinationCollection.insertOne(destinationData);
      if (!result) {
        return res.status(404).json({ message: "Destination not found" });
      }

      res.json(result);
    });

    //edit data
    app.patch("/destination/:id", async (req, res) => {
      const id = req.params.id;
      const updatedData = req.body;
      const query = { _id: new ObjectId(id) };
      const result = await destinationCollection.updateOne(query, {
        $set: updatedData,
      });
      res.json(result);
    });

    //delete data
    app.delete("/destination/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await destinationCollection.deleteOne(query);
      res.send(result);
    });

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
