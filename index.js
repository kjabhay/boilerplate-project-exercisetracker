const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require('mongoose')
let bodyParser = require('body-parser')

mongoose.connect(process.env.MONGO_URI);
let exercisesSchema = mongoose.Schema({
  userId: {type: String, required: true},
  description: {type: String, required: true},
  duration: {type: Number, min: 1, require: true},
  date: {type: Date, default: Date.now}
});

let exercises = mongoose.model('exercise', exercisesSchema);

let userSchema = mongoose.Schema({
  username: {type: String, required: true}
});

let user = mongoose.model("user", userSchema);


app.use(express.urlencoded({extended: true}));
app.use(cors());
app.use(express.static('public'));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post("/api/users", (req, res) => {
  let username = req.body.username;

  let newUser = new user({
    username: username
  });
  newUser.save()
    .then((savedUser) => {
      res.json({username: username, _id: savedUser._id});
    })
    .catch((err) => res.json(err));
  // res.json(req.body);
});

app.get("/api/users", (req,res) => {
  user.find({})
    .then((data) => res.json(data))
    .catch((err) => res.json(err));
});

app.post("/api/users/:_id/exercises", (req, res) => {
  _id = req.params._id;
  let date = (req.body.date !== undefined ? new Date(req.body.date) : new Date());
  user.findById(_id)
    .then((FoundRec) => {
      let newExercise = new exercises({
        userId: _id,
        description: req.body.description,
        duration: req.body.duration,
        date: date
      });

      newExercise.save()
        .then((saved) => {
          res.json({
            _id: _id,
            username: FoundRec.username,
            date: date.toDateString(),
            duration: saved.duration,
            description: saved.description
          });
        })
        .catch((err) => res.json(err));
    })
    .catch((err) => res.json(err));
});

app.get("/api/users/:_id/logs", (req, res) => {
  const {from, to, limit} = req.query;
  const _id = req.params._id;
  user.findById(_id)
    .then((userData) => {
      let dateObj = {};
      if(from) dateObj["$gte"] = new Date(from);
      if(to) dateObj["$lte"] = new Date(to);
      let filter = {
        userId: _id
      }
      if(from || to) filter.date = dateObj;
      exercises.find(filter).limit(+limit ?? 500)
        .then((exerciseData) => {
          res.json({
            username: userData.username,
            count: exerciseData.length,
            _id: userData._id,
            log: exerciseData.map((e) => {
              return {
                description: e.description,
                duration: e.duration,
                date: new Date(e.date).toDateString()
              };
            })
          })
        })
        .catch((err) => res.json(err));
    })
    .catch((err) => res.json(err));
});


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
