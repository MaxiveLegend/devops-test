var express = require('express');
var router = express.Router();
const {db} = require("../services/database");
const client = require("prom-client");

const guage = new client.Gauge({ name: "num_of_users_get_requests", help: "The amount of times the 'users' have been retrieved" });

router.get('/', async (req, res) => {
    guage.inc(1);
    let users = await db.collection('users').find().toArray();
    res.json(users);
});

router.get('/slow', async (req, res) => {
    guage.inc(1);
    let users = await db.collection('users').find().toArray();
    setTimeout(() => {
        res.json(users);
    }, 3000);
});

router.post('/', (req, res) => {
    db.collection('users').insertOne(req.body)
        .then((user) => res.status(201).json({"id": user.insertedId}))
        .catch(err => res.status(500).json(err));
})

module.exports = router;