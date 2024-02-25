const mongoose = require('mongoose');
const connect = mongoose.connect('mongodb://localhost:27017/shoping');
connect.then(()=>{
    console.log('Database connected...');
}).catch(()=>{
    console.log('database cannot be connected..')
})
const  dataSchema = new mongoose.Schema({
    Name:{
      type:String,
      required:true
    },
    Catorgery:{
        type:String,
        required:true
    },
    Price:{
        type:Number,
        required:true
    },
    Discription:{
        type:String,
        required:true
    }
});

const connection = new mongoose.model('productDetails',dataSchema);

module.exports = connection;
