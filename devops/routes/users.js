var express = require('express');
var router = express.Router();
const {db} = require("../services/database");

router.get('/', async (req, res) => {
    let users = await db.collection('users').find().toArray();
    res.json(users);
});

router.post('/', (req, res) => {
    db.collection('users').insertOne(req.body)
        .then((user) => res.status(201).json({"id": user.insertedId}))
        .catch(err => res.status(500).json(err));
})

module.exports = router;