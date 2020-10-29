const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const geocoder = require("./utils/geocoder")
require('dotenv').config();
const User = require("./models/registerUser");

const app = express();

//middlewares
app.use(bodyParser.urlencoded({ extended : false }))
app.use(express.json())

// mongodb connection
mongoose
.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true
})
.then(() => console.log('DB Connected'));

//simple response
app.get("/", function(req, res){
    res.send("Hello World");
});

// Route for creating User deatils
app.post("/registeruser", function(req, res) {
    var user = new User();
    user.name = req.body.name;
    user.email = req.body.email;
    user.phoneNumber = req.body.phoneNumber;
    user.area = req.body.area;
    user.city = req.body.city;
    user.street = req.body.street;
    user.locality = req.body.locality;

    //saving to database
    user.save((err, user) => {
            if (err) {
                res.send(err);
            }
            res.json({
                user
            });
        });
  });

  // Route to get all user deatils
    app.get("/allUsers", function(req,res){
      User.find({}, function(err, foundItems){
          if(err){
              res.send(err);
          }
          res.json({foundItems})
      });
  });
    
    //Route for Searching user
    app.post("/searchUser",async (req,res) => {
      try {

          const address = `${req.body.area},${req.body.city}`;

          const Getlocation = await geocoder.geocode(address);

          const latitude = Getlocation[0].latitude;
          const longitude = Getlocation[1].longitude;
          const radius = req.body.distance / 6378;
            // console.log(Getlocation)
        const users = await User.find({
            phoneNumber: req.body.phoneNumber,
                    location: {
                        $geoWithin: { $centerSphere: [[longitude, latitude], radius] },
                }
        }).select(["name","phoneNumber","-_id"])
            
        res.status(200).json({ success : true , data: users })
      } catch (error) {
       res.status(500).json({ success: false, error: error.message });
    }
    });

    //route for edit profile
    app.patch('/users/me', async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['name', 'email', 'phoneNumber', 'city']
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))
  
    if (!isValidOperation) {
      return res.status(400).send({ error: 'Invalid updates!' })
    }
  
    try {
      updates.forEach((update) => req.user[update] = req.body[update])
      await req.user.save()
      res.send(req.user)
    } catch (e) {
      res.status(400).send(e)
    }
  });

    //route for delete user
     app.delete('/users/me', async (req, res) => {
    try {
      await req.user.remove()
      res.send(req.user)
    } catch (e) {
      res.status(500).send()
    }
  });


    const port = process.env.PORT || 8000;

    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
});

