const express = require("express");
const app = express();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const port = process.env.PORT || 4000;

app.use(express.json());
app.use(cors());

mongoose.connect("mongodb+srv://nikhilkumar:9Gkb1n1SIoM2WUg7@cluster0.jtwsc.mongodb.net/e-commerce");

app.get("/", (req, res) => {
    res.send("express App is Running");
  });
  
const storage = multer.diskStorage({
    destination: './upload/images',
    filename: (req, file, cb) => {
      return cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`)
    }
  })


const upload = multer({ storage: storage })

  app.use('/images', express.static('upload/images'))

  app.post("/upload", upload.single('product'), (req, res) => {
    res.json({
      success:1,
      image_url:`http://localhost:${port}/images/${req.file.filename}`
    })
  })

  const Product = mongoose.model("Product", {
    id: { type: Number, required: true },
    name: { type: String, required: true },
    image: { type: String, required: true },
    category: { type: String, required: true },
    new_price: { type: Number },
    old_price: { type: Number },
    date: { type: Date, default: Date.now },
    avilable: { type: Boolean, default: true },
  });


  app.post("/addproduct", async (req, res) =>{
  let products = await Product.find({});
  let id;
  if (products.length > 0) {
    let last_product_array = products.slice(-1);
    let last_product = last_product_array[0];
    id = last_product.id + 1;
  }
  else { id = 1; }
    const product=new Product(
      {
      id: id,
      name: req.body.name,
      image: req.body.image,
      category: req.body.category,
      new_price: req.body.new_price,
      old_price: req.body.old_price,
      });
      console.log(product);
      await product.save();
      console.log("Saved");
      res.json({ success: true, 
        name: req.body.name })
  })
  
  app.post("/removeproduct", async (req, res) => {
    await Product.findOneAndDelete({ id: req.body.id });
    console.log("Removed");
    res.json({ success: true, name: req.body.name })
  });

  app.get("/allproducts", async (req, res) => {
    let products = await Product.find({});
    console.log("All Products");
    res.send(products);
  });

  app.get("/newcollections", async (req, res) => {
    let products = await Product.find({});
    let arr = products.slice(0).slice(-8);
    console.log("New Collections");
    res.send(arr);
  });

  app.get("/popularinwomen", async (req, res) => {
    let products = await Product.find({ category: "women" });
    let arr = products.splice(0, 4);
    console.log("Popular In Women");
    res.send(arr);
  });


  const fetchuser = async (req, res, next) => {
    const token = req.header("auth-token");
    if (!token) {
      res.status(401).send({ errors: "Please authenticate using a valid token" });
    }
    try {
      const data = jwt.verify(token, "secret_ecom");
      req.user = data.user;
      next();
    } catch (error) {
      res.status(401).send({ errors: "Please authenticate using a valid token" });
    }
  };


  app.post('/addtocart',fetchuser,async (req, res) => {
    console.log("added",req.body.itemId);
    let userData = await Users.findOne({ _id: req.user.id });
    userData.cartData[req.body.itemId] += 1;
    await Users.findOneAndUpdate({ _id: req.user.id }, { cartData: userData.cartData });
    res.send("Added")
  })

  app.post('/removefromcart', fetchuser, async (req, res) => 
  {
    console.log("Remove Cart",req.body.itemId);
    let userData = await Users.findOne({ _id: req.user.id });
    if (userData.cartData[req.body.itemId] != 0) {
      userData.cartData[req.body.itemId] -= 1;
    }
    await Users.findOneAndUpdate({ _id: req.user.id }, { cartData: userData.cartData });
    res.send("Removed");
  })

  app.post('/getcart', fetchuser, async (req, res) => 
  {
    console.log("Get Cart");
    let userData = await Users.findOne({ _id: req.user.id });
    res.json(userData.cartData);
  })






  const Users = mongoose.model("Users", {
    name: { type: String },
    email: { type: String, unique: true },
    password: { type: String },
    cartData: { type: Object },
    date: { type: Date, default: Date.now() },
  });
  
  app.post('/signup', async (req, res) => {
    console.log("Sign Up");
    // let success = false;
    let check = await Users.findOne({ email: req.body.email });
    if (check) {
      return res.status(400).json({ success:false,errors: "existing user found with this email" });
    }
    let cart = {};
    for (let i = 0; i < 300; i++) 
    {
      cart[i] = 0;
    }
    const user = new Users({
      name: req.body.username,
      email: req.body.email,
      password: req.body.password,
      cartData: cart,
    });
    await user.save();
    const data = {
      user: {
        id: user.id
      }
    }

    const token = jwt.sign(data, 'secret_ecom');
    // success = true;
    res.json({success:true, token })
  })


  app.post('/login', async (req, res) => {
    console.log("Login");
    let success = false;
    let user = await Users.findOne({ email: req.body.email });
    if(user) 
    {
      const passCompare = req.body.password === user.password;
      if (passCompare) 
      {
        const data = {
          user: {
            id: user.id
          }
        }
        success = true;
        console.log(user.id);
        const token = jwt.sign(data, 'secret_ecom');
        res.json({ success, token });
      }
      else {
        return res.status(400).json({ success: success, errors: "please try with correct /password" })
      }
    }
    else {
      return res.status(400).json({ success: success, errors: "please try with correct email/password" })
    }
  })

  app.listen(port,(error)=>{
    if(!error)
    {
        console.log("server running on port " + port)
    }
    else
    {
        console.log("Error :" +error)
    }
})