const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

const allowedOrigins = [
  "https://work-wizards-1014.web.app",
  "https://work-wizards-1014.firebaseapp.com",
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// Middleware
const logger = (req, res, next) => {
  console.log("log: info", req.method, req.url);
  next();
};

const verifyToken = (req, res, next) => {
  const token = req?.cookies?.token;
  if (!token) {
    return res.status(401).send({ message: "unauthorized" });
  }
  jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "unauthorized" });
    }
    req.user = decoded;
    next();
  });
};

// MongoDB configuration
const mongoUSER = process.env.DB_USER;
const mongoPASS = process.env.DB_PASS;

const uri = `mongodb+srv://${mongoUSER}:${mongoPASS}@cluster0.mquj3zk.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
async function run() {
  try {
    const database = client.db("WorkWizards");
    const JobPostCollection = database.collection("JobPost");
    const BidCollection = database.collection("BidJob");

    // ====|| JWT ||====
    app.post("/api/v1/jwt", logger, async (req, res) => {
      const user = req.body;
      console.log("user for token", user);
      const token = jwt.sign(user, process.env.SECRET_KEY, {
        expiresIn: "1h",
      });

      try {
        res.cookie("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production" ? true : false,
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        });
        res.send({ success: true });
      } catch (error) {
        console.error("Error setting token as a cookie:", error);
        res.status(500).send({ error: "Internal Server Error" });
      }
    });

    app.post("/api/v1/logout", async (req, res) => {
      const user = req.body;
      console.log("logging out", user);
      res
        .clearCookie("token", {
          maxAge: 0,
          secure: process.env.NODE_ENV === "production" ? true : false,
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({ success: true });
    });

    // ====|| Jobs API =================
    app.get("/api/v1/job-posts", async (req, res) => {
      const { category, email } = req.query;
      try {
        let query = {};
        if (category) {
          query = { category: category };
        }

        if (email) {
          query = { user_email: email };
        }

        const sortedJobPosts = await JobPostCollection.find(query).toArray();
        res.send(sortedJobPosts);
      } catch (error) {
        console.error("Error while fetching and sorting job posts", error);
        res.status(500).json({ error: "Internal Server Error" });
      }
    });
    app.get(
      "/api/v1/single-job-data",
      logger,
      verifyToken,
      async (req, res) => {
        const { id } = req.query;
        try {
          const jobPost = await JobPostCollection.findOne({
            _id: new ObjectId(id),
          });
          res.send(jobPost);
        } catch (error) {
          console.error("Error while fetching job post", error);
          res.status(500).json({ error: "Internal Server Error" });
        }
      }
    );

    app.put(
      "/api/v1/update-job-post-data",
      logger,
      verifyToken,
      async (req, res) => {
        const { id } = req.query;
        const {
          user_name,
          user_photoURL,
          job_title,
          category,
          deadline,
          description,
          minimum_price,
          maximum_price,
        } = req.body;
        try {
          const jobPost = await JobPostCollection.findOneAndUpdate(
            { _id: new ObjectId(id) },
            {
              $set: {
                job_title: job_title,
                description: description,
                category: category,
                deadline: deadline,
                minimum_price: minimum_price,
                maximum_price: maximum_price,
                user_name: user_name,
                user_photoURL: user_photoURL,
              },
            }
          );
          res.send(jobPost);
        } catch (error) {
          console.error("Error while updating job post", error);
          res.status(500).json({ error: "Internal Se  rver Error" });
        }
      }
    );

    app.delete(
      "/api/v1/delete-job-post",
      logger,
      verifyToken,
      async (req, res) => {
        const { id } = req.query;
        try {
          const jobPost = await JobPostCollection.findOneAndDelete({
            _id: new ObjectId(id),
          });
          res.send(jobPost);
        } catch (error) {
          console.error("Error while deleting job post", error);
          res.status(500).json({ error: "Internal Server Error" });
        }
      }
    );

    app.post("/api/v1/job-post", logger, verifyToken, async (req, res) => {
      const jobData = req.body;
      const result = await JobPostCollection.insertOne(jobData);
      res.status(200).json({ message: "Job data received successfully" });
    });

    // :: Bid API :: --------------------------------

    app.post("/api/v1/job-bid", logger, verifyToken, async (req, res) => {
      const jobData = req.body;
      const result = await BidCollection.insertOne(jobData);
      res.status(200).json({ message: "Bid data received successfully" });
    });

    app.get("/api/v1/job-bid", logger, verifyToken, async (req, res) => {
      const { company_email, email, id } = req.query;
      try {
        let query = {};

        if (company_email) {
          query = { "job_info.user_email": company_email };
        }
        if (email) {
          query = { bidder_email: email };
        }

        if (id) {
          query = { _id: new ObjectId(id) };
        }

        const sortedJobBid = await BidCollection.find(query).toArray();
        res.status(200).send(sortedJobBid);
      } catch (error) {
        console.error("Error while fetching and sorting job posts", error);
        res.status(500).json({ error: "Internal Server Error" });
      }
    });

    app.put(
      "/api/v1/bid-status-update",
      logger,
      verifyToken,
      async (req, res) => {
        const { id } = req.query;
        const { bid_status } = req.body;
        try {
          const bidStatus = await BidCollection.findOneAndUpdate(
            { _id: new ObjectId(id) },
            {
              $set: {
                bid_status: bid_status,
              },
            }
          );
          res.status(200).send(bidStatus);
        } catch (error) {
          console.error("Error while updating job post", error);
          res.status(500).json({ error: "Internal Se  rver Error" });
        }
      }
    );

    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`WorkWizards server running on port ${port}`);
});
