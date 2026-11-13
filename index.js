require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const { createRemoteJWKSet, jwtVerify } = require("jose-cjs");
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

//jwk operation
const JWKS = createRemoteJWKSet(
  new URL(`${process.env.CLIENT_URL}/api/auth/jwks`),
);
//remove this later
console.log("JWKS URL:", `${process.env.CLIENT_URL}/api/auth/jwks`);

const verifyToken = async (req, res, next) => {
  const authHeader = req?.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  //verifying..
  try {
    const { payload } = await jwtVerify(token, JWKS);
    console.log("payload:", payload);
    next();
  } catch (error) {
    console.error("JWT verify failed:", error.code, error.name, error.message);
    return res.status(403).json({
      message: "Forbidden",
      reason: error.code,
      name: error.name,
      detail: error.message,
    });
  }
};

async function run() {
  try {
    // ডেটাবেসের সাথে সংযোগ:
    //await client.connect();

    const db = client.db("wanderlust");
    const destinationCollection = db.collection("destinations");
    const bookingCollection = db.collection("bookings");

    //get all data
    app.get("/destination", async (req, res) => {
      const result = await destinationCollection.find().toArray();
      res.send(result);
    });

    //get single data
    app.get("/destination/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await destinationCollection.findOne(query);
      res.json(result);
    });

    //post form data
    app.post("/destination", verifyToken, async (req, res) => {
      const destinationData = req.body;
      //console.log("Received destination data:", destinationData);
      const result = await destinationCollection.insertOne(destinationData);
      if (!result) {
        return res.status(404).json({ message: "Destination not found" });
      }

      res.json(result);
    });

    //edit data
    app.patch("/destination/:id", verifyToken, async (req, res) => {
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

    //adding booking data
    app.post("/booking", verifyToken, async (req, res) => {
      const bookingData = req.body;
      const result = await bookingCollection.insertOne(bookingData);
      res.json(result);
    });

    //get booking data
    app.get("/booking/:userId", verifyToken, async (req, res) => {
      const { userId } = req.params;
      const result = await bookingCollection.find({ userId: userId }).toArray();
      res.json(result);
    });

    //delete single booking data
    app.delete("/booking/:bookingId", verifyToken, async (req, res) => {
      const { bookingId } = req.params;
      const query = { _id: new ObjectId(bookingId) };
      const result = await bookingCollection.deleteOne(query);
      res.json(result);
    });

    //await client.db("admin").command({ ping: 1 });
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
