const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
const cors = require("cors");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = process.env.DB_URI;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  const token = authorization.split(" ")[1];

  if (!authorization) {
    return res
      .status(401)
      .send({ error: true, errorMessage: "unauthorization access" });
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET_KEY, (error, decoded) => {
    if (error) {
      return res
        .status(403)
        .send({ error: true, errorMessage: "forbidden access" });
    }

    req.decoded = decoded;
    next();
  });
};

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    //jwt
    app.post("/access-token", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET_KEY, {
        expiresIn: "1h",
      });
      res.send({ token });
    });

    const database = client.db("Taste_Trackers");

    app.get("/bestChefs", async (req, res) => {
      const bestChefs = database.collection("bestChefs");
      const cursor = bestChefs.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/bestChef/:id", verifyJWT, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const bestChefs = database.collection("bestChefs");
      const result = await bestChefs.findOne(query);
      res.send(result);
    });

    app.get("/mealCategories", async (req, res) => {
      const mealCategories = database.collection("mealCategories");
      const cursor = mealCategories.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Taste Trackers Server is running!");
});

app.listen(port, () => {
  console.log(`Taste Trackers Server app listening on port ${port}`);
});
