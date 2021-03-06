var express = require("express");
var path = require("path");
var bodyParser = require("body-parser");
var mongodb = require("mongodb");
var ObjectID = mongodb.ObjectID;

var PRODUCTS_COLLECTION = "products";

var app = express();
app.use(express.static(__dirname + "/public"));
app.use(bodyParser.json());

// Create a database variable outside of the database connection callback to reuse the connection pool in your app.
var db;

// Connect to the database before starting the application server.
mongodb.MongoClient.connect(process.env.MONGODB_URI, function (err, database) {
    if (err) {
        console.log(err);
        process.exit(1);
    }

    // Save database object from the callback for reuse.
    db = database;
    console.log("Database connection ready");

    // Initialize the app.
    var server = app.listen(process.env.PORT || 8080, function () {
        var port = server.address().port;
        console.log("App now running on port", port);
    });
});

// PRODUCTS API ROUTES BELOW

// Generic error handler used by all endpoints.
function handleError(res, reason, message, code) {
    console.log("ERROR: " + reason);
    res.status(code || 500).json({"error": message});
}

/*  "/products"
 *    GET: finds all products
 *    POST: creates a new product
 */

app.get("/products", function(req, res) {
    db.collection(PRODUCTS_COLLECTION).find({}).toArray(function(err, docs) {
        if (err) {
            handleError(res, err.message, "Failed to get products.");
        } else {
            res.status(200).json(docs);
        }
    });
});

app.post("/products", function(req, res) {
    var newProduct = req.body;
    newProduct.createDate = new Date();

    if (!(req.body.category && req.body.manufacturer && req.body.name)) {
        handleError(res, "Invalid user input", "Must provide category, manufacturer and name.", 400);
    }

    db.collection(PRODUCTS_COLLECTION).insertOne(newProduct, function(err, doc) {
        if (err) {
            handleError(res, err.message, "Failed to create new product.");
        } else {
            res.status(201).json(doc.ops[0]);
        }
    });
});

/*  "/products/:id"
 *    GET: find product by id
 *    PUT: update product by id
 *    DELETE: deletes product by id
 */

app.get("/products/:id", function(req, res) {
    db.collection(PRODUCTS_COLLECTION).findOne({ _id: new ObjectID(req.params.id) }, function(err, doc) {
        if (err) {
            handleError(res, err.message, "Failed to get product");
        } else {
            res.status(200).json(doc);
        }
    });
});

app.put("/products/:id", function(req, res) {
    var updateDoc = req.body;
    delete updateDoc._id;

    db.collection(PRODUCTS_COLLECTION).updateOne({_id: new ObjectID(req.params.id)}, updateDoc, function(err, doc) {
        if (err) {
            handleError(res, err.message, "Failed to update product");
        } else {
            res.status(204).end();
        }
    });
});

app.delete("/products/:id", function(req, res) {
    db.collection(PRODUCTS_COLLECTION).deleteOne({_id: new ObjectID(req.params.id)}, function(err, result) {
        if (err) {
            handleError(res, err.message, "Failed to delete product");
        } else {
            res.status(204).end();
        }
    });
});